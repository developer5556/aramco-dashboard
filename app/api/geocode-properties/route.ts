import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function geocodeAddress(address: string, city: string, state: string, zip: string): Promise<{lat: number; lng: number} | null> {
  const query = [address, city, state, zip].filter(Boolean).join(', ')
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AramcoDashboard/1.0 (hamzaadnan55@gmail.com)' }
    })
    const data = await res.json()
    if (data?.[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch {}
  return null
}

export async function POST() {
  // Get all properties without lat/lng
  const { data: props, error } = await supabase
    .from('properties')
    .select('id, address, city, state, zip')
    .or('latitude.is.null,longitude.is.null')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!props || props.length === 0) {
    return NextResponse.json({ geocoded: 0, message: 'All properties already geocoded' })
  }

  let geocoded = 0
  for (const p of props) {
    const coords = await geocodeAddress(p.address || '', p.city || '', p.state || '', p.zip || '')
    if (coords) {
      await supabase
        .from('properties')
        .update({ latitude: coords.lat, longitude: coords.lng })
        .eq('id', p.id)
      geocoded++
    }
    // Nominatim rate limit: 1 req/sec
    await new Promise(r => setTimeout(r, 1100))
  }

  return NextResponse.json({ geocoded, total: props.length })
}