export const DEFAULT_ORIGIN = { lat: 28.6139, lng: 77.209 }

export const HOSPITAL_COORDS = {
  'AIIMS Trauma Centre': [28.5672, 77.21],
  'Fortis Escorts Heart Institute': [28.5621, 77.2754],
  'Max Super Speciality Hospital': [28.5276, 77.219],
  'Sir Ganga Ram Hospital': [28.6389, 77.1895],
  'Safdarjung Hospital': [28.5665, 77.2075],
  'Medanta - The Medicity': [28.4392, 77.0415],
  'Artemis Hospital': [28.4215, 77.0712],
  'Fortis Memorial Research Institute': [28.4501, 77.0823],
  'Paras Hospital': [28.4134, 77.0489],
  'Columbia Asia Hospital': [28.4598, 77.0265],
  'Jaypee Hospital': [28.3521, 77.3278],
  'Fortis Hospital Noida': [28.6245, 77.3641],
  'Max Super Speciality Hospital Noida': [28.5842, 77.3265],
  'Yatharth Super Speciality Hospital': [28.5356, 77.391],
  'Kailash Hospital & Heart Institute': [28.5789, 77.3312],
  'Apollo Hospitals Noida': [28.5748, 77.3261],
  'Metro Hospital Noida': [28.5906, 77.3179],
  'Felix Hospital Noida': [28.5084, 77.4092],
  'Sharda Hospital Greater Noida': [28.4736, 77.4831],
  'Kailash Hospital Greater Noida': [28.4743, 77.5034],
  'Narayana Superspeciality Hospital Gurugram': [28.4946, 77.0884],
  'CK Birla Hospital Gurugram': [28.4379, 77.0717],
  'Manipal Hospital Gurugram': [28.4302, 77.0654],
  'W Pratiksha Hospital Gurugram': [28.4086, 77.0703],
  'Cloudnine Hospital Gurugram': [28.4129, 77.0481],
}

export const DEMO_ORIGINS = [
  { id: 'noida', label: 'Noida Sector 62', lat: 28.6271, lng: 77.3649 },
  { id: 'greater-noida', label: 'Greater Noida', lat: 28.4742, lng: 77.5039 },
  { id: 'gurugram', label: 'Gurugram Cyber City', lat: 28.4946, lng: 77.0882 },
  { id: 'delhi', label: 'Delhi CP', lat: 28.6139, lng: 77.209 },
]

export function hospitalLatLng(hospital) {
  if (hospital?.lat != null && hospital?.lng != null) {
    return { lat: Number(hospital.lat), lng: Number(hospital.lng) }
  }
  const named = HOSPITAL_COORDS[hospital?.name]
  if (named) return { lat: named[0], lng: named[1] }
  return { ...DEFAULT_ORIGIN }
}
