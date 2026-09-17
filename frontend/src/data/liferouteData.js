import {
  HeartPulse, Brain, Ambulance, Thermometer, Wind, Baby, LayoutGrid, Heart,
  Bone, Microscope, Stethoscope, Venus, Droplet,
} from 'lucide-react'

export const NAV_LINKS = [
  { label: 'Home', id: 'home' },
  { label: 'Live ops', id: 'ops' },
  { label: 'Hospitals', id: 'hospitals' },
  { label: 'Ambulance', id: 'ambulance' },
  { label: 'Blood', id: 'blood' },
  { label: 'ICU', id: 'icu' },
  { label: 'Profile', id: 'profile' },
  { label: 'Settings', id: 'settings' },
]

export const INSURANCE_PRESETS = ['Star Health', 'Ayushman Bharat', 'ICICI Lombard', 'CGHS', 'Niva Bupa', 'HDFC Ergo', 'ESI']
export const MEDICATION_PRESETS = ['Metformin', 'Amlodipine', 'Aspirin', 'Atorvastatin', 'Insulin', 'Telmisartan', 'Clopidogrel', 'Thyroxine']
export const CONDITION_PRESETS = ['Hypertension', 'Type 2 Diabetes', 'Asthma', 'CAD', 'CKD', 'Hypothyroidism', 'COPD']
export const ALLERGY_PRESETS = ['Penicillin', 'Sulfa', 'NSAIDs', 'Iodine contrast', 'Peanuts', 'Latex']
export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export const DONOR_CAN_GIVE = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
}

export function donorCanGiveTo(donorType, patientType) {
  if (!donorType || !patientType) return false
  return (DONOR_CAN_GIVE[donorType] || []).includes(patientType)
}

export const NETWORK_DONORS = [
  { id: 'net-1', name: 'Ananya Sharma', bloodType: 'O-', phone: '+91 98111 22008', city: 'South Delhi', available: true, lastDonated: '2026-03-12' },
  { id: 'net-2', name: 'Rahul Verma', bloodType: 'O+', phone: '+91 98201 33441', city: 'Noida', available: true, lastDonated: '2026-05-02' },
  { id: 'net-3', name: 'Fatima Khan', bloodType: 'B+', phone: '+91 98712 90821', city: 'Gurugram', available: true, lastDonated: '2026-01-18' },
  { id: 'net-4', name: 'Vikram Singh', bloodType: 'A+', phone: '+91 98100 55612', city: 'Delhi', available: false, lastDonated: '2026-07-21' },
  { id: 'net-5', name: 'Meera Iyer', bloodType: 'AB-', phone: '+91 99001 44219', city: 'Faridabad', available: true, lastDonated: '2025-12-09' },
  { id: 'net-6', name: 'Arjun Malhotra', bloodType: 'A-', phone: '+91 98450 11990', city: 'Ghaziabad', available: true, lastDonated: '2026-04-30' },
]
export const FREQUENCY_OPTIONS = ['Once daily', 'Twice daily', 'Thrice daily', 'Bedtime', 'As needed', 'Weekly']
export const SEVERITY_OPTIONS = ['Mild', 'Moderate', 'Severe', 'Anaphylaxis']
export const RELATION_OPTIONS = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Family physician', 'Other']

export const CHIPS = [
  { label: 'Chest Pain', hiLabel: 'छाती दर्द', icon: HeartPulse, query: 'severe chest pain radiating to left arm', color: 'red', severity: 'critical' },
  { label: 'Stroke', hiLabel: 'स्ट्रोक', icon: Brain, query: 'sudden facial droop and slurred speech', color: 'red', severity: 'critical' },
  { label: 'Accident / Trauma', hiLabel: 'एक्सीडेंट', icon: Ambulance, query: 'Road accident, head injury, bleeding', color: 'red', severity: 'critical' },
  { label: 'High Fever', hiLabel: 'तेज़ बुखार', icon: Thermometer, query: 'High fever above 103°F with headache', hiQuery: 'मुझे तेज़ बुखार और सिरदर्द है', color: 'amber', severity: 'urgent' },
  { label: 'Breathing Issues', hiLabel: 'सांस नहीं', icon: Wind, query: "I can't breathe, gasping for air", color: 'blue', severity: 'critical' },
  { label: 'Child Emergency', hiLabel: 'बच्चा आपातकाल', icon: Baby, query: 'Child emergency high fever pediatric care', color: 'amber', severity: 'urgent' },
]

export const PRODUCT_FEATURES = [
  { title: 'Safety sentinel', metric: '<20ms', body: 'Life-threatening language is intercepted before any generative model runs, then routed to 108 with the nearest capable facility.' },
  { title: 'ESI triage', metric: '1–5', body: 'Emergency Severity Index with RED / ORANGE / YELLOW / GREEN. Rules first, LLM only when the case is stable.' },
  { title: 'Live facility match', metric: '5-factor', body: 'Travel, ER wait, open beds, trauma/cath/stroke capability, and network status — not “nearest hospital”.' },
  { title: 'Bilingual intake', metric: 'EN · हिं', body: 'English and Hindi in the same flow. Symptoms are structured once, then answered in the patient’s language.' },
  { title: 'FHIR referral', metric: 'R4', body: 'Signed Patient / Condition / Encounter / ServiceRequest bundle plus printable PDF and QR for hospital intake.' },
  { title: 'Dispatch ready', metric: '108', body: 'SOS, ALS/BLS board, blood stock, ICU/ventilators, oxygen and 24h pharmacy so the next step is never a Google search.' },
]

export const PIPELINE_STEPS = [
  { id: 'sentinel', label: 'Tier-0 Sentinel', hint: '<20ms, no LLM' },
  { id: 'intake', label: 'Intake + Vitals', hint: 'EN / हिं extract' },
  { id: 'triage', label: 'ESI Triage', hint: 'Rules then LLM' },
  { id: 'fanout', label: 'Geo ∥ Capacity', hint: 'Parallel fan-out' },
  { id: 'rank', label: 'Clinical Rank', hint: 'Composite score' },
  { id: 'fhir', label: 'FHIR + PDF', hint: 'Signed referral' },
]

export const ESI_LEGEND = [
  { level: 1, label: 'Resuscitation', color: '#FF4444' },
  { level: 2, label: 'Emergent', color: '#FF6B4A' },
  { level: 3, label: 'Urgent', color: '#FF8C00' },
  { level: 4, label: 'Less urgent', color: '#E8A000' },
  { level: 5, label: 'Non-urgent', color: '#22C55E' },
]

export const ESI_STAGES = [
  { level: 1, code: 'E1', label: 'Emergency now', hint: 'Life-threatening. Live map, family call, ambulance.', color: '#B91C1C' },
  { level: 2, code: 'E2', label: 'Emergency', hint: 'Cannot wait. Live tracking with ER and ambulance.', color: '#C2410C' },
  { level: 3, code: 'E3', label: 'Urgent', hint: 'Need care soon. Hospital ER, no auto-dispatch.', color: '#B45309' },
  { level: 4, code: 'E4', label: 'Less urgent', hint: 'Clinic or OPD today.', color: '#A16207' },
  { level: 5, code: 'E5', label: 'Non-urgent', hint: 'Self-care or a nearby clinic.', color: '#15803D' },
]

export const STATS = [
  { val: '15+', label: 'Hospitals Live', accent: false },
  { val: '<20ms', label: 'Safety Sentinel', accent: true },
  { val: 'ESI', label: 'Triage 1–5', accent: false },
  { val: 'FHIR', label: 'Referral Bundle', accent: false },
]

export const CITIES = ['All Cities', 'Delhi', 'Gurgaon', 'Noida']

export const SPECIALTIES = [
  { label: 'All', icon: LayoutGrid },
  { label: 'Cardiology', icon: Heart },
  { label: 'Neurology', icon: Brain },
  { label: 'Orthopedics', icon: Bone },
  { label: 'Trauma', icon: Ambulance },
  { label: 'Oncology', icon: Microscope },
  { label: 'General', icon: Stethoscope },
  { label: 'Gynecology', icon: Venus },
  { label: 'Nephrology', icon: Droplet },
]

export const TAG_COLOR_MAP = {
  Cardiology: { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' },
  'Cardiac Surgery': { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' },
  'Interventional Cardiology': { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' },
  'Critical Care': { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  Neurology: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  Oncology: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  Orthopedics: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  'General Medicine': { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' },
  'General Surgery': { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' },
  Trauma: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  Gynecology: { bg: '#FDF2F8', text: '#9D174D', border: '#FBCFE8' },
  Pediatrics: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
}

export const DEFAULT_TAG_COLOR = { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' }

export const HOSPITALS = [
  { id: 1, name: 'Fortis Escorts Heart Institute', govt: false, city: 'Delhi', rating: 4.6, reviews: 1759, distance: '6.5 km', tags: ['Cardiology', 'Cardiac Surgery', 'Interventional Cardiology', 'Critical Care'], beds: 55, wait: '~10 min', capacity: 82, contact: '+91-11-47135000' },
  { id: 2, name: 'Max Super Speciality Hospital', govt: false, city: 'Delhi', rating: 4.4, reviews: 1896, distance: '7.1 km', tags: ['General Medicine', 'Oncology', 'Neurology', 'Orthopedics'], beds: 78, wait: '~12 min', capacity: 84, contact: '+91-11-26515050' },
  { id: 3, name: 'AIIMS Trauma Centre', govt: true, city: 'Delhi', rating: 4.5, reviews: 1622, distance: '8.2 km', tags: ['Trauma', 'Neurology', 'Critical Care', 'General Surgery'], beds: 120, wait: '~8 min', capacity: 71, contact: '+91-11-26588500' },
  { id: 4, name: 'Safdarjung Hospital', govt: true, city: 'Delhi', rating: 3.8, reviews: 2170, distance: '9 km', tags: ['General Medicine', 'Orthopedics', 'Gynecology', 'Pediatrics'], beds: 200, wait: '~20 min', capacity: 91, contact: '+91-11-26707437' },
]

export const NEARBY_AMBULANCES = [
  { id: 'AMB-01', type: 'ALS', callSign: 'DELHI-ALS-017', driver: 'Rajesh Kumar', distance: '1.2 km', eta: '3 min', status: 'available', equipment: ['Defibrillator', 'Ventilator', 'Cardiac Monitor'], phone: '+91 98765 43210' },
  { id: 'AMB-02', type: 'BLS', callSign: 'DELHI-BLS-042', driver: 'Amit Sharma', distance: '2.4 km', eta: '5 min', status: 'available', equipment: ['First Aid', 'Oxygen', 'Stretcher'], phone: '+91 98765 43211' },
  { id: 'AMB-03', type: 'ALS', callSign: 'DELHI-ALS-009', driver: 'Sunil Verma', distance: '3.1 km', eta: '7 min', status: 'available', equipment: ['Defibrillator', 'Ventilator', 'IV Setup'], phone: '+91 98765 43212' },
  { id: 'AMB-04', type: 'BLS', callSign: 'NCR-BLS-088', driver: 'Pradeep Singh', distance: '4.5 km', eta: '9 min', status: 'en-route', equipment: ['First Aid', 'Oxygen', 'Stretcher'], phone: '+91 98765 43213' },
  { id: 'AMB-05', type: 'ALS', callSign: 'DELHI-ALS-031', driver: 'Vikram Yadav', distance: '5.8 km', eta: '12 min', status: 'available', equipment: ['Defibrillator', 'Cardiac Monitor', 'Drug Kit'], phone: '+91 98765 43214' },
]

export const BLOOD_BANKS = [
  { id: 1, name: 'Indian Red Cross Society', city: 'Delhi', distance: '3.2 km', stocks: { 'A+': 24, 'A-': 8, 'B+': 31, 'B-': 5, 'AB+': 12, 'AB-': 3, 'O+': 45, 'O-': 9 }, lastUpdated: '2 min ago', phone: '+91 11 2371 6441' },
  { id: 2, name: 'Rotary Blood Bank', city: 'Delhi', distance: '5.1 km', stocks: { 'A+': 18, 'A-': 6, 'B+': 22, 'B-': 3, 'AB+': 9, 'AB-': 2, 'O+': 38, 'O-': 7 }, lastUpdated: '5 min ago', phone: '+91 11 2658 8836' },
  { id: 3, name: 'AIIMS Blood Centre', city: 'Delhi', distance: '8.2 km', stocks: { 'A+': 42, 'A-': 14, 'B+': 56, 'B-': 11, 'AB+': 18, 'AB-': 6, 'O+': 67, 'O-': 15 }, lastUpdated: '1 min ago', phone: '+91 11 2659 3371' },
]

export const ICU_DATA = [
  { id: 1, hospital: 'Fortis Escorts Heart Institute', totalICU: 30, occupiedICU: 24, ventilators: { total: 15, available: 4 }, type: 'Cardiac ICU', lastUpdated: '30s ago' },
  { id: 2, hospital: 'Max Super Speciality Hospital', totalICU: 45, occupiedICU: 39, ventilators: { total: 20, available: 5 }, type: 'Multi-specialty ICU', lastUpdated: '1 min ago' },
  { id: 3, hospital: 'AIIMS Trauma Centre', totalICU: 60, occupiedICU: 41, ventilators: { total: 30, available: 12 }, type: 'Trauma ICU', lastUpdated: '15s ago' },
  { id: 4, hospital: 'Safdarjung Hospital', totalICU: 40, occupiedICU: 37, ventilators: { total: 18, available: 2 }, type: 'General ICU', lastUpdated: '45s ago' },
  { id: 5, hospital: 'Sir Ganga Ram Hospital', totalICU: 35, occupiedICU: 28, ventilators: { total: 16, available: 6 }, type: 'Neuro ICU', lastUpdated: '2 min ago' },
]

export const NCR_NODES = [
  { id: 'cp', label: 'CP', x: 42, y: 28, load: 62, kind: 'hospital' },
  { id: 'aiims', label: 'AIIMS', x: 48, y: 46, load: 71, kind: 'trauma' },
  { id: 'okhla', label: 'Okhla', x: 58, y: 62, load: 54, kind: 'hospital' },
  { id: 'dwarka', label: 'Dwarka', x: 18, y: 58, load: 48, kind: 'hospital' },
  { id: 'gurgaon', label: 'Gurugram', x: 22, y: 78, load: 66, kind: 'hospital' },
  { id: 'noida', label: 'Noida', x: 78, y: 52, load: 58, kind: 'hospital' },
  { id: 'ghaziabad', label: 'Ghaziabad', x: 82, y: 28, load: 44, kind: 'hospital' },
  { id: 'rohini', label: 'Rohini', x: 28, y: 18, load: 39, kind: 'hospital' },
]

export const AMBULANCE_PINS = [
  { id: 'a1', x: 36, y: 40, type: 'ALS' },
  { id: 'a2', x: 54, y: 34, type: 'BLS' },
  { id: 'a3', x: 61, y: 70, type: 'ALS' },
  { id: 'a4', x: 30, y: 72, type: 'BLS' },
]

export const CARE_CIRCLE = [
  { name: 'Rohit Sharma', relation: 'Spouse', phone: '+91 98100 11208', status: 'primary' },
  { name: 'Dr. Meera Kapoor', relation: 'Family physician', phone: '+91 11 4050 2211', status: 'clinician' },
  { name: 'Priya Nair', relation: 'Sister', phone: '+91 98711 44008', status: 'family' },
]

export const OXYGEN_SUPPLIERS = [
  { name: 'Noida Oxygen Hub', city: 'Noida', eta: '18 min', cylinders: 14, kind: 'Medical O₂' },
  { name: 'Delhi Medical Gases', city: 'Delhi', eta: '22 min', cylinders: 9, kind: 'B-type + concentrator' },
  { name: 'Gurgaon LifeAir', city: 'Gurugram', eta: '27 min', cylinders: 6, kind: 'Home ICU kit' },
]

export const NIGHT_PHARMACIES = [
  { name: 'Apollo 24×7', city: 'Delhi', open: 'Open now', stock: ['Insulin', 'Amlodipine', 'GTN spray'] },
  { name: 'MedPlus Night Counter', city: 'Noida', open: 'Open now', stock: ['Metformin', 'Aspirin', 'ORS'] },
  { name: 'Fortis In-campus Pharmacy', city: 'Gurugram', open: '24h', stock: ['Clopidogrel', 'Statins', 'Insulin'] },
]

export const GOLDEN_HOUR_STEPS = {
  google: [
    { t: '0 min', label: 'Search “nearest hospital”' },
    { t: '12 min', label: 'Drive to a packed ER' },
    { t: '28 min', label: 'No cath lab / ICU' },
    { t: '47 min', label: 'Transfer again' },
    { t: '60 min+', label: 'Golden hour lost' },
  ],
  liferoute: [
    { t: '0.02s', label: 'Sentinel intercept' },
    { t: '4s', label: 'ESI + live bed match' },
    { t: '8s', label: 'ALS + signed FHIR' },
    { t: '3 min', label: 'Ambulance rolling' },
    { t: 'On arrival', label: 'QR intake ready' },
  ],
}

export const NODE_LABELS = {
  safety_sentinel: 'Safety sentinel',
  emergency_fast_track: 'Emergency fast-track',
  intake: 'Analyzing symptoms',
  triage: 'ESI triage',
  geo_router: 'Travel matrix',
  hospital_capacity: 'Live bed telemetry',
  ranking: 'Matching hospitals',
  referral: 'FHIR referral',
  disclaimer: 'Safety checks',
}
