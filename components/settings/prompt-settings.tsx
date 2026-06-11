"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Save } from "lucide-react"

const KEY = "splash_panel_prompt"

export function PromptSettings() {
  const [value, setValue] = useState("")
  const [original, setOriginal] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from("VanGils_settings")
      .select("value")
      .eq("key", KEY)
      .single()
      .then(({ data, error }) => {
        if (error) { toast.error("Kon prompt niet laden."); return }
        setValue(data.value)
        setOriginal(data.value)
        setLoading(false)
      })
  }, [])

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from("VanGils_settings")
      .upsert({ key: KEY, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
    setSaving(false)
    if (error) { toast.error("Opslaan mislukt."); return }
    setOriginal(value)
    toast.success("Prompt opgeslagen.")
  }

  const dirty = value !== original

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Splash Panel prompt</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gebruik <code className="text-xs bg-muted px-1 py-0.5 rounded">{"{{description}}"}</code>,{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">{"{{format}}"}</code>,{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">{"{{scenes}}"}</code>,{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">{"{{layout}}"}</code>,{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">{"{{lineWeight}}"}</code>,{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">{"{{mood}}"}</code>,{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">{"{{audience}}"}</code>,{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">{"{{season}}"}</code>,{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">{"{{styleRefLine}}"}</code> als placeholders.
        </p>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      ) : (
        <div className="space-y-2">
          <Label className="sr-only">Prompt</Label>
          <Textarea
            rows={20}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="font-mono text-xs"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        {dirty && <p className="text-xs text-muted-foreground">Niet-opgeslagen wijzigingen</p>}
        <Button
          className="ml-auto gap-2"
          disabled={!dirty || saving || loading}
          onClick={save}
        >
          <Save className="h-4 w-4" />
          {saving ? "Opslaan…" : "Opslaan"}
        </Button>
      </div>
    </div>
  )
}
