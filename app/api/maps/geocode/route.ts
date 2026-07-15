import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
  // 1. Auth check
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')
  const address = searchParams.get('address')
  
  try {
    let url = ''
    let isReverse = false
    
    if (lat && lon) {
      // Reverse geocoding
      url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      isReverse = true
    } else if (address) {
      // Forward geocoding
      url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
    } else {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MedieGenie/1.0 (officialvansh626@gmail.com)'
      }
    })
    const data = await response.json()

    if (!response.ok) {
      console.error('Nominatim API Error:', data)
      throw new Error('Nominatim API returned an error')
    }

    // Standardize output to match existing frontend expectations (similar to Google results)
    let results = []
    
    if (isReverse) {
      if (data && !data.error) {
        results.push({
          formatted_address: data.display_name,
          geometry: {
            location: {
              lat: parseFloat(data.lat),
              lng: parseFloat(data.lon)
            }
          }
        })
      }
    } else {
      if (Array.isArray(data) && data.length > 0) {
        results.push({
          formatted_address: data[0].display_name,
          geometry: {
            location: {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon)
            }
          }
        })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Geocoding proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch location data. Please try again.' },
      { status: 500 }
    )
  }
}
