export type Service = {
  id: string
  name: string
  description: string
  duration_minutes: number
  price_cents: number
  accent: string
  active: boolean
}

type BookingRow = {
  id: string
  service_id: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  booking_date: string
  start_time: string
  notes: string | null
  status: 'confirmed' | 'cancelled'
  created_at: string
}

type BookingInsert = Omit<BookingRow, 'id' | 'status' | 'created_at'> & {
  id?: string
  status?: 'confirmed' | 'cancelled'
  created_at?: string
}

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      services: Table<Service, Omit<Service, 'id'> & { id?: string }>
      bookings: Table<BookingRow, BookingInsert>
      equipment_booking_requests: Table<EquipmentRequestRow, EquipmentRequestInsert>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

type EquipmentRequestStatus = 'pending' | 'reviewed' | 'recommended' | 'approved' | 'rejected'

type EquipmentRequestRow = {
  id: string
  requester_name: string
  department_college: string
  contact_number: string
  event_organizer: string
  event_name: string
  event_date: string
  start_time: string
  end_time: string
  venue_location: string
  requested_items: string[]
  reviewed_by: string | null
  recommending_approval_by: string | null
  approved_by: string | null
  status: EquipmentRequestStatus
  created_at: string
}

type EquipmentRequestInsert = Omit<EquipmentRequestRow,
  'id' | 'reviewed_by' | 'recommending_approval_by' | 'approved_by' | 'status' | 'created_at'
> & {
  id?: string
  reviewed_by?: null
  recommending_approval_by?: null
  approved_by?: null
  status?: 'pending'
  created_at?: string
}
