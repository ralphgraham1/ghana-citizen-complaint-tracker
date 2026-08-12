export type UserRole = 'citizen' | 'department_staff' | 'super_admin'

export type ComplaintCategory = 'pothole' | 'streetlight' | 'waste_bin' | 'drainage' | 'infrastructure' | 'other'

export type ComplaintStatus = 'submitted' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'rejected'

export interface Department {
  id: string
  name: string
  description: string | null
}

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: UserRole
  department_id: string | null
  created_at: string
}

export interface Complaint {
  id: string
  citizen_id: string
  category: ComplaintCategory
  title: string
  description: string
  photo_url: string | null
  latitude: number
  longitude: number
  address_text: string | null
  status: ComplaintStatus
  department_id: string | null
  assigned_staff_id: string | null
  ai_suggested_category: ComplaintCategory | null
  ai_suggested_department_id: string | null
  ai_confidence: number | null
  created_at: string
  updated_at: string
}

export interface PublicComplaint {
  id: string
  category: ComplaintCategory
  title: string
  description: string
  photo_url: string | null
  latitude: number
  longitude: number
  address_text: string | null
  status: ComplaintStatus
  department_id: string | null
  created_at: string
  updated_at: string
}

export interface ComplaintStatusHistory {
  id: string
  complaint_id: string
  old_status: ComplaintStatus | null
  new_status: ComplaintStatus
  changed_by: string
  note: string | null
  created_at: string
}

export interface ComplaintComment {
  id: string
  complaint_id: string
  author_id: string
  comment: string
  created_at: string
}
