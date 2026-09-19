"""Persistence adapters. Routes never talk to SQLAlchemy models directly."""

from __future__ import annotations

import json
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.database.models import (
    ConversationTurn,
    EmergencyCase,
    FamilyContact,
    FamilyMessage,
    MemoryNote,
    TaskItem,
    UploadMeta,
    User,
)

DEMO_USER_ID = "demo-sharma"


class CompanionRepository:
    def __init__(self, db: Session):
        self.db = db

    def ensure_demo_user(self) -> User:
        user = self.db.get(User, DEMO_USER_ID)
        if user:
            return user
        user = User(
            id=DEMO_USER_ID,
            name="Mr. Sharma",
            role="demo",
            age="72",
            sex="male",
            city="Noida",
            blood_type="B+",
            allergies_json=json.dumps([{"substance": "Penicillin", "severity": "Severe"}]),
            conditions_json=json.dumps([{"name": "Hypertension"}, {"name": "Type 2 Diabetes"}]),
            medications_json=json.dumps([
                {"name": "Amlodipine", "dose": "5 mg", "frequency": "Once daily"},
                {"name": "Metformin", "dose": "500 mg", "frequency": "Twice daily"},
            ]),
            notes="Prefers morning appointments. Lives in Noida Sector 62.",
        )
        self.db.add(user)
        self.db.add_all([
            FamilyContact(
                id="demo-priya",
                user_id=DEMO_USER_ID,
                name="Priya Sharma",
                relation="Daughter",
                phone="+91 98100 11223",
                can_emergency=True,
                can_safety=True,
                can_daily=True,
            ),
            FamilyContact(
                id="demo-rahul",
                user_id=DEMO_USER_ID,
                name="Rahul Sharma",
                relation="Son",
                phone="+91 98200 44556",
                can_emergency=True,
                can_safety=False,
                can_daily=False,
            ),
            MemoryNote(user_id=DEMO_USER_ID, text="Priya is my daughter. Her birthday is 12 October."),
            MemoryNote(user_id=DEMO_USER_ID, text="I prefer doctor appointments in the morning."),
            TaskItem(user_id=DEMO_USER_ID, title="Doctor appointment", day=str(date.today()), time="11:30", kind="appointment"),
            TaskItem(user_id=DEMO_USER_ID, title="Call Priya", day=str(date.today()), time="16:00", kind="family"),
            TaskItem(user_id=DEMO_USER_ID, title="Evening medicine", day=str(date.today()), time="20:00", kind="medicine"),
        ])
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_user(self, user_id: str) -> User | None:
        return self.db.get(User, user_id)

    def contacts(self, user_id: str) -> list[FamilyContact]:
        return list(self.db.scalars(select(FamilyContact).where(FamilyContact.user_id == user_id)))

    def memories(self, user_id: str, limit: int = 12) -> list[MemoryNote]:
        stmt = select(MemoryNote).where(MemoryNote.user_id == user_id).order_by(MemoryNote.created_at.desc()).limit(limit)
        return list(self.db.scalars(stmt))

    def tasks_for_day(self, user_id: str, day: str | None = None) -> list[TaskItem]:
        day = day or str(date.today())
        stmt = select(TaskItem).where(TaskItem.user_id == user_id, TaskItem.day == day).order_by(TaskItem.time)
        return list(self.db.scalars(stmt))

    def add_memory(self, user_id: str, text: str) -> MemoryNote:
        row = MemoryNote(user_id=user_id, text=text)
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return row

    def add_task(self, user_id: str, title: str, *, time: str = "", kind: str = "reminder") -> TaskItem:
        row = TaskItem(user_id=user_id, title=title, day=str(date.today()), time=time, kind=kind)
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return row

    def add_message(self, user_id: str, *, contact_id: str, to_name: str, text: str) -> FamilyMessage:
        row = FamilyMessage(user_id=user_id, contact_id=contact_id, to_name=to_name, text=text, simulated=True)
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return row

    def messages(self, user_id: str, limit: int = 20) -> list[FamilyMessage]:
        stmt = (
            select(FamilyMessage)
            .where(FamilyMessage.user_id == user_id)
            .order_by(FamilyMessage.created_at.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt))

    def add_turn(self, user_id: str, role: str, text: str, intent: str = "") -> None:
        self.db.add(ConversationTurn(user_id=user_id, role=role, text=text, intent=intent))
        self.db.commit()

    def add_upload(self, user_id: str, filename: str, mime: str, size: int, purpose: str) -> UploadMeta:
        row = UploadMeta(user_id=user_id, filename=filename, mime=mime, size=size, purpose=purpose)
        self.db.add(row)
        self.db.commit()
        return row


class EmergencyRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, emergency_id: str) -> EmergencyCase | None:
        return self.db.get(EmergencyCase, emergency_id)

    def active_for(self, user_id: str) -> EmergencyCase | None:
        stmt = (
            select(EmergencyCase)
            .where(EmergencyCase.user_id == user_id, EmergencyCase.state != "RESOLVED")
            .order_by(EmergencyCase.created_at.desc())
        )
        return self.db.scalars(stmt).first()

    def save(self, case: EmergencyCase) -> EmergencyCase:
        self.db.add(case)
        self.db.commit()
        self.db.refresh(case)
        return case
