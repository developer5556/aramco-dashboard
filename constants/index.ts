export const COUNTIES = [
  { value: 'baltimore_county', label: 'Baltimore County' },
  { value: 'baltimore_city', label: 'Baltimore City' },
  { value: 'howard_county', label: 'Howard County' },
  { value: 'carroll_county', label: 'Carroll County' },
  { value: 'anne_arundel_county', label: 'Anne Arundel County' },
  { value: 'montgomery_county', label: 'Montgomery County' },
]

export const AGENTS = [
  { id: 'director', name: 'Director', icon: '🎯', color: '#6366F1', role: 'Executive Manager' },
  { id: 'atlas', name: 'Atlas', icon: '🔍', color: '#06B6D4', role: 'Lead Acquisition' },
  { id: 'mason', name: 'Mason', icon: '📞', color: '#10B981', role: 'Outreach Specialist' },
  { id: 'nadia', name: 'Nadia', icon: '📋', color: '#F59E0B', role: 'Transaction Coordinator' },
  { id: 'sentinel', name: 'Sentinel', icon: '📊', color: '#8B5CF6', role: 'Market Intelligence' },
  { id: 'phoenix', name: 'Phoenix', icon: '🏆', color: '#EF4444', role: 'Buyer Acquisition' },
]

export const PIPELINE_STAGES = [
  { value: 'lead_qualified', label: 'Lead Qualified', order: 1 },
  { value: 'appointment_done', label: 'Appointment Done', order: 2 },
  { value: 'offer_submitted', label: 'Offer Submitted', order: 3 },
  { value: 'under_contract', label: 'Under Contract', order: 4 },
  { value: 'buyer_matching', label: 'Buyer Matching', order: 5 },
  { value: 'buyer_under_contract', label: 'Buyer Under Contract', order: 6 },
  { value: 'inspection_period', label: 'Inspection Period', order: 7 },
  { value: 'closing_scheduled', label: 'Closing Scheduled', order: 8 },
  { value: 'closed', label: 'Closed', order: 9 },
]

export const LEAD_STATUSES = [
  'new', 'researching', 'no_contact', 'contacted', 'warm',
  'hot', 'appointment_set', 'appointment_done', 'offer_submitted',
  'under_contract', 'dead', 'dnc'
]

export const BUYER_STRATEGIES = [
  { value: 'fix_and_flip', label: 'Fix & Flip' },
  { value: 'buy_and_hold', label: 'Buy & Hold' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'development', label: 'Development' },
]

export const PROPERTY_TYPES = [
  { value: 'sfr', label: 'Single Family' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'triplex', label: 'Triplex' },
  { value: 'fourplex', label: 'Fourplex' },
  { value: 'multi_family', label: 'Multi-Family' },
]
