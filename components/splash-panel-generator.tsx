"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Wand2, Download, Palette, Loader2, ImageOff, BookmarkCheck, Bookmark } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { SplashPanelBody } from "@/app/api/splash-panel/route"

// ── reusable option-pill group ──────────────────────────────────────────────
function OptionGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              value === o.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── default settings ─────────────────────────────────────────────────────────
const DEFAULTS: Omit<SplashPanelBody, "description"> = {
  format: "portrait",
  scenes: 4,
  layout: "mixed",
  lineWeight: "medium",
  mood: "Professioneel",
  audience: "Breed publiek",
  season: "none",
  useStyleRef: true,
}

export function SplashPanelGenerator() {
  const router = useRouter()
  const [description, setDescription] = useState("")
  const [settings, setSettings] = useState(DEFAULTS)
  const [result, setResult] = useState<string | null>(null)
  const [promptUsed, setPromptUsed] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof typeof DEFAULTS>(key: K, value: (typeof DEFAULTS)[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function generate() {
    if (!description.trim()) {
      toast.error("Voer een beschrijving in.")
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    setSaved(false)
    try {
      const res = await fetch("/api/splash-panel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, ...settings }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.debug || data.error || "Er ging iets mis.")
      setResult(data.image)
      setPromptUsed(data.promptUsed ?? "")
      toast.success("Splash panel gegenereerd!")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Er ging iets mis."
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  function download() {
    if (!result) return
    const a = document.createElement("a")
    a.href = result
    a.download = "splash-panel.png"
    a.click()
  }

  function sendToColouring() {
    if (!result) return
    sessionStorage.setItem("injected_image", result)
    router.push("/colouring")
  }

  async function saveGeneration() {
    if (!result) return
    setSaving(true)
    try {
      const res = await fetch("/api/save-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "splash_panels",
          imageDataUrl: result,
          settingsJson: { description, ...settings },
          promptUsed,
        }),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
      toast.success("Opgeslagen.")
    } catch {
      toast.error("Opslaan mislukt.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
      {/* Controls */}
      <Card className="h-fit space-y-5 p-5">

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Beschrijving</Label>
          <Textarea
            rows={3}
            placeholder="bv. een stad met openbaar vervoer, fietspaden en groene daken"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none text-sm"
          />
        </div>

        <div className="h-px bg-border" />

        <OptionGroup
          label="Formaat"
          value={settings.format}
          onChange={(v) => set("format", v)}
          options={[
            { value: "portrait",  label: "Staand" },
            { value: "landscape", label: "Liggend" },
            { value: "square",    label: "Vierkant" },
          ]}
        />

        <OptionGroup
          label="Aantal scènes"
          value={settings.scenes}
          onChange={(v) => set("scenes", v)}
          options={[1, 2, 3, 4, 6, 9].map((n) => ({ value: n, label: String(n) }))}
        />

        <OptionGroup
          label="Panel layout"
          value={settings.layout}
          onChange={(v) => set("layout", v)}
          options={[
            { value: "grid",    label: "Grid" },
            { value: "mixed",   label: "Gemengd" },
            { value: "circles", label: "Cirkels" },
            { value: "free",    label: "Vrij" },
          ]}
        />

        <OptionGroup
          label="Lijngewicht"
          value={settings.lineWeight}
          onChange={(v) => set("lineWeight", v)}
          options={[
            { value: "fine",   label: "Fijn" },
            { value: "medium", label: "Gemiddeld" },
            { value: "bold",   label: "Bold" },
          ]}
        />

        <div className="h-px bg-border" />

        <OptionGroup
          label="Sfeer"
          value={settings.mood}
          onChange={(v) => set("mood", v)}
          options={["Energiek", "Rustig", "Professioneel", "Speels", "Serieus"].map((m) => ({ value: m, label: m }))}
        />

        <OptionGroup
          label="Doelgroep"
          value={settings.audience}
          onChange={(v) => set("audience", v)}
          options={["Breed publiek", "Jongeren", "Zakelijk", "Gezinnen", "Senioren"].map((a) => ({ value: a, label: a }))}
        />

        <OptionGroup
          label="Seizoen"
          value={settings.season}
          onChange={(v) => set("season", v)}
          options={[
            { value: "none",   label: "Geen" },
            { value: "Lente",  label: "Lente" },
            { value: "Zomer",  label: "Zomer" },
            { value: "Herfst", label: "Herfst" },
            { value: "Winter", label: "Winter" },
          ]}
        />

        <div className="h-px bg-border" />

        {/* Style reference toggle */}
        <label className="flex cursor-pointer items-center gap-3">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={settings.useStyleRef}
              onChange={(e) => set("useStyleRef", e.target.checked)}
            />
            <div className={cn(
              "h-5 w-9 rounded-full transition-colors",
              settings.useStyleRef ? "bg-primary" : "bg-muted",
            )} />
            <div className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
              settings.useStyleRef ? "translate-x-4" : "translate-x-0.5",
            )} />
          </div>
          <span className="text-sm font-medium">Gebruik stijlreferentie</span>
        </label>

        <Button className="w-full gap-2" size="lg" disabled={loading || !description.trim()} onClick={generate}>
          <Wand2 className="h-4 w-4" />
          {loading ? "Bezig met genereren…" : "Genereer splash panel"}
        </Button>
      </Card>

      {/* Result */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Resultaat</span>
          {result && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={saveGeneration} disabled={saving || saved}>
                {saved
                  ? <BookmarkCheck className="h-3.5 w-3.5" />
                  : saving
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Bookmark className="h-3.5 w-3.5" />}
                {saved ? "Opgeslagen" : "Opslaan"}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={download}>
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={sendToColouring}>
                <Palette className="h-3.5 w-3.5" />
                Stuur naar Inkleuren
              </Button>
            </div>
          )}
        </div>

        <div className="flex min-h-[500px] items-center justify-center rounded-xl border border-border bg-card">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Splash panel wordt gegenereerd…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 px-6 text-center text-destructive">
              <ImageOff className="h-7 w-7" />
              <p className="text-sm">{error}</p>
            </div>
          ) : result ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={result} alt="Gegenereerd splash panel" className="max-h-[700px] w-full object-contain" />
          ) : (
            <p className="px-6 text-center text-sm text-muted-foreground">
              Vul een beschrijving in en klik op Genereer
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
