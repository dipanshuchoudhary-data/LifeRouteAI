"""Signed clinical referral PDF with verification QR."""

from __future__ import annotations

import hashlib
import io
from datetime import datetime, timezone

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


def _digest(payload: str) -> str:
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def build_referral_id(state: dict) -> str:
    raw = f"{state.get('session_id', '')}:{state.get('input_hash', '')}:{state.get('selected_facility', {}).get('name', '')}"
    return "LR-" + hashlib.sha256(raw.encode()).hexdigest()[:8].upper()


def sign_referral(state: dict, referral_id: str) -> str:
    payload = "|".join(
        [
            referral_id,
            state.get("triage_level") or "",
            str(state.get("esi_level") or ""),
            (state.get("selected_facility") or {}).get("name") or "",
            (state.get("structured_symptoms") or {}).get("chief_complaint") or "",
        ]
    )
    return _digest(payload)


def generate_referral_pdf(state: dict) -> tuple[bytes, str, str]:
    referral_id = state.get("referral_id") or build_referral_id(state)
    signature = state.get("referral_signature") or sign_referral(state, referral_id)
    facility = state.get("selected_facility") or {}
    symptoms = state.get("structured_symptoms") or {}
    qr_payload = f"liferoute://verify/{referral_id}?sig={signature[:16]}"

    qr_image = None
    try:
        import qrcode

        qr = qrcode.QRCode(box_size=4, border=1)
        qr.add_data(qr_payload)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        qr_image = ImageReader(buf)
    except Exception:
        qr_image = None

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    pdf.setFillColorRGB(0.90, 0.22, 0.21)
    pdf.rect(0, height - 22 * mm, width, 22 * mm, fill=1, stroke=0)
    pdf.setFillColorRGB(1, 1, 1)
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(18 * mm, height - 13 * mm, "LifeRoute AI — Clinical Referral")
    pdf.setFont("Helvetica", 9)
    pdf.drawString(18 * mm, height - 18 * mm, f"{referral_id}   ESI-{state.get('esi_level') or '—'}   {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")

    if qr_image:
        pdf.drawImage(qr_image, width - 42 * mm, height - 42 * mm, 28 * mm, 28 * mm, mask="auto")

    y = height - 40 * mm
    pdf.setFillColorRGB(0.1, 0.1, 0.1)
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(18 * mm, y, "Patient presentation")
    y -= 7 * mm
    pdf.setFont("Helvetica", 10)
    lines = [
        f"Chief complaint: {symptoms.get('chief_complaint') or state.get('raw_input') or 'Not specified'}",
        f"Duration: {symptoms.get('duration') or 'Not specified'}    Severity: {symptoms.get('severity') or '—'}/10",
        f"Associated: {', '.join(symptoms.get('associated_symptoms') or []) or 'None reported'}",
        "",
        "Triage (not a diagnosis)",
        f"Level: {(state.get('triage_level') or '').upper()}    ESI: {state.get('esi_level')}    Urgency: {state.get('urgency_category')}",
        (state.get("triage_reasoning") or "")[:400],
        "",
        "Recommended facility",
        f"{facility.get('name') or 'Unassigned'}",
        f"{facility.get('address') or ''}    {facility.get('contact') or ''}",
        (state.get("routing_reason") or "")[:400],
        "",
        "SHA-256 signature",
        signature,
        "",
        "This document is navigation guidance only. It is not a medical diagnosis.",
        "In a life-threatening emergency call 108 immediately.",
    ]
    for line in lines:
        if y < 25 * mm:
            pdf.showPage()
            y = height - 20 * mm
        pdf.drawString(18 * mm, y, line[:110])
        y -= 6 * mm

    pdf.save()
    return buffer.getvalue(), referral_id, signature
