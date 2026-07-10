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
  
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.error('Missing GOOGLE_MAPS_API_KEY')
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
  }

  try {
    let url = ''
    if (lat && lon) {
      // Reverse geocoding
      url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`
    } else if (address) {
      // Forward geocoding
      url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    } else {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK') {
      if (data.status === 'ZERO_RESULTS') {
         return NextResponse.json({ results: [] })
      }
      console.error('Google Geocoding API Error:', data.status, data.error_message)
      throw new Error(`Google API returned status: ${data.status}`)
    }

    return NextResponse.json({ results: data.results })
  } catch (error) {
    console.error('Geocoding proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch location data. Please try again.' },
      { status: 500 }
    )
  }
}
