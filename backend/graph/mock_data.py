"""
LifeRoute AI — Mock Hospital Data
Pre-computed data for offline demo mode and fallback.
Delhi, Noida, Greater Noida, and Gurugram hospitals with map coordinates.
"""

MOCK_HOSPITALS = [
    {
        "id": 1,
        "name": "AIIMS Trauma Centre",
        "city": "Delhi",
        "address": "Ansari Nagar East, AIIMS Campus, New Delhi 110029",
        "distance_km": 8.2,
        "specialties": ["trauma", "neurosurgery", "orthopedics", "emergency medicine", "critical care"],
        "has_icu": True,
        "has_cath_lab": True,
        "has_trauma_center": True,
        "has_neurology_unit": True,
        "total_beds": 350,
        "available_beds": 42,
        "current_capacity_percent": 88,
        "emergency_wait_minutes": 15,
        "rating": 4.5,
        "contact": "+91-11-26588500",
    },
    {
        "id": 2,
        "name": "Fortis Escorts Heart Institute",
        "city": "Delhi",
        "address": "Okhla Road, Sukhdev Vihar, New Delhi 110025",
        "distance_km": 6.5,
        "specialties": ["cardiology", "cardiac surgery", "interventional cardiology", "critical care"],
        "has_icu": True,
        "has_cath_lab": True,
        "has_trauma_center": False,
        "has_neurology_unit": False,
        "total_beds": 310,
        "available_beds": 55,
        "current_capacity_percent": 82,
        "emergency_wait_minutes": 10,
        "rating": 4.6,
        "contact": "+91-11-47135000",
    },
    {
        "id": 3,
        "name": "Max Super Speciality Hospital",
        "city": "Delhi",
        "address": "2, Press Enclave Road, Saket, New Delhi 110017",
        "distance_km": 7.1,
        "specialties": ["general medicine", "oncology", "neurology", "orthopedics", "cardiology"],
        "has_icu": True,
        "has_cath_lab": True,
        "has_trauma_center": False,
        "has_neurology_unit": True,
        "total_beds": 500,
        "available_beds": 78,
        "current_capacity_percent": 84,
        "emergency_wait_minutes": 12,
        "rating": 4.4,
        "contact": "+91-11-26515050",
    },
    {
        "id": 4,
        "name": "Sir Ganga Ram Hospital",
        "city": "Delhi",
        "address": "Rajinder Nagar, New Delhi 110060",
        "distance_km": 10.3,
        "specialties": ["general medicine", "gastroenterology", "nephrology", "pulmonology"],
        "has_icu": True,
        "has_cath_lab": False,
        "has_trauma_center": False,
        "has_neurology_unit": True,
        "total_beds": 675,
        "available_beds": 95,
        "current_capacity_percent": 86,
        "emergency_wait_minutes": 20,
        "rating": 4.3,
        "contact": "+91-11-25861662",
    },
    {
        "id": 5,
        "name": "Safdarjung Hospital",
        "city": "Delhi",
        "address": "Ansari Nagar West, New Delhi 110029",
        "distance_km": 9.0,
        "specialties": ["general medicine", "surgery", "obstetrics", "pediatrics", "orthopedics"],
        "has_icu": True,
        "has_cath_lab": False,
        "has_trauma_center": True,
        "has_neurology_unit": False,
        "total_beds": 1600,
        "available_beds": 120,
        "current_capacity_percent": 92,
        "emergency_wait_minutes": 35,
        "rating": 3.8,
        "contact": "+91-11-26707437",
    },
    {
        "id": 6,
        "name": "Medanta - The Medicity",
        "city": "Gurgaon",
        "address": "CH Baktawar Singh Rd, Sector 38, Gurgaon 122001",
        "distance_km": 15.4,
        "specialties": ["cardiology", "cardiac surgery", "neuroscience", "oncology", "robotics surgery"],
        "has_icu": True,
        "has_cath_lab": True,
        "has_trauma_center": True,
        "has_neurology_unit": True,
        "total_beds": 1250,
        "available_beds": 180,
        "current_capacity_percent": 78,
        "emergency_wait_minutes": 8,
        "rating": 4.7,
        "contact": "+91-124-4141414",
    },
    {
        "id": 7,
        "name": "Artemis Hospital",
        "city": "Gurgaon",
        "address": "Sector 51, Gurgaon 122001",
        "distance_km": 18.2,
        "specialties": ["orthopedics", "neurology", "oncology", "gastroenterology", "cardiology"],
        "has_icu": True,
        "has_cath_lab": True,
        "has_trauma_center": False,
        "has_neurology_unit": True,
        "total_beds": 400,
        "available_beds": 65,
        "current_capacity_percent": 84,
        "emergency_wait_minutes": 12,
        "rating": 4.4,
        "contact": "+91-124-4511111",
    },
    {
        "id": 8,
        "name": "Fortis Memorial Research Institute",
        "city": "Gurgaon",
        "address": "Sector 44, Gurgaon 122002",
        "distance_km": 16.8,
        "specialties": ["neuroscience", "kidney transplant", "liver transplant", "oncology", "cardiology"],
        "has_icu": True,
        "has_cath_lab": True,
        "has_trauma_center": False,
        "has_neurology_unit": True,
        "total_beds": 1000,
        "available_beds": 140,
        "current_capacity_percent": 76,
        "emergency_wait_minutes": 10,
        "rating": 4.5,
        "contact": "+91-124-4962200",
    },
    {
        "id": 9,
        "name": "Paras Hospital",
        "city": "Gurgaon",
        "address": "Sector 47, Gurgaon 122018",
        "distance_km": 17.5,
        "specialties": ["general medicine", "orthopedics", "gynecology", "dermatology"],
        "has_icu": True,
        "has_cath_lab": False,
        "has_trauma_center": False,
        "has_neurology_unit": False,
        "total_beds": 250,
        "available_beds": 45,
        "current_capacity_percent": 82,
        "emergency_wait_minutes": 15,
        "rating": 4.1,
        "contact": "+91-124-4585555",
    },
    {
        "id": 10,
        "name": "Columbia Asia Hospital",
        "city": "Gurgaon",
        "address": "Palam Vihar, Gurgaon 122017",
        "distance_km": 20.1,
        "specialties": ["general medicine", "family medicine", "pediatrics", "ENT"],
        "has_icu": True,
        "has_cath_lab": False,
        "has_trauma_center": False,
        "has_neurology_unit": False,
        "total_beds": 150,
        "available_beds": 30,
        "current_capacity_percent": 80,
        "emergency_wait_minutes": 18,
        "rating": 4.0,
        "contact": "+91-124-3989898",
    },
    {
        "id": 11,
        "name": "Jaypee Hospital",
        "city": "Noida",
        "address": "Sector 128, Noida 201304",
        "distance_km": 22.0,
        "specialties": ["cardiology", "neurology", "oncology", "nephrology", "urology"],
        "has_icu": True,
        "has_cath_lab": True,
        "has_trauma_center": True,
        "has_neurology_unit": True,
        "total_beds": 525,
        "available_beds": 88,
        "current_capacity_percent": 83,
        "emergency_wait_minutes": 10,
        "rating": 4.3,
        "contact": "+91-120-4122222",
    },
    {
        "id": 12,
        "name": "Fortis Hospital Noida",
        "city": "Noida",
        "address": "B-22, Sector 62, Noida 201301",
        "distance_km": 14.5,
        "specialties": ["general medicine", "orthopedics", "gynecology", "pediatrics", "cardiology"],
        "has_icu": True,
        "has_cath_lab": False,
        "has_trauma_center": False,
        "has_neurology_unit": True,
        "total_beds": 200,
        "available_beds": 35,
        "current_capacity_percent": 82,
        "emergency_wait_minutes": 14,
        "rating": 4.2,
        "contact": "+91-120-4300222",
    },
    {
        "id": 13,
        "name": "Max Super Speciality Hospital Noida",
        "city": "Noida",
        "address": "A-364, Sector 19, Noida 201301",
        "distance_km": 13.2,
        "specialties": ["general medicine", "surgery", "orthopedics", "ENT", "dermatology"],
        "has_icu": True,
        "has_cath_lab": False,
        "has_trauma_center": False,
        "has_neurology_unit": False,
        "total_beds": 180,
        "available_beds": 28,
        "current_capacity_percent": 84,
        "emergency_wait_minutes": 16,
        "rating": 4.1,
        "contact": "+91-120-4688888",
    },
    {
        "id": 14,
        "name": "Yatharth Super Speciality Hospital",
        "city": "Noida",
        "address": "Sector 110, Noida Expressway, Greater Noida 201306",
        "distance_km": 25.0,
        "specialties": ["cardiology", "neurology", "orthopedics", "oncology", "gastroenterology"],
        "has_icu": True,
        "has_cath_lab": True,
        "has_trauma_center": True,
        "has_neurology_unit": True,
        "total_beds": 400,
        "available_beds": 70,
        "current_capacity_percent": 75,
        "emergency_wait_minutes": 8,
        "rating": 4.4,
        "contact": "+91-120-4999999",
    },
    {
        "id": 15,
        "name": "Kailash Hospital & Heart Institute",
        "city": "Noida",
        "address": "Sector 27, Noida 201301",
        "distance_km": 12.8,
        "specialties": ["cardiology", "cardiac surgery", "general medicine", "pulmonology"],
        "has_icu": True,
        "has_cath_lab": True,
        "has_trauma_center": False,
        "has_neurology_unit": False,
        "total_beds": 300,
        "available_beds": 48,
        "current_capacity_percent": 84,
        "emergency_wait_minutes": 12,
        "rating": 4.2,
        "contact": "+91-120-2444444",
        "lat": 28.5789,
        "lng": 77.3312,
    },
    {
        "id": 16,
        "name": "Apollo Hospitals Noida",
        "city": "Noida",
        "address": "E-2, Sector 26, Noida 201301",
        "distance_km": 12.0,
        "specialties": ["cardiology", "emergency medicine", "neurology", "orthopedics", "critical care"],
        "has_icu": True,
        "has_cath_lab": True,
        "has_trauma_center": True,
        "has_neurology_unit": True,
        "total_beds": 350,
        "available_beds": 52,
        "current_capacity_percent": 81,
        "emergency_wait_minutes": 9,
        "rating": 4.4,
        "contact": "+91-120-4012000",
        "lat": 28.5748,
        "lng": 77.3261,
    },
    {
        "id": 17,
        "name": "Metro Hospital Noida",
        "city": "Noida",
        "address": "X-1, Sector 11, Noida 201301",
        "distance_km": 11.4,
        "specialties": ["cardiology", "cardiac surgery", "general medicine", "pulmonology"],
        "has_icu": True,
        "has_cath_lab": True,
        "has_trauma_center": False,
        "has_neurology_unit": False,
        "total_beds": 327,
        "available_beds": 44,
        "current_capacity_percent": 83,
        "emergency_wait_minutes": 11,
        "rating": 4.1,
        "contact": "+91-120-2521111",
        "lat": 28.5906,
        "lng": 77.3179,
    },
    {
        "id": 18,
        "name": "Felix Hospital Noida",
        "city": "Noida",
        "address": "Sector 137, Noida Expressway, Noida 201305",
        "distance_km": 24.0,
        "specialties": ["emergency medicine", "orthopedics", "gastroenterology", "general medicine"],
        "has_icu": True,
        "has_cath_lab": False,
        "has_trauma_center": True,
        "has_neurology_unit": False,
        "total_beds": 200,
        "available_beds": 38,
        "current_capacity_percent": 79,
        "emergency_wait_minutes": 10,
        "rating": 4.2,
        "contact": "+91-120-6799999",
        "lat": 28.5084,
        "lng": 77.4092,
    },
    {
        "id": 19,
        "name": "Sharda Hospital Greater Noida",
        "city": "Noida",
        "address": "Plot 32-34, Knowledge Park III, Greater Noida 201310",
        "distance_km": 32.0,
        "specialties": ["trauma", "emergency medicine", "neurology", "orthopedics", "critical care"],
        "has_icu": True,
        "has_cath_lab": True,
        "has_trauma_center": True,
        "has_neurology_unit": True,
        "total_beds": 900,
        "available_beds": 110,
        "current_capacity_percent": 80,
        "emergency_wait_minutes": 12,
        "rating": 4.0,
        "contact": "+91-120-2333999",
        "lat": 28.4736,
        "lng": 77.4831,
    },
    {
        "id": 20,
        "name": "Kailash Hospital Greater Noida",
        "city": "Noida",
        "address": "Plot 23, Knowledge Park I, Greater Noida 201310",
        "distance_km": 33.0,
        "specialties": ["cardiology", "general medicine", "orthopedics", "gynecology"],
        "has_icu": True,
        "has_cath_lab": True,
        "has_trauma_center": False,
        "has_neurology_unit": False,
        "total_beds": 300,
        "available_beds": 41,
        "current_capacity_percent": 82,
        "emergency_wait_minutes": 13,
        "rating": 4.1,
        "contact": "+91-120-2322222",
        "lat": 28.4743,
        "lng": 77.5034,
    },
    {
        "id": 21,
        "name": "Narayana Superspeciality Hospital Gurugram",
        "city": "Gurgaon",
        "address": "Plot 3201, Block V, DLF Phase 3, Gurugram 122002",
        "distance_km": 19.0,
        "specialties": ["cardiology", "cardiac surgery", "oncology", "critical care"],
        "has_icu": True,
        "has_cath_lab": True,
        "has_trauma_center": False,
        "has_neurology_unit": True,
        "total_beds": 215,
        "available_beds": 33,
        "current_capacity_percent": 77,
        "emergency_wait_minutes": 9,
        "rating": 4.3,
        "contact": "+91-124-4588888",
        "lat": 28.4946,
        "lng": 77.0884,
    },
    {
        "id": 22,
        "name": "CK Birla Hospital Gurugram",
        "city": "Gurgaon",
        "address": "Block J, Mayfield Garden, Sector 51, Gurugram 122018",
        "distance_km": 18.8,
        "specialties": ["orthopedics", "gynecology", "pediatrics", "general medicine", "emergency medicine"],
        "has_icu": True,
        "has_cath_lab": False,
        "has_trauma_center": False,
        "has_neurology_unit": False,
        "total_beds": 220,
        "available_beds": 36,
        "current_capacity_percent": 80,
        "emergency_wait_minutes": 11,
        "rating": 4.2,
        "contact": "+91-124-4880000",
        "lat": 28.4379,
        "lng": 77.0717,
    },
    {
        "id": 23,
        "name": "Manipal Hospital Gurugram",
        "city": "Gurgaon",
        "address": "Sector 51, Gurugram 122003",
        "distance_km": 18.5,
        "specialties": ["neurology", "cardiology", "orthopedics", "emergency medicine", "critical care"],
        "has_icu": True,
        "has_cath_lab": True,
        "has_trauma_center": True,
        "has_neurology_unit": True,
        "total_beds": 325,
        "available_beds": 49,
        "current_capacity_percent": 78,
        "emergency_wait_minutes": 10,
        "rating": 4.3,
        "contact": "+91-124-4997000",
        "lat": 28.4302,
        "lng": 77.0654,
    },
    {
        "id": 24,
        "name": "W Pratiksha Hospital Gurugram",
        "city": "Gurgaon",
        "address": "Golf Course Extension Road, Sushant Lok 2, Gurugram 122002",
        "distance_km": 20.4,
        "specialties": ["general medicine", "orthopedics", "gynecology", "pediatrics"],
        "has_icu": True,
        "has_cath_lab": False,
        "has_trauma_center": False,
        "has_neurology_unit": False,
        "total_beds": 200,
        "available_beds": 31,
        "current_capacity_percent": 81,
        "emergency_wait_minutes": 14,
        "rating": 4.0,
        "contact": "+91-124-4970000",
        "lat": 28.4086,
        "lng": 77.0703,
    },
    {
        "id": 25,
        "name": "Cloudnine Hospital Gurugram",
        "city": "Gurgaon",
        "address": "Sector 47, Gurugram 122018",
        "distance_km": 19.6,
        "specialties": ["obstetrics", "pediatrics", "gynecology", "neonatology"],
        "has_icu": True,
        "has_cath_lab": False,
        "has_trauma_center": False,
        "has_neurology_unit": False,
        "total_beds": 90,
        "available_beds": 18,
        "current_capacity_percent": 74,
        "emergency_wait_minutes": 16,
        "rating": 4.4,
        "contact": "+91-124-4141414",
        "lat": 28.4129,
        "lng": 77.0481,
    },
]


def simulate_live_telemetry(hospitals: list[dict], *, seed: int | None = None) -> list[dict]:
    """
    Stochastic bed occupancy / wait-time simulator for offline and demo mode.
    Deterministic per UTC minute so the UI feels live without a hospital feed.
    """
    import hashlib
    from datetime import datetime, timezone

    minute_bucket = datetime.now(timezone.utc).strftime("%Y%m%d%H%M")
    snapshot = []
    for hospital in hospitals:
        item = dict(hospital)
        key = f"{item.get('name', '')}:{minute_bucket}:{seed or 0}"
        digest = hashlib.sha256(key.encode()).digest()
        jitter_wait = (digest[0] % 7) - 3  # -3..+3 minutes
        jitter_beds = (digest[1] % 5) - 2
        total = int(item.get("total_beds") or 100)
        available = max(1, int(item.get("available_beds") or 10) + jitter_beds)
        available = min(available, max(1, total - 1))
        occupied = max(0, total - available)
        capacity = int(round(occupied / total * 100)) if total else 80
        wait = max(4, int(item.get("emergency_wait_minutes") or 12) + jitter_wait)
        icu_total = max(8, total // 10)
        icu_available = max(0, min(icu_total, available // 4))
        item.update(
            {
                "available_beds": available,
                "current_capacity_percent": min(99, max(40, capacity)),
                "emergency_wait_minutes": wait,
                "available_icu_beds": icu_available,
                "total_icu_beds": icu_total,
                "ambulance_divert_status": capacity >= 96,
                "ct_scanner_status": "OPERATIONAL" if digest[2] > 8 else "MAINTENANCE",
                "telemetry_timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
        snapshot.append(item)
    return snapshot


# ---------------------------------------------------------------------------
# Pre-computed demo results for 3 scenarios (used when APIs are down)
# ---------------------------------------------------------------------------

MOCK_DEMO_RESULTS = {
    "chest_pain_english": {
        "raw_input": "I have severe chest pain and difficulty breathing",
        "language": "en",
        "structured_symptoms": {
            "chief_complaint": "severe chest pain with difficulty breathing",
            "duration": "acute onset",
            "severity": 9,
            "associated_symptoms": ["shortness of breath", "sweating"],
            "age": None,
            "gender": None,
        },
        "triage_level": "icu",
        "triage_reasoning": "Symptoms may suggest a critical cardiac event. The combination of severe chest pain with breathing difficulty is consistent with a potentially life-threatening cardiovascular condition requiring immediate intensive care.",
        "matched_facilities": [MOCK_HOSPITALS[1], MOCK_HOSPITALS[5], MOCK_HOSPITALS[2]],  # Fortis Escorts, Medanta, Max
        "selected_facility": MOCK_HOSPITALS[1],  # Fortis Escorts Heart Institute
        "routing_reason": "Fortis Escorts Heart Institute was selected because it specializes in cardiology, cardiac surgery, interventional cardiology, has ICU availability, and is equipped with catheterization lab for cardiac emergencies with 55 beds available and estimated wait time of 10 minutes. Other facilities were not recommended because: Safdarjung Hospital (Facility at 92% capacity (threshold: 85%)); AIIMS Trauma Centre (Facility at 88% capacity (threshold: 85%)).",
        "referral_doc": """# LifeRoute AI — Patient Referral Summary

**Date:** Today
**Referral ID:** LR-847291

## Patient Presentation
Patient reports severe chest pain accompanied by difficulty breathing. Onset appears acute. Severity rated 9/10. Associated symptoms include shortness of breath and sweating.

## Triage Assessment
**Urgency Level:** ICU / CRITICAL

The combination of severe chest pain with breathing difficulty may suggest a serious cardiovascular condition. Immediate intensive care evaluation is recommended.

## Recommended Facility
**Hospital:** Fortis Escorts Heart Institute
**Address:** Okhla Road, Sukhdev Vihar, New Delhi 110025
**Contact:** +91-11-47135000

### Why This Facility
Fortis Escorts is a premier cardiac care center with dedicated catheterization labs, cardiac ICU, and 24/7 interventional cardiology coverage. Currently at 82% capacity with 55 beds available and a 10-minute estimated wait time.

## Recommended Next Steps
- Proceed to Fortis Escorts Heart Institute emergency department immediately
- Call ahead at +91-11-47135000 to alert the cardiac team
- Do not drive yourself — have someone drive you or call an ambulance (108)
- Bring any current medications and previous medical records if readily available

---
*This referral was generated by LifeRoute AI and is for navigation guidance only. It is not a substitute for professional medical evaluation.*""",
        "disclaimer": "LifeRoute AI provides navigation guidance only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns. In case of a life-threatening emergency, call 108 (India) immediately.",
    },
    "fever_hindi": {
        "raw_input": "मुझे तेज़ बुखार और सिरदर्द है",
        "language": "hi",
        "structured_symptoms": {
            "chief_complaint": "high fever with headache",
            "duration": None,
            "severity": 6,
            "associated_symptoms": ["headache"],
            "age": None,
            "gender": None,
        },
        "triage_level": "clinic",
        "triage_reasoning": "बुखार और सिरदर्द के लक्षण एक सामान्य संक्रमण का संकेत दे सकते हैं। उचित मूल्यांकन के लिए क्लिनिक विज़िट की सिफारिश की जाती है।",
        "matched_facilities": [MOCK_HOSPITALS[2], MOCK_HOSPITALS[12], MOCK_HOSPITALS[3]],  # Max Delhi, Max Noida, Ganga Ram
        "selected_facility": MOCK_HOSPITALS[2],  # Max Super Speciality
        "routing_reason": "Max Super Speciality Hospital (Saket) was selected because it specializes in general medicine, has 78 beds available, and an estimated wait time of 12 minutes.",
        "referral_doc": """# LifeRoute AI — Patient Referral Summary

**Date:** Today
**Referral ID:** LR-531864

## रोगी प्रस्तुति
रोगी को तेज़ बुखार और सिरदर्द की शिकायत है। गंभीरता 6/10 आंकी गई है।

## ट्राइएज आकलन
**तात्कालिकता स्तर:** CLINIC

बुखार और सिरदर्द के लक्षण एक सामान्य संक्रमण का संकेत दे सकते हैं। उचित जांच और उपचार के लिए क्लिनिक विज़िट की सिफारिश की जाती है।

## अनुशंसित सुविधा
**Hospital:** Max Super Speciality Hospital
**Address:** 2, Press Enclave Road, Saket, New Delhi 110017
**Contact:** +91-11-26515050

### इस सुविधा का चयन क्यों
Max Hospital जनरल मेडिसिन में विशेषज्ञ है, 78 बेड उपलब्ध हैं और अनुमानित प्रतीक्षा समय 12 मिनट है।

## अनुशंसित अगले कदम
- Max Super Speciality Hospital जाएं
- बुखार बढ़ने पर तुरंत संपर्क करें
- पर्याप्त पानी पिएं और आराम करें
- वर्तमान दवाइयां और मेडिकल रिकॉर्ड साथ ले जाएं

---
*यह रेफरल LifeRoute AI द्वारा बनाया गया है और केवल मार्गदर्शन के लिए है।*""",
        "disclaimer": "LifeRoute AI provides navigation guidance only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns. In case of a life-threatening emergency, call 108 (India) immediately.",
    },
    "trauma_english": {
        "raw_input": "Road accident, head injury, bleeding",
        "language": "en",
        "structured_symptoms": {
            "chief_complaint": "road accident with head injury and bleeding",
            "duration": "just happened",
            "severity": 9,
            "associated_symptoms": ["head injury", "bleeding", "trauma"],
            "age": None,
            "gender": None,
        },
        "triage_level": "icu",
        "triage_reasoning": "Indicators suggest major trauma requiring immediate critical care. Head injury with active bleeding following a road accident is consistent with a critical condition that requires urgent neurosurgical and trauma assessment.",
        "matched_facilities": [MOCK_HOSPITALS[0], MOCK_HOSPITALS[5], MOCK_HOSPITALS[10]],  # AIIMS, Medanta, Jaypee
        "selected_facility": MOCK_HOSPITALS[0],  # AIIMS Trauma Centre
        "routing_reason": "AIIMS Trauma Centre was selected because it specializes in trauma, neurosurgery, orthopedics, has ICU availability, has a dedicated trauma center with 42 beds available and estimated wait time of 15 minutes. Other facilities were not recommended because: Safdarjung Hospital (Facility at 92% capacity (threshold: 85%)).",
        "referral_doc": """# LifeRoute AI — Patient Referral Summary

**Date:** Today
**Referral ID:** LR-293751

## Patient Presentation
Patient involved in a road accident with reported head injury and active bleeding. Severity rated 9/10. This appears to be an acute trauma case.

## Triage Assessment
**Urgency Level:** ICU / CRITICAL

Major trauma indicators present: head injury with bleeding following vehicular accident. Immediate neurosurgical and trauma evaluation is strongly recommended.

## Recommended Facility
**Hospital:** AIIMS Trauma Centre
**Address:** Ansari Nagar East, AIIMS Campus, New Delhi 110029
**Contact:** +91-11-26588500

### Why This Facility
AIIMS Trauma Centre is India's premier Level-1 trauma center with dedicated neurosurgery, orthopedics, and 24/7 trauma surgery teams. Currently has 42 beds available with 15-minute estimated wait time.

## Recommended Next Steps
- Call 108 for ambulance immediately if not already en route
- Do not move the patient if spinal injury is suspected
- Apply gentle pressure to control bleeding with clean cloth
- Proceed directly to AIIMS Trauma Centre Emergency

---
*This referral was generated by LifeRoute AI and is for navigation guidance only. It is not a substitute for professional medical evaluation.*""",
        "disclaimer": "LifeRoute AI provides navigation guidance only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns. In case of a life-threatening emergency, call 108 (India) immediately.",
    },
}
