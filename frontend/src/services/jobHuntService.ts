// API base URL — use VITE_API_URL if set (production), otherwise relative path (dev with vite proxy)
const BASE_API_URL = import.meta.env.VITE_API_URL || ''
const API_URL = `${BASE_API_URL}/api/job-hunt`

export type RecurrenceType = 'weekly' | 'daily'
export type JobHuntTone = 'technical' | 'storytelling' | 'achievement'
export type RecurringScheduleStatus = 'active' | 'paused'

export interface RecurrencePattern {
  type: RecurrenceType
  daysOfWeek?: number[]
  timeOfDay: string
}

export interface RecurringSchedule {
  _id: string
  userId: string
  name: string
  status: RecurringScheduleStatus
  subDomains: string[]
  tone: JobHuntTone
  hotTopics: string[]
  recurrencePattern: RecurrencePattern
  includeImage: boolean
  imageStyle?: string
  endDate?: string | null
  nextRunAt: string
  lastGeneratedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface SchedulePayload {
  name?: string
  status?: RecurringScheduleStatus
  subDomains?: string[]
  tone?: JobHuntTone
  hotTopics?: string[]
  recurrencePattern?: RecurrencePattern
  includeImage?: boolean
  imageStyle?: string
  endDate?: string | null
}

export interface PreviewPost {
  title: string
  content: string
  imageUrl: string | null
  imageError?: string
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function createSchedule(
  token: string,
  payload: SchedulePayload
): Promise<{ success: boolean; schedule?: RecurringSchedule; message?: string }> {
  const res = await fetch(`${API_URL}/schedules`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function listSchedules(
  token: string
): Promise<{ success: boolean; schedules?: RecurringSchedule[]; message?: string }> {
  const res = await fetch(`${API_URL}/schedules`, {
    headers: authHeaders(token),
  })
  return res.json()
}

export async function updateSchedule(
  token: string,
  id: string,
  payload: SchedulePayload
): Promise<{ success: boolean; schedule?: RecurringSchedule; message?: string }> {
  const res = await fetch(`${API_URL}/schedules/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function deleteSchedule(
  token: string,
  id: string
): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${API_URL}/schedules/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  return res.json()
}

export async function previewJobHuntPost(
  token: string,
  payload: SchedulePayload
): Promise<{ success: boolean; post?: PreviewPost; message?: string }> {
  const res = await fetch(`${API_URL}/preview`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
  return res.json()
}

export interface GeneratedItem {
  _id: string
  recurringScheduleId: string
  platform: string
  date: string
  time?: string | null
  title: string
  content: string
  imageUrl?: string | null
  status: 'draft' | 'scheduled' | 'published'
  createdAt: string
  updatedAt: string
}

export async function listScheduleItems(
  token: string,
  scheduleId: string
): Promise<{ success: boolean; items?: GeneratedItem[]; message?: string }> {
  const res = await fetch(`${API_URL}/schedules/${scheduleId}/items`, {
    headers: authHeaders(token),
  })
  return res.json()
}

export async function runScheduleNow(
  token: string,
  scheduleId: string
): Promise<{ success: boolean; item?: GeneratedItem; message?: string }> {
  const res = await fetch(`${API_URL}/schedules/${scheduleId}/run-now`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  return res.json()
}
