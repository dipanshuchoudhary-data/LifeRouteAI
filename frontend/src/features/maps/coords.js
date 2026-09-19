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
}

export function hospitalLatLng(hospital) {
  if (hospital?.lat != null && hospital?.lng != null) {
    return { lat: Number(hospital.lat), lng: Number(hospital.lng) }
  }
  const named = HOSPITAL_COORDS[hospital?.name]
  if (named) return { lat: named[0], lng: named[1] }
  return { ...DEFAULT_ORIGIN }
}
