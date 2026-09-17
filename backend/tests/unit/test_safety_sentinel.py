"""Tier-0 sentinel: 0 false negatives on ESI-1 language, tight false-positive budget."""

from graph.agents.safety_sentinel import scan_text

EMERGENCY_PROMPTS = [
    # Cardiovascular / STEMI
    "crushing chest pain",
    "I have crushing chest pressure",
    "chest pain radiating to left arm",
    "chest pain spreading to my jaw",
    "severe chest pain and sweating",
    "I am having a heart attack",
    "cardiac arrest, no pulse",
    "myocardial infarction symptoms with chest pain",
    "STEMI suspected, crushing pain",
    "pain in my chest radiating to arm",
    "severe chest tightness with shortness of breath",
    "heavy chest pain and I feel faint",
    "sudden onset racing heart with syncope",
    "छाती में दर्द और सांस नहीं आ रही",
    "दिल का दौरा पड़ रहा है",
    "I have severe chest pain and difficulty breathing",
    "chest pressure spreading to neck",
    "crushing pressure in chest",
    # Stroke / neuro
    "sudden facial droop",
    "acute slurred speech",
    "loss of speech started suddenly",
    "one-sided weakness in my arm",
    "unilateral paralysis of the face",
    "face drooping on the left",
    "slurred speech and arm weakness",
    "worst headache of my life",
    "worst headache of life, sudden",
    "I think this is a stroke",
    "brain attack, face is uneven",
    "sudden paralysis of one side",
    "can't move one side of my body suddenly",
    "sudden vision loss",
    "लकवा हो गया है",
    "चेहरा टेढ़ा हो गया",
    "Stroke symptoms — face drooping, arm weakness",
    "cerebrovascular accident suspected",
    # Respiratory
    "I can't breathe",
    "I cannot breathe",
    "unable to breathe",
    "I'm not breathing well, turning blue",
    "turning cyanotic",
    "turning blue around the lips",
    "severe stridor",
    "gasping for air",
    "choking, airway blocked",
    "airway closed, no air",
    "सांस नहीं आ रही",
    "दम घुट रहा है",
    "Severe breathing difficulty turning blue",
    "can't breathe, gasping",
    "cannot breathe at all",
    # Anaphylaxis
    "throat closing after peanut",
    "throat is swelling from a bee sting",
    "throat tightening after medication",
    "hives with difficulty breathing",
    "hives with wheezing",
    "this is anaphylaxis",
    "anaphylactic reaction, throat closing",
    "severe allergic reaction, epipen",
    "need an epi-pen, throat closing",
    "airway swelling from nut allergy",
    # Trauma / hemorrhage
    "uncontrolled bleeding",
    "spurting blood from the wound",
    "penetrating wound to chest",
    "penetrating injury to the neck",
    "penetrating wound to abdomen",
    "massive haemorrhage after accident",
    "severe bleeding that will not stop",
    "gunshot wound to the chest",
    "he was stabbed in the abdomen",
    "head injury, bleeding, unconscious",
    "road accident, head injury, bleeding",
    "hit by a car, not responding",
    "unconscious and not responding",
    "passed out, no pulse",
    "unresponsive after trauma",
    "Road accident, head injury, bleeding",
    "major trauma from a crash",
    "खून नहीं रुक रहा",
    "एक्सीडेंट हुआ है, बेहोश",
    # Seizure / obstetric
    "active seizure right now",
    "status epilepticus",
    "pregnant and having a seizure",
    "pregnant with severe bleeding",
    "eclampsia suspected, seizure",
    "convulsion, not waking up",
    "fitting, unconscious",
    "दौरा पड़ रहा है",
    # Combined / classic LifeRoute demos
    "unconscious not breathing",
    "no pulse, start CPR",
    "Accident or major trauma injury",
    "child is unresponsive after choking",
    "throat closing, can't breathe",
    "chest pain radiating to left arm and jaw",
    "sudden facial droop and slurred speech",
    "worst headache of my life with vomiting",
    "I am unresponsive according to bystander",
    "bystander says they are unresponsive",
    "cyanotic and gasping for air",
    "stridor and turning blue",
    "open gunshot, spurting blood",
    "stabbed, uncontrolled bleeding",
    "cardiac arrest in the street",
    "not breathing after drowning",
    "help my father collapsed no pulse",
    "she is blue and gasping",
    "anaphylaxis after peanuts, throat closing",
    "sudden one-sided numbness",
    "acute facial droop this morning",
    "crushing pain in the chest",
    "chest pain spreading to my left arm",
    "I cannot catch my breath, turning blue",
    "penetrating injury to the chest",
    "massive blood loss after crash",
    "he was shot, bleeding out",
    "status epilepticus ongoing",
    "pregnant, unconscious",
    "cord prolapse during labor",
    "worst headache of my life suddenly",
    "face drooping and cannot speak",
    "uncontrolled bleeding from the neck",
    "throat swelling after bee sting",
]

SAFE_PROMPTS = [
    "mild headache after studying",
    "runny nose and sneezing for two days",
    "mild cold, no fever",
    "sore throat and cough since yesterday",
    "back pain after lifting a box",
    "ankle sprain from jogging",
    "itchy skin rash on the arm",
    "mild fever 100F with body ache",
    "I need a routine clinic visit for a checkup",
    "tooth pain, can wait until morning",
]


def test_zero_false_negatives_on_emergency_prompts():
    misses = []
    for prompt in EMERGENCY_PROMPTS:
        result = scan_text(prompt)
        if not result.is_emergency:
            misses.append(prompt)
    assert misses == [], f"False negatives ({len(misses)}): {misses}"


def test_emergency_sets_esi_1_and_instructions():
    result = scan_text("crushing chest pain radiating to left arm")
    assert result.is_emergency is True
    assert result.esi_level == 1
    assert result.urgency_category == "RED"
    assert result.triage_level == "icu"
    assert result.instructions and "108" in result.instructions
    assert result.elapsed_ms < 20


def test_empty_input_is_not_emergency():
    result = scan_text("   ")
    assert result.is_emergency is False
    assert result.esi_level == 5


def test_safe_prompts_are_not_all_flagged():
    false_positives = [prompt for prompt in SAFE_PROMPTS if scan_text(prompt).is_emergency]
    # Allow at most one conservative over-call
    assert len(false_positives) <= 1, false_positives


def test_state_update_short_circuits():
    update = scan_text("uncontrolled bleeding").to_state_update()
    assert update["is_emergency"] is True
    assert update["triage_level"] == "icu"
    assert "Call 108" in update["immediate_actions"][0]


def test_input_hash_is_stable():
    a = scan_text("stroke facial droop")
    b = scan_text("stroke facial droop")
    assert a.input_hash == b.input_hash
    assert len(a.input_hash) == 64


def test_category_coverage():
    mapping = {
        "CARDIOVASCULAR": "crushing chest pain",
        "NEUROLOGICAL_STROKE": "worst headache of my life",
        "RESPIRATORY_FAILURE": "I can't breathe",
        "ANAPHYLAXIS": "anaphylaxis, throat closing",
        "TRAUMA_HEMORRHAGE": "uncontrolled bleeding",
        "OBSTETRIC_SEIZURE": "pregnant and having a seizure",
    }
    for category, prompt in mapping.items():
        result = scan_text(prompt)
        assert result.is_emergency, prompt
        assert result.category == category, (prompt, result.category)


def test_prompt_count_meets_spec():
    assert len(EMERGENCY_PROMPTS) >= 100
