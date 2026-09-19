"""Deterministic emergency states. The LLM cannot choose transitions."""

from __future__ import annotations

from enum import Enum

from app.core.exceptions import ValidationException


class EmergencyState(str, Enum):
    NORMAL = "NORMAL"
    SOS_TRIGGERED = "SOS_TRIGGERED"
    ASSESSING = "ASSESSING"
    HELP_REQUESTED = "HELP_REQUESTED"
    FAMILY_NOTIFIED = "FAMILY_NOTIFIED"
    ASSISTANCE_ACTIVE = "ASSISTANCE_ACTIVE"
    RESOLVED = "RESOLVED"


_ALLOWED: dict[EmergencyState, frozenset[EmergencyState]] = {
    EmergencyState.NORMAL: frozenset({EmergencyState.SOS_TRIGGERED}),
    EmergencyState.SOS_TRIGGERED: frozenset({EmergencyState.ASSESSING, EmergencyState.RESOLVED}),
    EmergencyState.ASSESSING: frozenset({EmergencyState.HELP_REQUESTED, EmergencyState.RESOLVED}),
    EmergencyState.HELP_REQUESTED: frozenset({EmergencyState.FAMILY_NOTIFIED, EmergencyState.ASSISTANCE_ACTIVE, EmergencyState.RESOLVED}),
    EmergencyState.FAMILY_NOTIFIED: frozenset({EmergencyState.ASSISTANCE_ACTIVE, EmergencyState.RESOLVED}),
    EmergencyState.ASSISTANCE_ACTIVE: frozenset({EmergencyState.RESOLVED}),
    EmergencyState.RESOLVED: frozenset(),
}


class EmergencyStateMachine:
    def __init__(self, state: EmergencyState | str = EmergencyState.NORMAL):
        self.state = EmergencyState(state)

    def can_move(self, target: EmergencyState) -> bool:
        return target in _ALLOWED[self.state]

    def move(self, target: EmergencyState) -> EmergencyState:
        if not self.can_move(target):
            raise ValidationException(f"Emergency cannot move from {self.state.value} to {target.value}.")
        self.state = target
        return self.state

    def run_standard_path(self, *, notify_family: bool) -> list[EmergencyState]:
        """Owned by backend policy, not by model output."""
        trail = [self.move(EmergencyState.SOS_TRIGGERED)]
        trail.append(self.move(EmergencyState.ASSESSING))
        trail.append(self.move(EmergencyState.HELP_REQUESTED))
        if notify_family:
            trail.append(self.move(EmergencyState.FAMILY_NOTIFIED))
        trail.append(self.move(EmergencyState.ASSISTANCE_ACTIVE))
        return trail
