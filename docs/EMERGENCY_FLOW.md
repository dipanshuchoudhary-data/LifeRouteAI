# Emergency flow

States are owned by `EmergencyStateMachine`. The model cannot skip ahead.

```
NORMAL
  → SOS_TRIGGERED
  → ASSESSING
  → HELP_REQUESTED
  → FAMILY_NOTIFIED   (if a trusted contact exists)
  → ASSISTANCE_ACTIVE
  → RESOLVED
```

## What the backend does

1. Authenticated user taps **I need help** or says a help phrase.
2. Consent for emergency is recorded.
3. A **health passport** is built from the server profile: name, blood group, allergies, important conditions, current medicines, one emergency contact, location.
4. LifeRoute fast-track **recommends** a capable hospital.
5. Family notification is written as a **simulated** demo message.
6. UI tells the person to **call 108**.

## What we never claim

- “Ambulance dispatched”
- “108 has been called by the app”
- “Hospital accepted the patient” as an operational fact

Those would be false in this demo. The product prepares help and shows the next real-world action.
