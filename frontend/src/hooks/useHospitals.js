import { useState, useEffect } from 'react'

export default function useHospitals(apiUrl) {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`${apiUrl}/hospitals`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setHospitals(data.hospitals || [])
          setLoading(false)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [apiUrl])

  return { hospitals, loading, error }
}
