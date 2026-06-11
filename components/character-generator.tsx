"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Wand2, Upload, Check, Loader2, ImageOff, Download, Bookmark, BookmarkCheck } from "lucide-react"
import { toast } from "sonner"
import type { GenerateCharacterBody } from "@/app/api/generate-character/route"

type Character = { id: string; name: string; public_url: string }
type OutputStyle = GenerateCharacterBody["outputStyle"]
type Background  = GenerateCharacterBody["background"]

function OptionGroup<T extends string>({
  label, options, value, onChange,
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
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              value === o.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted",
            )}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function CharacterGenerator() {
  const uploadRef = useRef<HTMLInputElement>(null)

  // Character source
  const [library, setLibrary] = useState<Character[]>([])
  const [selected, setSelected] = useState<{ id: string; name: string; src: string } | null>(null)
  const [uploadPreview, setUploadPreview] = useState<{ src: string; name: string } | null>(null)

  // Settings
  const [action, setAction] = useState("")
  const [outputStyle, setOutputStyle] = useState<OutputStyle>("same")
  const [background, setBackground] = useState<Background>("white")

  // Result
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from("VanGils_characters").select("id, name, public_url")
      .order("sort_order").order("created_at")
      .then(({ data }) => setLibrary(data ?? []))
  }, [])

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setUploadPreview({ src: reader.result as string, name: file.name.replace(/\.[^.]+$/, "") })
      setSelected(null)
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const activeCharSrc = uploadPreview?.src ?? selected?.src ?? null

  async function generate() {
    if (!activeCharSrc) { toast.error("Selecteer of upload een personage."); return }
    if (!action.trim()) { toast.error("Geef een actie op."); return }
    setLoading(true)
    setError(null)
    setResult(null)
    setSaved(false)
    try {
      const res = await fetch("/api/generate-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterImageUrl: activeCharSrc, action, outputStyle, background } satisfies GenerateCharacterBody),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.debug || data.error || "Er ging iets mis.")
      setResult(data.image)
      toast.success("Personage gegenereerd!")
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
    a.download = `personage-${Date.now()}.png`
    a.click()
  }

  async function saveGeneration() {
    if (!result) return
    setSaving(true)
    try {
      const res = await fetch("/api/save-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "characters",
          imageDataUrl: result,
          settingsJson: { character: selected?.name ?? uploadPreview?.name, action, outputStyle, background },
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

        {/* Character picker */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Personage</Label>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => uploadRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Upload
            </Button>
            <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>

          {/* Uploaded preview */}
          {uploadPreview && (
            <div
              onClick={() => { setSelected(null) }}
              className={cn(
                "relative cursor-pointer overflow-hidden rounded-lg border-2 bg-card p-2 transition-colors",
                !selected ? "border-primary" : "border-border hover:border-primary/50",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={uploadPreview.src} alt={uploadPreview.name} className="h-24 w-full object-contain" />
              <p className="mt-1 truncate text-center text-xs font-medium">{uploadPreview.name}</p>
              {!selected && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </div>
          )}

          {/* Library grid */}
          {library.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {library.map((c) => {
                const active = selected?.id === c.id && !uploadPreview
                return (
                  <button key={c.id} type="button"
                    onClick={() => { setSelected({ id: c.id, name: c.name, src: c.public_url }); setUploadPreview(null) }}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-lg border bg-card transition-colors",
                      active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50",
                    )}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.public_url} alt={c.name} className="h-full w-full object-contain p-1" />
                    {active && (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 bg-card/90 px-1 py-0.5 text-center text-xs font-medium truncate">
                      {c.name}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {library.length === 0 && !uploadPreview && (
            <p className="text-xs text-muted-foreground">
              Geen personages in de bibliotheek. Upload er een of voeg toe via Instellingen.
            </p>
          )}
        </div>

        <div className="h-px bg-border" />

        {/* Action prompt */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Actie / scene</Label>
          <Textarea
            rows={3}
            placeholder="bv. gitaar spelend op een podium"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="resize-none text-sm"
          />
        </div>

        <div className="h-px bg-border" />

        <OptionGroup
          label="Uitvoerstijl"
          value={outputStyle}
          onChange={setOutputStyle}
          options={[
            { value: "same",     label: "Zelfde stijl" },
            { value: "bw",       label: "Zwart-wit" },
            { value: "coloured", label: "Gekleurd" },
          ]}
        />

        <OptionGroup
          label="Achtergrond"
          value={background}
          onChange={setBackground}
          options={[
            { value: "white", label: "Wit" },
            { value: "scene", label: "Scène" },
          ]}
        />

        <Button
          className="w-full gap-2" size="lg"
          disabled={loading || !activeCharSrc || !action.trim()}
          onClick={generate}
        >
          <Wand2 className="h-4 w-4" />
          {loading ? "Bezig met genereren…" : "Genereer"}
        </Button>
      </Card>

      {/* Result */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Resultaat</span>
          {result && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={saveGeneration} disabled={saving || saved}>
                {saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bookmark className="h-3.5 w-3.5" />}
                {saved ? "Opgeslagen" : "Opslaan"}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={download}>
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </div>
          )}
        </div>

        <div className="flex min-h-[500px] items-center justify-center rounded-xl border border-border bg-card">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Personage wordt gegenereerd…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 px-6 text-center text-destructive">
              <ImageOff className="h-7 w-7" />
              <p className="text-sm">{error}</p>
            </div>
          ) : result ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={result} alt="Gegenereerd personage" className="max-h-[700px] w-full object-contain" />
          ) : (
            <p className="px-6 text-center text-sm text-muted-foreground">
              Selecteer een personage, geef een actie op en klik op Genereer
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
