from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException, ValidationException
from app.infrastructure.notifications import get_notification_provider
from app.infrastructure.repositories import CompanionRepository
from app.security.authentication import CurrentUser
from app.security.consent import ConsentAction, require_consent


def notify_family(
    db: Session,
    user: CurrentUser,
    *,
    contact_id: str,
    message: str,
    confirm: bool,
    share_health: bool = False,
) -> dict:
    require_consent(db, user.id, ConsentAction.NOTIFY_FAMILY, confirm)
    if share_health:
        require_consent(db, user.id, ConsentAction.SHARE_HEALTH, confirm)
    repo = CompanionRepository(db)
    contacts = repo.contacts(user.id)
    person = next((row for row in contacts if row.id == contact_id), None) or (contacts[0] if contacts else None)
    if person is None:
        raise NotFoundException("Add a family member first.")
    if not (message or "").strip():
        raise ValidationException("Write a short message first.")
    saved = repo.add_message(user.id, contact_id=person.id, to_name=person.name, text=message.strip())
    notice = get_notification_provider().notify_family(recipient=person.name, message=message)
    return {
        "id": saved.id,
        "to": person.name,
        "text": saved.text,
        "simulated": True,
        "notice": notice.message,
        "shared_health": share_health,
    }
