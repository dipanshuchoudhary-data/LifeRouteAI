# Problem alignment

| Problem | Feature | Implementation | User benefit |
|---------|---------|----------------|--------------|
| Older adults struggle with complex digital text | Explain Anything | Validated photo upload → vision model with untrusted-document prompts | Bills, letters, and screens become short plain language |
| Emergencies have too many steps | Emergency Assist | One button → deterministic state machine + health passport + 108 | Help is requested without filling a hospital form first |
| Technology is hard to navigate | Voice-first Talk | Mic → STT (browser or Voice_LLM) → intent → tools / reply → browser TTS | Users can speak instead of hunting menus |
| Family may not know help is needed | Family Bridge | `tel:` calls plus consent-gated demo messages | Trusted people are one confirmation away |
| Nutrition advice is confusing | Food | Meal list + LLM suggestions labeled as estimates | Everyday food ideas, not a fake diet prescription |
| Appointments are easy to forget | My day | Database / local task list; lookup does **not** need an LLM | “What do I have today?” answers from saved data |
| Health charts are overwhelming | Health + Settings | Simple Health page; Settings is name/city/text size; full chart is optional | Daily use stays calm |
| Wrong hospital door in a crisis | LifeRoute matching | Sentinel + scoring + nearby trauma suggestion | A recommended facility, not a claimed dispatch |
