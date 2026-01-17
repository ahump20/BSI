"""
MicroRTS Game Runner for Blazecraft

Orchestrates running MicroRTS games and collecting instrumented replay data.
This is the entry point for generating replay files.

Usage:
    python microrts_runner.py --map maps/8x8/basesWorkers8x8.xml --p1 ppo --p2 a2c --output replay.json

Requirements:
    pip install gym-microrts numpy

Note: MicroRTS-Py must be installed. See:
    https://github.com/Farama-Foundation/MicroRTS-Py
"""

import argparse
import json
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict

# Local imports
from agent_instrumentation import InstrumentedAgent, IntentClassifier, AgentDecision
from replay_exporter import ReplayExporter, BlazecraftReplay


@dataclass
class GameConfig:
    """Configuration for a single game run."""
    map_path: str
    max_ticks: int = 3000
    render: bool = False
    seed: Optional[int] = None


@dataclass
class AgentConfig:
    """Configuration for an agent."""
    agent_type: str  # ppo, a2c, random, scripted
    name: str
    team: str  # "0" or "1"
    checkpoint_path: Optional[str] = None


class MicroRTSRunner:
    """
    Orchestrates MicroRTS game execution with instrumented agents.

    Handles:
    - Environment setup
    - Agent loading/wrapping
    - Game loop execution
    - Replay data collection
    """

    def __init__(self, game_config: GameConfig):
        self.config = game_config
        self.env = None
        self.agents: List[InstrumentedAgent] = []
        self.exporter = ReplayExporter()
        self._tick = 0

    def setup_environment(self) -> bool:
        """
        Initialize MicroRTS environment.

        Returns True if successful, False otherwise.
        """
        try:
            # Try to import gym-microrts
            import gym_microrts
            from gym_microrts import microrts_ai

            # Create environment
            self.env = gym_microrts.make(
                self.config.map_path,
                max_steps=self.config.max_ticks,
                render_mode="human" if self.config.render else None,
            )

            if self.config.seed is not None:
                self.env.seed(self.config.seed)

            print(f"[Runner] Environment created: {self.config.map_path}")
            return True

        except ImportError as e:
            print(f"[Runner] Error: gym-microrts not installed. {e}")
            print("[Runner] Install with: pip install gym-microrts")
            return False

        except Exception as e:
            print(f"[Runner] Failed to create environment: {e}")
            return False

    def load_agent(self, agent_config: AgentConfig) -> Optional[InstrumentedAgent]:
        """
        Load and wrap an agent based on configuration.

        Supports:
        - ppo: Proximal Policy Optimization agent
        - a2c: Advantage Actor-Critic agent
        - random: Random action selection
        - scripted: Built-in scripted AI
        """
        try:
            base_agent = self._create_base_agent(agent_config)
            if base_agent is None:
                return None

            # Wrap with instrumentation
            agent_id = f"{agent_config.team}-{agent_config.agent_type}"
            instrumented = InstrumentedAgent(
                agent=base_agent,
                agent_id=agent_id,
                intent_classifier=IntentClassifier()
            )

            print(f"[Runner] Loaded agent: {agent_config.name} ({agent_config.agent_type})")
            return instrumented

        except Exception as e:
            print(f"[Runner] Failed to load agent {agent_config.name}: {e}")
            return None

    def _create_base_agent(self, config: AgentConfig) -> Any:
        """Create the underlying agent based on type."""
        if config.agent_type == "random":
            return RandomAgent(self.env.action_space if self.env else None)

        if config.agent_type == "scripted":
            try:
                from gym_microrts import microrts_ai
                return microrts_ai.randomAI
            except ImportError:
                print("[Runner] Warning: Using fallback random agent")
                return RandomAgent(None)

        if config.agent_type in ("ppo", "a2c"):
            return self._load_trained_agent(config)

        print(f"[Runner] Unknown agent type: {config.agent_type}")
        return RandomAgent(None)

    def _load_trained_agent(self, config: AgentConfig) -> Any:
        """Load a trained RL agent from checkpoint."""
        if not config.checkpoint_path:
            print(f"[Runner] No checkpoint for {config.agent_type}, using random")
            return RandomAgent(None)

        try:
            # Try stable-baselines3
            from stable_baselines3 import PPO, A2C

            AgentClass = PPO if config.agent_type == "ppo" else A2C
            agent = AgentClass.load(config.checkpoint_path)
            return StableBaselinesWrapper(agent)

        except ImportError:
            print("[Runner] stable-baselines3 not installed")
            return RandomAgent(None)

        except Exception as e:
            print(f"[Runner] Failed to load checkpoint: {e}")
            return RandomAgent(None)

    def run_game(
        self,
        agent_configs: List[AgentConfig]
    ) -> Optional[BlazecraftReplay]:
        """
        Run a complete game and return the replay.
        """
        if not self.env:
            print("[Runner] Environment not initialized")
            return None

        # Load agents
        self.agents = []
        for config in agent_configs:
            agent = self.load_agent(config)
            if agent:
                self.agents.append(agent)

        if len(self.agents) < 2:
            print("[Runner] Need at least 2 agents")
            return None

        # Initialize replay
        match_id = f"bc_{uuid.uuid4().hex[:12]}"
        self.exporter.start_replay(
            match_id=match_id,
            map_name=Path(self.config.map_path).stem,
            map_width=16,  # Will be overridden by env
            map_height=16,
            agents=[
                {
                    "id": agent.agent_id,
                    "name": cfg.name,
                    "team": cfg.team,
                    "type": cfg.agent_type,
                }
                for agent, cfg in zip(self.agents, agent_configs)
            ]
        )

        # Reset environment
        obs = self.env.reset()
        self._tick = 0
        done = False

        print(f"[Runner] Starting game {match_id}")
        game_start = time.time()

        # Game loop
        while not done and self._tick < self.config.max_ticks:
            # Get game state for context
            game_state = self._extract_game_state()

            # Get actions from all agents
            actions = []
            decisions: List[AgentDecision] = []

            for i, agent in enumerate(self.agents):
                player_obs = self._get_player_observation(obs, i)
                action = agent.get_action(player_obs, game_state)
                actions.append(action)
                if agent.last_decision:
                    decisions.append(agent.last_decision)

            # Execute step
            obs, rewards, done, info = self.env.step(actions)

            # Record tick
            units = self._extract_units()
            self.exporter.add_tick(
                tick=self._tick,
                units=units,
                resources=self._extract_resources(),
                actions=self._extract_actions(actions),
                agent_states=decisions,
            )

            self._tick += 1

            # Progress indicator
            if self._tick % 100 == 0:
                elapsed = time.time() - game_start
                print(f"[Runner] Tick {self._tick}/{self.config.max_ticks} ({elapsed:.1f}s)")

        # Finalize
        duration = self._tick
        print(f"[Runner] Game complete: {duration} ticks")

        return self.exporter.finalize_replay(duration)

    def _extract_game_state(self) -> Dict[str, Any]:
        """Extract current game state for intent classification."""
        # This would be populated from actual MicroRTS state
        return {
            "my_units": [],
            "enemy_units": [],
            "my_resources": 0,
            "tick": self._tick,
        }

    def _get_player_observation(self, obs: Any, player_idx: int) -> Any:
        """Get observation for specific player."""
        if isinstance(obs, (list, tuple)) and len(obs) > player_idx:
            return obs[player_idx]
        return obs

    def _extract_units(self) -> List[Dict[str, Any]]:
        """Extract unit states from environment."""
        # Would be populated from actual MicroRTS state
        return []

    def _extract_resources(self) -> Dict[str, Dict[str, int]]:
        """Extract resource states."""
        return {
            "0": {"minerals": 100},
            "1": {"minerals": 100},
        }

    def _extract_actions(self, actions: List[int]) -> List[Dict[str, Any]]:
        """Convert actions to serializable format."""
        action_names = [
            "idle", "move_n", "move_s", "move_e", "move_w",
            "attack", "harvest", "return", "produce_worker",
            "produce_light", "produce_heavy", "produce_ranged",
            "build_base", "build_barracks"
        ]
        return [
            {
                "agent_idx": i,
                "action_id": a,
                "action_name": action_names[a] if a < len(action_names) else f"action_{a}",
            }
            for i, a in enumerate(actions)
        ]

    def cleanup(self):
        """Clean up resources."""
        if self.env:
            self.env.close()
        for agent in self.agents:
            agent.reset()


class RandomAgent:
    """Simple random agent for testing."""

    def __init__(self, action_space: Any = None):
        self.action_space = action_space
        self._last_policy = None

    def get_action(self, obs: Any) -> int:
        import numpy as np
        if self.action_space and hasattr(self.action_space, 'n'):
            n_actions = self.action_space.n
        else:
            n_actions = 14

        # Generate random policy
        probs = np.random.dirichlet(np.ones(n_actions))
        self._last_policy = probs
        return int(np.random.choice(n_actions, p=probs))

    @property
    def last_policy(self):
        return self._last_policy


class StableBaselinesWrapper:
    """Wrapper for stable-baselines3 agents."""

    def __init__(self, model: Any):
        self.model = model
        self._last_policy = None
        self._last_value = None

    def get_action(self, obs: Any) -> int:
        action, _ = self.model.predict(obs, deterministic=False)

        # Try to get policy info
        try:
            import torch
            with torch.no_grad():
                obs_tensor = torch.as_tensor(obs).unsqueeze(0)
                dist = self.model.policy.get_distribution(obs_tensor)
                self._last_policy = dist.distribution.probs.numpy().flatten()
                value = self.model.policy.predict_values(obs_tensor)
                self._last_value = value.item()
        except Exception:
            pass

        return int(action)

    @property
    def last_policy(self):
        return self._last_policy

    @property
    def last_value(self):
        return self._last_value


# ─────────────────────────────────────────────────────────────
# CLI Entry Point
# ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Run MicroRTS game and export replay")
    parser.add_argument("--map", type=str, default="maps/8x8/basesWorkers8x8.xml",
                        help="Map file path")
    parser.add_argument("--p1", type=str, default="random",
                        help="Player 1 agent type (ppo, a2c, random, scripted)")
    parser.add_argument("--p2", type=str, default="random",
                        help="Player 2 agent type")
    parser.add_argument("--p1-name", type=str, default="BlueBot",
                        help="Player 1 name")
    parser.add_argument("--p2-name", type=str, default="RedBot",
                        help="Player 2 name")
    parser.add_argument("--p1-checkpoint", type=str, default=None,
                        help="Player 1 checkpoint path")
    parser.add_argument("--p2-checkpoint", type=str, default=None,
                        help="Player 2 checkpoint path")
    parser.add_argument("--max-ticks", type=int, default=3000,
                        help="Maximum game ticks")
    parser.add_argument("--output", type=str, default="replay.json",
                        help="Output replay file")
    parser.add_argument("--render", action="store_true",
                        help="Render game visually")
    parser.add_argument("--seed", type=int, default=None,
                        help="Random seed")

    args = parser.parse_args()

    # Create configs
    game_config = GameConfig(
        map_path=args.map,
        max_ticks=args.max_ticks,
        render=args.render,
        seed=args.seed,
    )

    agent_configs = [
        AgentConfig(
            agent_type=args.p1,
            name=args.p1_name,
            team="0",
            checkpoint_path=args.p1_checkpoint,
        ),
        AgentConfig(
            agent_type=args.p2,
            name=args.p2_name,
            team="1",
            checkpoint_path=args.p2_checkpoint,
        ),
    ]

    # Run game
    runner = MicroRTSRunner(game_config)

    if not runner.setup_environment():
        print("[Main] Failed to setup environment")
        print("[Main] Running in demo mode with mock data...")

        # Create demo replay instead
        from replay_exporter import create_demo_replay
        replay = create_demo_replay()
    else:
        replay = runner.run_game(agent_configs)
        runner.cleanup()

    if replay:
        # Export
        output_path = Path(args.output)
        with open(output_path, 'w') as f:
            json.dump(asdict(replay) if hasattr(replay, '__dataclass_fields__') else replay.to_dict(), f, indent=2)
        print(f"[Main] Replay saved to {output_path}")
    else:
        print("[Main] No replay generated")


if __name__ == "__main__":
    main()
