import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.error('Missing GOOGLE_MAPS_API_KEY')
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
  }

  try {
    const { lat, lon, radius, isEmergency } = await req.json()

    if (lat === undefined || lon === undefined || radius === undefined) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Determine types to search
    // Using Places API (New) supported types
    // https://developers.google.com/maps/documentation/places/web-service/supported_types
    const includedTypes = isEmergency
      ? ['hospital']
      : ['hospital', 'pharmacy', 'medical_clinic', 'medical_lab']

    const requestBody = {
      includedTypes,
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: lat,
            longitude: lon
          },
          radius: radius // in meters
        }
      }
    }

    const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        // Request only the fields we need to save bandwidth and billing costs
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types'
      },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Google Places API Error:', data.error)
      throw new Error(data.error?.message || 'Failed to fetch places')
    }

    // Google API returns an object with a `places` array if there are results
    return NextResponse.json({ places: data.places || [] })

  } catch (error) {
    console.error('Places proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nearby facilities. Please try again.' },
      { status: 500 }
    )
  }
}
