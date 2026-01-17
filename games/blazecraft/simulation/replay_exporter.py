"""
Replay Exporter for Blazecraft

Serializes MicroRTS game state and agent decisions into the
Blazecraft replay JSON format.

The output format matches src/data/replay-schema.ts exactly.
"""

import json
import uuid
from datetime import datetime, timezone
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Any, Optional
from pathlib import Path

# Try to import instrumentation types
try:
    from agent_instrumentation import AgentDecision, IntentType
except ImportError:
    # Fallback for standalone usage
    from enum import Enum

    class IntentType(Enum):
        RUSH = "rush"
        TECH = "tech"
        ECO = "eco"
        DEFEND = "defend"
        HARASS = "harass"

    @dataclass
    class AgentDecision:
        agent_id: str = ""
        tick: int = 0
        intent: IntentType = IntentType.ECO
        reason: str = ""
        confidence: float = 0.5
        entropy: float = 0.0
        action_mask: List[bool] = field(default_factory=list)
        action_probabilities: List[float] = field(default_factory=list)
        time_to_decision: float = 0.0
        value_estimate: Optional[float] = None
        selected_action: Optional[int] = None
        metadata: Dict[str, Any] = field(default_factory=dict)


# ─────────────────────────────────────────────────────────────
# Data Classes matching replay-schema.ts
# ─────────────────────────────────────────────────────────────

@dataclass
class Position:
    x: int
    y: int


@dataclass
class Unit:
    id: str
    type: str  # base, barracks, worker, light, heavy, ranged, resource
    team: str  # "0", "1", "-1" for neutral
    position: Position
    hp: int
    maxHp: int
    resources: Optional[int] = None
    currentAction: Optional[str] = None
    targetId: Optional[str] = None
    targetPosition: Optional[Position] = None
    productionProgress: Optional[float] = None


@dataclass
class AgentState:
    agentId: str
    intent: str  # rush, tech, eco, defend, harass
    reason: str
    confidence: float
    entropy: float
    timeToDecision: float
    actionMask: Optional[List[bool]] = None
    actionProbabilities: Optional[List[float]] = None
    valueEstimate: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class Action:
    unitId: str
    type: str  # move, attack, harvest, return_resources, produce, build, idle
    position: Optional[Position] = None
    targetId: Optional[str] = None
    produceType: Optional[str] = None


@dataclass
class ResourceState:
    minerals: int


@dataclass
class ReplayTick:
    tick: int
    units: List[Unit]
    resources: Dict[str, ResourceState]
    actions: List[Action]
    agentStates: List[AgentState]


@dataclass
class MapCell:
    x: int
    y: int
    terrain: str  # ground, wall, resource


@dataclass
class MapData:
    name: str
    width: int
    height: int
    cells: List[MapCell]


@dataclass
class AgentInfo:
    id: str
    name: str
    team: str
    type: str


@dataclass
class ReplayMetadata:
    matchId: str
    timestamp: str
    map: MapData
    agents: List[AgentInfo]
    duration: int
    gameVersion: Optional[str] = None


@dataclass
class BlazecraftReplay:
    version: str
    metadata: ReplayMetadata
    ticks: List[ReplayTick]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "version": self.version,
            "metadata": {
                "matchId": self.metadata.matchId,
                "timestamp": self.metadata.timestamp,
                "map": {
                    "name": self.metadata.map.name,
                    "width": self.metadata.map.width,
                    "height": self.metadata.map.height,
                    "cells": [
                        {"x": c.x, "y": c.y, "terrain": c.terrain}
                        for c in self.metadata.map.cells
                    ],
                },
                "agents": [
                    {"id": a.id, "name": a.name, "team": a.team, "type": a.type}
                    for a in self.metadata.agents
                ],
                "duration": self.metadata.duration,
                "gameVersion": self.metadata.gameVersion,
            },
            "ticks": [
                {
                    "tick": t.tick,
                    "units": [
                        {
                            "id": u.id,
                            "type": u.type,
                            "team": u.team,
                            "position": {"x": u.position.x, "y": u.position.y},
                            "hp": u.hp,
                            "maxHp": u.maxHp,
                            **({"resources": u.resources} if u.resources is not None else {}),
                            **({"currentAction": u.currentAction} if u.currentAction else {}),
                            **({"targetId": u.targetId} if u.targetId else {}),
                            **({"targetPosition": {"x": u.targetPosition.x, "y": u.targetPosition.y}} if u.targetPosition else {}),
                            **({"productionProgress": u.productionProgress} if u.productionProgress is not None else {}),
                        }
                        for u in t.units
                    ],
                    "resources": {
                        k: {"minerals": v.minerals}
                        for k, v in t.resources.items()
                    },
                    "actions": [
                        {
                            "unitId": a.unitId,
                            "type": a.type,
                            **({"position": {"x": a.position.x, "y": a.position.y}} if a.position else {}),
                            **({"targetId": a.targetId} if a.targetId else {}),
                            **({"produceType": a.produceType} if a.produceType else {}),
                        }
                        for a in t.actions
                    ],
                    "agentStates": [
                        {
                            "agentId": s.agentId,
                            "intent": s.intent,
                            "reason": s.reason,
                            "confidence": s.confidence,
                            "entropy": s.entropy,
                            "timeToDecision": s.timeToDecision,
                            **({"actionMask": s.actionMask} if s.actionMask else {}),
                            **({"actionProbabilities": s.actionProbabilities} if s.actionProbabilities else {}),
                            **({"valueEstimate": s.valueEstimate} if s.valueEstimate is not None else {}),
                            **({"metadata": s.metadata} if s.metadata else {}),
                        }
                        for s in t.agentStates
                    ],
                }
                for t in self.ticks
            ],
        }


class ReplayExporter:
    """
    Builds Blazecraft replay data incrementally during game execution.

    Usage:
        exporter = ReplayExporter()
        exporter.start_replay(match_id="...", map_name="...", ...)

        for tick in game_loop:
            exporter.add_tick(tick, units, resources, actions, agent_states)

        replay = exporter.finalize_replay(duration)
    """

    def __init__(self, version: str = "1.0.0"):
        self.version = version
        self.metadata: Optional[ReplayMetadata] = None
        self.ticks: List[ReplayTick] = []

    def start_replay(
        self,
        match_id: str,
        map_name: str,
        map_width: int,
        map_height: int,
        agents: List[Dict[str, str]],
        map_cells: Optional[List[Dict[str, Any]]] = None,
        game_version: Optional[str] = None,
    ):
        """Initialize replay metadata."""
        # Generate map cells if not provided
        if map_cells is None:
            map_cells = []
            for y in range(map_height):
                for x in range(map_width):
                    terrain = "ground"
                    # Simple resource placement at corners
                    if (x < 2 and y < 2) or (x >= map_width - 2 and y >= map_height - 2):
                        if (x + y) % 3 == 0:
                            terrain = "resource"
                    map_cells.append({"x": x, "y": y, "terrain": terrain})

        self.metadata = ReplayMetadata(
            matchId=match_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            map=MapData(
                name=map_name,
                width=map_width,
                height=map_height,
                cells=[MapCell(**c) for c in map_cells],
            ),
            agents=[AgentInfo(**a) for a in agents],
            duration=0,
            gameVersion=game_version,
        )
        self.ticks = []

    def add_tick(
        self,
        tick: int,
        units: List[Dict[str, Any]],
        resources: Dict[str, Dict[str, int]],
        actions: List[Dict[str, Any]],
        agent_states: List[AgentDecision],
    ):
        """Add a single tick of game state."""
        # Convert units
        converted_units = []
        for u in units:
            pos = u.get("position", {"x": 0, "y": 0})
            unit = Unit(
                id=u.get("id", str(uuid.uuid4())[:8]),
                type=u.get("type", "worker"),
                team=str(u.get("team", "0")),
                position=Position(pos.get("x", 0), pos.get("y", 0)),
                hp=u.get("hp", 100),
                maxHp=u.get("maxHp", 100),
                resources=u.get("resources"),
                currentAction=u.get("currentAction"),
                targetId=u.get("targetId"),
                targetPosition=Position(**u["targetPosition"]) if u.get("targetPosition") else None,
                productionProgress=u.get("productionProgress"),
            )
            converted_units.append(unit)

        # Convert resources
        converted_resources = {
            team: ResourceState(minerals=r.get("minerals", 0))
            for team, r in resources.items()
        }

        # Convert actions
        converted_actions = []
        for a in actions:
            action = Action(
                unitId=a.get("unitId", a.get("unit_id", "")),
                type=a.get("type", a.get("action_name", "idle")),
                position=Position(**a["position"]) if a.get("position") else None,
                targetId=a.get("targetId"),
                produceType=a.get("produceType"),
            )
            converted_actions.append(action)

        # Convert agent states
        converted_agent_states = []
        for state in agent_states:
            if isinstance(state, AgentDecision):
                intent_value = state.intent.value if isinstance(state.intent, IntentType) else state.intent
                agent_state = AgentState(
                    agentId=state.agent_id,
                    intent=intent_value,
                    reason=state.reason,
                    confidence=state.confidence,
                    entropy=state.entropy,
                    timeToDecision=state.time_to_decision,
                    actionMask=state.action_mask if state.action_mask else None,
                    actionProbabilities=state.action_probabilities if state.action_probabilities else None,
                    valueEstimate=state.value_estimate,
                    metadata=state.metadata if state.metadata else None,
                )
            else:
                # Dict format
                agent_state = AgentState(**state)
            converted_agent_states.append(agent_state)

        tick_data = ReplayTick(
            tick=tick,
            units=converted_units,
            resources=converted_resources,
            actions=converted_actions,
            agentStates=converted_agent_states,
        )
        self.ticks.append(tick_data)

    def finalize_replay(self, duration: int) -> BlazecraftReplay:
        """Finalize and return the complete replay."""
        if self.metadata is None:
            raise ValueError("Replay not started. Call start_replay first.")

        self.metadata.duration = duration

        return BlazecraftReplay(
            version=self.version,
            metadata=self.metadata,
            ticks=self.ticks,
        )

    def export_to_file(self, path: Path, replay: BlazecraftReplay):
        """Export replay to JSON file."""
        with open(path, 'w') as f:
            json.dump(replay.to_dict(), f, indent=2)


def create_demo_replay(num_ticks: int = 100) -> BlazecraftReplay:
    """
    Create a demonstration replay with synthetic data.

    Useful for testing the viewer without running actual MicroRTS games.
    """
    import random
    import math

    match_id = f"bc_demo_{uuid.uuid4().hex[:8]}"
    map_width, map_height = 16, 16

    # Create exporter
    exporter = ReplayExporter()
    exporter.start_replay(
        match_id=match_id,
        map_name="demo_battlefield",
        map_width=map_width,
        map_height=map_height,
        agents=[
            {"id": "agent-blue", "name": "BlueBot-PPO", "team": "0", "type": "PPO"},
            {"id": "agent-red", "name": "RedBot-A2C", "team": "1", "type": "A2C"},
        ],
        game_version="demo-1.0",
    )

    # Generate units with trajectories
    units = [
        {"id": "base-0", "type": "base", "team": "0", "hp": 100, "maxHp": 100, "x": 2, "y": 2},
        {"id": "base-1", "type": "base", "team": "1", "hp": 100, "maxHp": 100, "x": 13, "y": 13},
        {"id": "worker-0a", "type": "worker", "team": "0", "hp": 50, "maxHp": 50, "x": 3, "y": 2},
        {"id": "worker-1a", "type": "worker", "team": "1", "hp": 50, "maxHp": 50, "x": 12, "y": 13},
    ]

    # Strategy phases
    phases = [
        (0, 30, "eco", "eco"),      # Both eco
        (30, 50, "tech", "eco"),    # Blue techs
        (50, 70, "rush", "defend"), # Blue rushes
        (70, 100, "harass", "eco"), # Late game
    ]

    for tick in range(num_ticks):
        # Determine current phase
        blue_intent, red_intent = "eco", "eco"
        for start, end, b_int, r_int in phases:
            if start <= tick < end:
                blue_intent, red_intent = b_int, r_int
                break

        # Update unit positions (simple oscillation)
        tick_units = []
        for u in units:
            pos_x = u["x"] + int(2 * math.sin(tick * 0.1 + hash(u["id"]) % 10))
            pos_y = u["y"] + int(2 * math.cos(tick * 0.1 + hash(u["id"]) % 10))
            pos_x = max(0, min(map_width - 1, pos_x))
            pos_y = max(0, min(map_height - 1, pos_y))

            tick_units.append({
                "id": u["id"],
                "type": u["type"],
                "team": u["team"],
                "position": {"x": pos_x, "y": pos_y},
                "hp": u["hp"],
                "maxHp": u["maxHp"],
                "currentAction": random.choice(["idle", "move", "harvest", "attack"]),
            })

        # Generate agent states
        def make_probs():
            probs = [random.random() for _ in range(14)]
            total = sum(probs)
            return [p / total for p in probs]

        blue_state = AgentDecision(
            agent_id="agent-blue",
            tick=tick,
            intent=IntentType(blue_intent),
            reason=f"Executing {blue_intent} strategy based on game state",
            confidence=0.7 + random.random() * 0.25,
            entropy=0.3 + random.random() * 0.4,
            action_mask=[True] * 14,
            action_probabilities=make_probs(),
            time_to_decision=5 + random.random() * 10,
            value_estimate=0.5 + random.random() * 0.3,
        )

        red_state = AgentDecision(
            agent_id="agent-red",
            tick=tick,
            intent=IntentType(red_intent),
            reason=f"Responding with {red_intent} strategy",
            confidence=0.6 + random.random() * 0.3,
            entropy=0.4 + random.random() * 0.3,
            action_mask=[True] * 14,
            action_probabilities=make_probs(),
            time_to_decision=8 + random.random() * 12,
            value_estimate=0.4 + random.random() * 0.3,
        )

        exporter.add_tick(
            tick=tick,
            units=tick_units,
            resources={
                "0": {"minerals": 100 + tick * 2},
                "1": {"minerals": 100 + tick * 2},
            },
            actions=[
                {"unitId": "worker-0a", "type": "harvest", "action_name": "harvest"},
                {"unitId": "worker-1a", "type": "harvest", "action_name": "harvest"},
            ],
            agent_states=[blue_state, red_state],
        )

    return exporter.finalize_replay(num_ticks)


# ─────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate demo replay")
    parser.add_argument("--ticks", type=int, default=100, help="Number of ticks")
    parser.add_argument("--output", type=str, default="demo-replay.json", help="Output file")
    args = parser.parse_args()

    print(f"Generating demo replay with {args.ticks} ticks...")
    replay = create_demo_replay(args.ticks)

    output_path = Path(args.output)
    with open(output_path, 'w') as f:
        json.dump(replay.to_dict(), f, indent=2)

    print(f"Saved to {output_path}")
    print(f"  Match ID: {replay.metadata.matchId}")
    print(f"  Agents: {[a.name for a in replay.metadata.agents]}")
    print(f"  Duration: {replay.metadata.duration} ticks")
