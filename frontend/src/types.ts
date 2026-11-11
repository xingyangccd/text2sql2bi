export type ChartType = 'kpi' | 'bar' | 'line' | 'pie' | 'table'

export interface ChartSpec {
  type: ChartType
  title: string
  option: Record<string, unknown>
}

export interface QueryResponse {
  question: string
  answer: string
  sql: string
  success: boolean
  columns: string[]
  rows: unknown[][]
  row_count: number
  chart: ChartSpec | null
  duration_ms: number
  from_cache: boolean
  error: string | null
}

export interface Dashboard {
  id: string
  name: string
  description: string
  definition: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface QueryHistoryRecord {
  id: number
  question: string
  sql: string
  chart_type: ChartType
  duration_ms: number
  created_at: string
}
