import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { lat, lon, radius, isEmergency } = await req.json()

    if (lat === undefined || lon === undefined || radius === undefined) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Build Overpass QL query
    let query = `[out:json][timeout:15];\n(\n`
    
    if (isEmergency) {
      query += `  node["amenity"="hospital"](around:${radius},${lat},${lon});\n`
      query += `  way["amenity"="hospital"](around:${radius},${lat},${lon});\n`
    } else {
      const amenities = ['hospital', 'pharmacy', 'clinic', 'doctors']
      for (const am of amenities) {
        query += `  node["amenity"="${am}"](around:${radius},${lat},${lon});\n`
        query += `  way["amenity"="${am}"](around:${radius},${lat},${lon});\n`
      }
      query += `  node["healthcare"="laboratory"](around:${radius},${lat},${lon});\n`
      query += `  way["healthcare"="laboratory"](around:${radius},${lat},${lon});\n`
    }
    
    query += `);\nout center 30;` // limit to 30 results for speed

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'MedieGenie/1.0 (officialvansh626@gmail.com)'
      },
      body: `data=${encodeURIComponent(query)}`
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Overpass API Error:', data)
      throw new Error('Failed to fetch places from Overpass API')
    }

    const places = data.elements.map((el: any) => {
      // Determine type
      let primaryType = 'medical_facility'
      const types = []
      const tags = el.tags || {}
      
      if (tags.amenity === 'hospital') { types.push('hospital'); primaryType = 'hospital' }
      if (tags.amenity === 'pharmacy') { types.push('pharmacy'); primaryType = 'pharmacy' }
      if (tags.amenity === 'clinic' || tags.amenity === 'doctors') { types.push('medical_clinic'); primaryType = 'medical_clinic' }
      if (tags.healthcare === 'laboratory') { types.push('medical_lab'); primaryType = 'medical_lab' }

      // Construct address
      const addrParts = []
      if (tags['addr:housenumber'] && tags['addr:street']) {
        addrParts.push(`${tags['addr:housenumber']} ${tags['addr:street']}`)
      } else if (tags['addr:street']) {
        addrParts.push(tags['addr:street'])
      }
      if (tags['addr:city']) addrParts.push(tags['addr:city'])
      
      const formattedAddress = addrParts.length > 0 ? addrParts.join(', ') : ''

      return {
        id: el.id.toString(),
        displayName: {
          text: tags.name || 'Unnamed Facility'
        },
        formattedAddress,
        location: {
          latitude: el.lat || el.center?.lat,
          longitude: el.lon || el.center?.lon
        },
        primaryType,
        types,
        phone: tags.phone || tags['contact:phone'] || null,
        openingHours: tags.opening_hours || null
      }
    })

    return NextResponse.json({ places })

  } catch (error) {
    console.error('Places proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nearby facilities. Please try again.' },
      { status: 500 }
    )
  }
}
