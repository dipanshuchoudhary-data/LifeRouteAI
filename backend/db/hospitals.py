"""Local Delhi NCR hospital catalog. No external database."""

from __future__ import annotations

from graph.mock_data import MOCK_HOSPITALS


def get_all_hospitals() -> list[dict]:
    return [dict(row) for row in MOCK_HOSPITALS]


def search_hospitals(query_text: str, triage_level: str | None = None) -> list[dict]:
    """Keyword match against name, city, and specialties."""
    tokens = [part for part in (query_text or "").lower().replace(",", " ").split() if len(part) > 2]
    rows = get_all_hospitals()
    if not tokens:
        return rows

    scored: list[tuple[int, dict]] = []
    for hospital in rows:
        haystack = " ".join(
            [
                str(hospital.get("name") or ""),
                str(hospital.get("city") or ""),
                " ".join(hospital.get("specialties") or []),
            ]
        ).lower()
        hits = sum(1 for token in tokens if token in haystack)
        if triage_level == "icu" and hospital.get("has_icu"):
            hits += 2
        if triage_level == "emergency" and hospital.get("has_trauma_center"):
            hits += 2
        scored.append((hits, hospital))

    scored.sort(key=lambda item: item[0], reverse=True)
    matched = [row for hits, row in scored if hits]
    return matched or rows
