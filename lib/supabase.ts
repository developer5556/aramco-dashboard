import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Type helpers ──────────────────────────────────────────────
export type SellerLead = {
  id: string
  property_id: string | null
  owner_full_name: string | null
  owner_entity_name: string | null
  phone_primary: string | null
  email: string | null
  status: string
  score: number | null
  score_tier: 'hot' | 'warm' | 'cool' | 'skip' | null
  lead_source: string | null
  county: string | null
  next_followup_at: string | null
  last_contacted_at: string | null
  created_at: string
  tax_delinquent: boolean
  pre_foreclosure: boolean
  code_violations: boolean
  vacant: boolean
  probate: boolean
  asking_price: number | null
  mortgage_balance: number | null
  mailing_address: string | null
  is_absentee_owner: boolean
  properties?: Property
}

export type Property = {
  id: string
  address: string
  city: string
  state: string
  zip: string
  county: string
  property_type: string
  bedrooms: number | null
  bathrooms: number | null
  square_feet: number | null
  year_built: number | null
  arv_low: number | null
  arv_mid: number | null
  arv_high: number | null
  arv_confidence: string | null
  repair_scope: string | null
  repair_cost_low: number | null
  repair_cost_high: number | null
  mao_conservative: number | null
  mao_standard: number | null
  mao_aggressive: number | null
  neighborhood_score: number | null
  neighborhood_grade: string | null
  last_sale_price: number | null
  last_sale_date: string | null
}

export type BuyerLead = {
  id: string
  full_name: string | null
  entity_name: string | null
  phone: string
  email: string | null
  tier: 'tier1' | 'tier2' | 'tier3' | 'inactive'
  strategy: string | null
  min_price: number | null
  max_price: number | null
  pof_verified: boolean
  pof_verified_date: string | null
  pof_amount: number | null
  total_purchases: number
  last_contact_date: string | null
  target_counties: string[] | null
  is_active: boolean
  created_at: string
}

export type PipelineDeal = {
  id: string
  property_id: string
  seller_lead_id: string | null
  stage: string
  offer_price: number | null
  contract_price: number | null
  assignment_fee: number | null
  buyer_price: number | null
  net_to_aramco: number | null
  closing_date: string | null
  inspection_period_end: string | null
  earnest_money_due_at: string | null
  created_at: string
  properties?: Property
  seller_leads?: SellerLead
  buyer_leads?: BuyerLead
}

export type Activity = {
  id: string
  agent: string
  action: string
  entity_type: string | null
  entity_id: string | null
  summary: string | null
  created_at: string
}

export type Appointment = {
  id: string
  seller_lead_id: string | null
  property_id: string | null
  scheduled_at: string
  duration_minutes: number
  status: string
  notes: string | null
  location: string | null
  reminder_24h_sent: boolean
  reminder_1h_sent: boolean
  seller_leads?: SellerLead
  properties?: Property
}

export type Task = {
  id: string
  title: string
  description: string | null
  assigned_to: string
  priority: string
  status: string
  due_at: string | null
  completed_at: string | null
  created_at: string
}

export type Approval = {
  id: string
  title: string
  description: string | null
  entity_type: string | null
  entity_id: string | null
  status: 'pending' | 'approved' | 'denied'
  requested_by: string | null
  created_at: string
}
