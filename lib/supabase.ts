import { createClient } from "@supabase/supabase-js"

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side (anon key)
export const supabase = createClient(url, anon)

// Server-side (service role — only import in API routes / server components)
export function supabaseServer() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY ?? anon)
}

// ── typed helpers ────────────────────────────────────────────────────────────

export type Setting = {
  id: string
  key: string
  value: string
  updated_at: string
}

export type VanGilsImage = {
  id: string
  name: string
  storage_path: string
  public_url: string
  sort_order: number
  created_at: string
}

export type Generation = {
  id: string
  tool: string
  settings_json: Record<string, unknown>
  prompt_used: string
  output_public_url: string
  created_at: string
}
