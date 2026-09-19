"""Notification adapters. Demo never claims a real SMS was sent."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class NotificationResult:
    simulated: bool
    channel: str
    recipient: str
    message: str


class NotificationProvider:
    def notify_family(self, *, recipient: str, message: str) -> NotificationResult:
        raise NotImplementedError


class SimulatedNotificationProvider(NotificationProvider):
    def notify_family(self, *, recipient: str, message: str) -> NotificationResult:
        return NotificationResult(
            simulated=True,
            channel="demo",
            recipient=recipient,
            message="Family notification simulated in this demo.",
        )


def get_notification_provider() -> NotificationProvider:
    return SimulatedNotificationProvider()
