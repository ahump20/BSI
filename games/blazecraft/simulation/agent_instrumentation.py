"""
Agent Instrumentation Layer for Blazecraft

Wraps MicroRTS agents to capture decision-making metadata:
- Intent classification (what strategy is the agent pursuing)
- Confidence levels
- Policy entropy (how certain is the agent about its decision)
- Action probabilities
- Decision timing

This is THE key differentiator for Blazecraft - understanding WHY agents act.
"""

import time
import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Callable
from enum import Enum


class IntentType(Enum):
    """High-level strategic intents that agents can pursue."""
    RUSH = "rush"       # Early aggressive pressure
    TECH = "tech"       # Technology/upgrade focus
    ECO = "eco"         # Economic expansion
    DEFEND = "defend"   # Defensive posture
    HARASS = "harass"   # Hit-and-run tactics


@dataclass
class AgentDecision:
    """Captured metadata about a single agent decision."""
    agent_id: str
    tick: int
    intent: IntentType
    reason: str
    confidence: float           # 0.0 - 1.0
    entropy: float              # Policy entropy (uncertainty)
    action_mask: List[bool]     # Which actions were valid
    action_probabilities: List[float]  # Policy output
    time_to_decision: float     # Milliseconds
    value_estimate: Optional[float] = None  # V(s) if available
    selected_action: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class IntentClassifier:
    """
    Classifies agent intent based on observable behavior.

    Uses a simple rule-based approach for now - can be replaced
    with learned classifiers later.
    """

    def __init__(self):
        self._history: List[Dict[str, Any]] = []
        self._window_size = 10  # Ticks to consider

    def classify(
        self,
        game_state: Dict[str, Any],
        agent_id: str,
        recent_actions: List[int]
    ) -> tuple[IntentType, str, float]:
        """
        Classify the agent's current intent.

        Returns:
            (intent, reason, confidence)
        """
        # Extract relevant features
        my_units = game_state.get('my_units', [])
        enemy_units = game_state.get('enemy_units', [])
        my_resources = game_state.get('my_resources', 0)
        my_workers = sum(1 for u in my_units if u.get('type') == 'worker')
        my_military = len(my_units) - my_workers

        # Simple heuristics
        if not recent_actions:
            return IntentType.ECO, "No actions yet, defaulting to economy", 0.5

        # Count action types
        build_actions = sum(1 for a in recent_actions if a in [12, 13])  # Build base/barracks
        produce_actions = sum(1 for a in recent_actions if a in [8, 9, 10, 11])  # Train units
        attack_actions = sum(1 for a in recent_actions if a == 5)  # Attack
        harvest_actions = sum(1 for a in recent_actions if a == 6)  # Harvest

        total = len(recent_actions)

        # Classify
        if attack_actions / total > 0.4 and my_military > 3:
            return IntentType.RUSH, f"High attack frequency ({attack_actions}/{total}), {my_military} military units", 0.85

        if harvest_actions / total > 0.5 and my_workers > 2:
            return IntentType.ECO, f"Focus on harvesting ({harvest_actions}/{total}), {my_workers} workers", 0.8

        if build_actions / total > 0.2:
            return IntentType.TECH, f"Building infrastructure ({build_actions} build actions)", 0.75

        if produce_actions / total > 0.3:
            if my_military < 5:
                return IntentType.DEFEND, f"Building army ({produce_actions} train actions), preparing defense", 0.7
            else:
                return IntentType.RUSH, f"Mass production ({produce_actions} train actions), preparing attack", 0.75

        # Default
        return IntentType.ECO, "Mixed actions, defaulting to economy focus", 0.5


class InstrumentedAgent:
    """
    Wrapper that instruments any MicroRTS agent to capture decision metadata.

    Usage:
        base_agent = PPOAgent(...)
        instrumented = InstrumentedAgent(base_agent, "blue-ppo")

        # In game loop:
        action = instrumented.get_action(obs)
        decision = instrumented.last_decision
    """

    def __init__(
        self,
        agent: Any,
        agent_id: str,
        intent_classifier: Optional[IntentClassifier] = None
    ):
        self.agent = agent
        self.agent_id = agent_id
        self.classifier = intent_classifier or IntentClassifier()
        self.last_decision: Optional[AgentDecision] = None
        self._tick = 0
        self._recent_actions: List[int] = []
        self._action_history_size = 20

    def get_action(
        self,
        observation: Any,
        game_state: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Get action from wrapped agent while capturing decision metadata.
        """
        start_time = time.perf_counter()

        # Get policy output from agent
        action, policy_info = self._get_agent_output(observation)

        decision_time = (time.perf_counter() - start_time) * 1000  # ms

        # Extract policy details
        action_probs = policy_info.get('action_probs', [])
        action_mask = policy_info.get('action_mask', [True] * len(action_probs))
        value_estimate = policy_info.get('value', None)

        # Calculate entropy
        entropy = self._calculate_entropy(action_probs, action_mask)

        # Classify intent
        game_state = game_state or {}
        intent, reason, confidence = self.classifier.classify(
            game_state, self.agent_id, self._recent_actions
        )

        # Record decision
        self.last_decision = AgentDecision(
            agent_id=self.agent_id,
            tick=self._tick,
            intent=intent,
            reason=reason,
            confidence=confidence,
            entropy=entropy,
            action_mask=action_mask,
            action_probabilities=action_probs,
            time_to_decision=decision_time,
            value_estimate=value_estimate,
            selected_action=action,
        )

        # Update history
        self._recent_actions.append(action)
        if len(self._recent_actions) > self._action_history_size:
            self._recent_actions.pop(0)

        self._tick += 1

        return action

    def _get_agent_output(self, observation: Any) -> tuple[int, Dict[str, Any]]:
        """
        Get action and policy info from the underlying agent.

        Override this for different agent interfaces.
        """
        # Try common interfaces
        if hasattr(self.agent, 'get_action_and_info'):
            return self.agent.get_action_and_info(observation)

        if hasattr(self.agent, 'get_action'):
            action = self.agent.get_action(observation)
            # Try to get policy info
            policy_info = {}
            if hasattr(self.agent, 'last_policy'):
                policy_info['action_probs'] = self.agent.last_policy.tolist()
            if hasattr(self.agent, 'last_value'):
                policy_info['value'] = float(self.agent.last_value)
            return action, policy_info

        # Fallback: just call the agent
        action = self.agent(observation)
        return action, {}

    def _calculate_entropy(
        self,
        probs: List[float],
        mask: List[bool]
    ) -> float:
        """Calculate policy entropy over valid actions."""
        if not probs:
            return 0.0

        probs_array = np.array(probs)
        mask_array = np.array(mask)

        # Only consider valid actions
        valid_probs = probs_array[mask_array]
        if len(valid_probs) == 0:
            return 0.0

        # Normalize
        valid_probs = valid_probs / valid_probs.sum()

        # Entropy: -sum(p * log(p))
        # Add small epsilon to avoid log(0)
        epsilon = 1e-10
        entropy = -np.sum(valid_probs * np.log(valid_probs + epsilon))

        return float(entropy)

    def reset(self):
        """Reset for new game."""
        self._tick = 0
        self._recent_actions = []
        self.last_decision = None


def create_reason_generator(
    classifier_type: str = "rule_based"
) -> Callable[[IntentType, Dict[str, Any]], str]:
    """
    Factory for creating human-readable reason generators.

    These explain WHY the agent chose its current intent.
    """
    def rule_based_reason(intent: IntentType, context: Dict[str, Any]) -> str:
        """Generate reason based on simple rules."""
        my_resources = context.get('my_resources', 0)
        enemy_count = context.get('enemy_military', 0)
        my_military = context.get('my_military', 0)

        templates = {
            IntentType.RUSH: [
                f"Military advantage ({my_military} vs {enemy_count}), pressing attack",
                f"Early aggression while enemy economy is weak",
                f"Resource lead ({my_resources}), converting to military pressure",
            ],
            IntentType.ECO: [
                f"Building economy before military investment",
                f"Resource deficit, focusing on worker production",
                f"Stable position, growing economy for late game",
            ],
            IntentType.TECH: [
                f"Investing in infrastructure for stronger units",
                f"Building production capacity",
                f"Preparing tech transition",
            ],
            IntentType.DEFEND: [
                f"Enemy pressure detected ({enemy_count} units), fortifying",
                f"Military disadvantage, building defense",
                f"Protecting economic expansion",
            ],
            IntentType.HARASS: [
                f"Exploiting enemy weaknesses with mobile units",
                f"Disrupting enemy economy",
                f"Keeping enemy off-balance",
            ],
        }

        import random
        return random.choice(templates.get(intent, ["Executing strategy"]))

    return rule_based_reason


# ─────────────────────────────────────────────────────────────
# Example usage
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Demo with mock agent
    class MockAgent:
        def get_action(self, obs):
            import random
            return random.randint(0, 13)

        @property
        def last_policy(self):
            import random
            probs = [random.random() for _ in range(14)]
            total = sum(probs)
            return np.array([p / total for p in probs])

    agent = InstrumentedAgent(MockAgent(), "demo-agent")

    for tick in range(5):
        action = agent.get_action(None, {})
        decision = agent.last_decision
        print(f"\nTick {tick}:")
        print(f"  Action: {action}")
        print(f"  Intent: {decision.intent.value}")
        print(f"  Reason: {decision.reason}")
        print(f"  Confidence: {decision.confidence:.2f}")
        print(f"  Entropy: {decision.entropy:.3f}")
        print(f"  Decision time: {decision.time_to_decision:.2f}ms")
