'use client'

import React, { useState, useEffect } from 'react'
import { MapPin, Navigation, Search, Loader2, AlertCircle, Building2, ExternalLink, ShieldAlert } from 'lucide-react'

interface Facility {
  id: string
  displayName?: { text: string }
  formattedAddress?: string
  location: { latitude: number, longitude: number }
  primaryType?: string
  types?: string[]
  distance?: number // computed distance in km
}

interface FacilityFinderProps {
  isEmergency?: boolean
}

// Haversine formula to calculate straight-line distance
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180)
}

export default function FacilityFinder({ isEmergency = false }: FacilityFinderProps) {
  const [coords, setCoords] = useState<{ lat: number, lon: number } | null>(null)
  const [currentAddress, setCurrentAddress] = useState<string>('')
  
  const [radius, setRadius] = useState<number>(5000) // 5km default
  const [facilities, setFacilities] = useState<Facility[]>([])
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Manual address input fallback
  const [manualAddress, setManualAddress] = useState('')
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geoDenied, setGeoDenied] = useState(false)

  // 1. On mount, try to get GPS coords
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
          reverseGeocode(position.coords.latitude, position.coords.longitude)
        },
        (err) => {
          console.warn('Geolocation denied or failed', err)
          setGeoDenied(true)
        },
        { timeout: 10000, maximumAge: 60000 }
      )
    } else {
      setGeoDenied(true)
    }
  }, [])

  // 2. Fetch facilities when coordinates or radius change
  useEffect(() => {
    if (coords) {
      fetchFacilities(coords.lat, coords.lon, radius)
    }
  }, [coords, radius])

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`/api/maps/geocode?lat=${lat}&lon=${lon}`)
      const data = await res.json()
      if (res.ok && data.results && data.results.length > 0) {
        setCurrentAddress(data.results[0].formatted_address)
      } else {
        setCurrentAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`)
      }
    } catch (err) {
      console.error('Reverse geocode failed', err)
      setCurrentAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`)
    }
  }

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualAddress.trim()) return

    setIsGeocoding(true)
    setError(null)
    try {
      const res = await fetch(`/api/maps/geocode?address=${encodeURIComponent(manualAddress)}`)
      const data = await res.json()
      
      if (res.ok && data.results && data.results.length > 0) {
        const result = data.results[0]
        setCoords({ lat: result.geometry.location.lat, lon: result.geometry.location.lng })
        setCurrentAddress(result.formatted_address)
        setGeoDenied(false)
      } else {
        setError("Could not find that location. Please try a more specific address or city.")
      }
    } catch (err) {
      setError("Failed to search location. Please check your network and try again.")
    } finally {
      setIsGeocoding(false)
    }
  }

  const fetchFacilities = async (lat: number, lon: number, radiusMeters: number) => {
    setIsLoading(true)
    setError(null)
    setFacilities([])
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const res = await fetch('/api/maps/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lat, lon, radius: radiusMeters, isEmergency }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Server API returned an error')
      }
      
      if (data.places) {
        // Map and calculate distance
        const results: Facility[] = data.places
          .filter((el: Facility) => el.location)
          .map((el: Facility) => {
            const dist = getDistanceFromLatLonInKm(lat, lon, el.location.latitude, el.location.longitude)
            return {
              ...el,
              distance: dist
            }
          })
          
        // Sort by distance
        results.sort((a, b) => (a.distance || 0) - (b.distance || 0))
        
        // Remove exact duplicates by ID
        const uniqueResults = results.reduce((acc: Facility[], current) => {
          const exists = acc.find(item => item.id === current.id)
          if (!exists) {
            acc.push(current)
          }
          return acc
        }, [])

        setFacilities(uniqueResults)
      }
    } catch (err: any) {
      console.error('Places fetch failed', err)
      if (err.name === 'AbortError') {
         setError("The request timed out. The server might be slow right now.")
      } else {
         setError("Couldn't load nearby facilities. Please try again or check your location settings.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeLabel = (fac: Facility) => {
    const types = fac.types || []
    if (types.includes('hospital')) return 'Hospital'
    if (types.includes('pharmacy')) return 'Pharmacy'
    if (types.includes('medical_clinic')) return 'Clinic'
    if (types.includes('medical_lab')) return 'Laboratory'
    return 'Medical Facility'
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        
        {/* Current Location Display */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-xl mt-1 ${isEmergency ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Search Center</h3>
              <p className="text-sm text-slate-500 line-clamp-2">
                {currentAddress || (geoDenied ? 'Location access denied or unavailable' : 'Detecting location...')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Radius:</label>
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={2000}>2 km</option>
              <option value={5000}>5 km</option>
              <option value={10000}>10 km</option>
              <option value={25000}>25 km</option>
              <option value={50000}>50 km</option>
            </select>
          </div>
        </div>

        {/* Manual Address Fallback Form */}
        {geoDenied && (
          <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="Enter a city, zip code, or address to search..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={isGeocoding || !manualAddress.trim()}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGeocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search Area
            </button>
          </form>
        )}
      </div>

      {/* 2. Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* 3. Emergency Banner */}
      {isEmergency && facilities.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4">
          <ShieldAlert className="h-8 w-8 text-rose-600 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-rose-800">
              Emergency Facilities Nearby
            </h2>
            <p className="text-sm text-rose-700 mt-1 font-medium">
              We have found nearby hospitals for you, but please do not wait if you are in immediate danger. Call your local emergency services (e.g. 911) immediately.
            </p>
          </div>
        </div>
      )}

      {/* 4. Results List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="text-slate-500 font-medium text-sm">Searching Google Maps for facilities within {radius / 1000}km...</p>
          </div>
        ) : facilities.length > 0 ? (
          facilities.map((fac) => {
            const types = fac.types || []
            const isHosp = types.includes('hospital')
            const isPharm = types.includes('pharmacy')
            
            return (
              <div key={fac.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl flex-shrink-0 mt-1 ${
                    isHosp ? 'bg-rose-100 text-rose-600' : 
                    isPharm ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-800 text-lg">
                        {fac.displayName?.text || 'Unnamed Facility'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                        {getTypeLabel(fac)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {fac.formattedAddress || 'Address not listed'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2 sm:gap-3 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
                  <div className="text-sm font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg">
                    {fac.distance?.toFixed(1)} km away
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${fac.location.latitude},${fac.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
                  >
                    <Navigation className="h-4 w-4" />
                    Get Directions
                    <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-70" />
                  </a>
                </div>
              </div>
            )
          })
        ) : (
          coords && !isLoading && !error && (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
              No medical facilities found within {radius / 1000}km of your location. Try increasing the search radius or manually entering a nearby city.
            </div>
          )
        )}
      </div>
    </div>
  )
}
