import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  // Return ALL properties with lat/lng + joined seller_leads
  const { data, error } = await supabase
    .from('properties')
    .select(`
      id, address, city, county, state, zip, latitude, longitude, arv_mid, mao_standard,
      seller_leads (id, score_tier, score, owner_full_name, status, phone_primary, last_contacted_at, lead_source)
    `)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const mapped = (data || []).map((p: any) => {
    const lead = p.seller_leads?.[0] || null
    return {
      id: lead?.id || `prop-${p.id}`,
      property_id: p.id,
      address: p.address,
      city: p.city,
      county: p.county,
      state: p.state,
      zip: p.zip,
      latitude: p.latitude,
      longitude: p.longitude,
      score_tier: lead?.score_tier || null,
      score: lead?.score || null,
      owner_full_name: lead?.owner_full_name || null,
      status: lead?.status || 'no_lead',
      phone_primary: lead?.phone_primary || null,
      last_contacted_at: lead?.last_contacted_at || null,
      lead_source: lead?.lead_source || null,
      arv_mid: p.arv_mid,
      mao_standard: p.mao_standard,
    }
  })

  return NextResponse.json(mapped)
}