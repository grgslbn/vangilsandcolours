"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Wand2, Upload, Check, Loader2, ImageOff, Download, Bookmark, BookmarkCheck, Plus, X } from "lucide-react"
import { toast } from "sonner"
import type { GenerateCharacterBody } from "@/app/api/generate-character/route"

type Character   = { id: string; name: string; public_url: string }
type OutputStyle = GenerateCharacterBody["outputStyle"]
type Background  = GenerateCharacterBody["background"]

type ResultItem = {
  action: string
  image: string | null
  error: string | null
  saving: boolean
  saved: boolean
}

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
  const [library, setLibrary]           = useState<Character[]>([])
  const [selected, setSelected]         = useState<{ id: string; name: string; src: string } | null>(null)
  const [uploadPreview, setUploadPreview] = useState<{ src: string; name: string } | null>(null)

  // Actions list
  const [actions, setActions] = useState<string[]>([""])

  // Style settings
  const [outputStyle, setOutputStyle] = useState<OutputStyle>("same")
  const [background, setBackground]   = useState<Background>("white")

  // Results (one per action)
  const [results, setResults]   = useState<ResultItem[]>([])
  const [loading, setLoading]   = useState(false)

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

  // Actions management
  function updateAction(i: number, val: string) {
    setActions((prev) => prev.map((a, idx) => idx === i ? val : a))
  }
  function addAction() {
    setActions((prev) => [...prev, ""])
  }
  function removeAction(i: number) {
    setActions((prev) => prev.length === 1 ? [""] : prev.filter((_, idx) => idx !== i))
  }

  async function generate() {
    if (!activeCharSrc) { toast.error("Selecteer of upload een personage."); return }
    const filled = actions.filter((a) => a.trim())
    if (filled.length === 0) { toast.error("Geef minimaal één actie op."); return }

    setLoading(true)

    // Initialise result slots immediately so the UI shows spinners
    setResults(filled.map((action) => ({ action, image: null, error: null, saving: false, saved: false })))

    // Fire all calls in parallel
    const promises = filled.map((action) =>
      fetch("/api/generate-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterImageUrl: activeCharSrc, action, outputStyle, background } satisfies GenerateCharacterBody),
      })
        .then((r) => r.json())
        .then((data) => ({ action, image: data.image ?? null, error: data.error ?? null }))
        .catch((err) => ({ action, image: null, error: err instanceof Error ? err.message : "Er ging iets mis." }))
    )

    // Update results as each one finishes
    const settled = await Promise.all(
      promises.map((p, i) =>
        p.then((res) => {
          setResults((prev) => prev.map((r, idx) => idx === i ? { ...r, ...res } : r))
          return res
        })
      )
    )

    const succeeded = settled.filter((r) => r.image).length
    const failed    = settled.filter((r) => r.error).length
    if (succeeded > 0) toast.success(`${succeeded} afbeelding${succeeded > 1 ? "en" : ""} gegenereerd.`)
    if (failed > 0)    toast.error(`${failed} generatie${failed > 1 ? "s" : ""} mislukt.`)

    setLoading(false)
  }

  function download(item: ResultItem) {
    if (!item.image) return
    const a = document.createElement("a")
    a.href = item.image
    a.download = `personage-${item.action.slice(0, 30).replace(/\s+/g, "-")}.png`
    a.click()
  }

  async function saveResult(index: number) {
    const item = results[index]
    if (!item?.image) return
    setResults((prev) => prev.map((r, i) => i === index ? { ...r, saving: true } : r))
    try {
      const res = await fetch("/api/save-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "characters",
          imageDataUrl: item.image,
          settingsJson: {
            character: selected?.name ?? uploadPreview?.name,
            action: item.action,
            outputStyle,
            background,
          },
        }),
      })
      if (!res.ok) throw new Error()
      setResults((prev) => prev.map((r, i) => i === index ? { ...r, saving: false, saved: true } : r))
      toast.success("Opgeslagen.")
    } catch {
      setResults((prev) => prev.map((r, i) => i === index ? { ...r, saving: false } : r))
      toast.error("Opslaan mislukt.")
    }
  }

  const hasResults = results.length > 0
  const allDone    = hasResults && results.every((r) => r.image || r.error)

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

          {uploadPreview && (
            <div onClick={() => setSelected(null)}
              className={cn(
                "relative cursor-pointer overflow-hidden rounded-lg border-2 bg-card p-2 transition-colors",
                !selected ? "border-primary" : "border-border hover:border-primary/50",
              )}>
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

        {/* Multi-action list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Actie / scene</Label>
            <button
              type="button"
              onClick={addAction}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
            >
              <Plus className="h-3 w-3" />
              Voeg toe
            </button>
          </div>
          <div className="space-y-2">
            {actions.map((action, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`bv. ${["gitaar spelend op een podium", "rennend door een park", "lezend in een bibliotheek"][i % 3]}`}
                  value={action}
                  onChange={(e) => updateAction(i, e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => removeAction(i)}
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
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
          disabled={loading || !activeCharSrc || actions.every((a) => !a.trim())}
          onClick={generate}
        >
          <Wand2 className="h-4 w-4" />
          {loading
            ? `Genereren… (${results.filter((r) => r.image || r.error).length}/${results.length})`
            : `Genereer${actions.filter((a) => a.trim()).length > 1 ? ` (${actions.filter((a) => a.trim()).length})` : ""}`}
        </Button>
      </Card>

      {/* Results */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Resultaat</span>
          {allDone && results.filter((r) => r.image).length > 1 && (
            <Button variant="outline" size="sm" className="gap-1.5"
              onClick={() => results.forEach((r, i) => { if (r.image) saveResult(i) })}
              disabled={results.every((r) => r.saved || r.saving)}>
              <Bookmark className="h-3.5 w-3.5" />
              Alles opslaan
            </Button>
          )}
        </div>

        {!hasResults ? (
          <div className="flex min-h-[500px] items-center justify-center rounded-xl border border-border bg-card">
            <p className="px-6 text-center text-sm text-muted-foreground">
              Selecteer een personage, voeg acties toe en klik op Genereer
            </p>
          </div>
        ) : (
          <div className={cn(
            "grid gap-4",
            results.length === 1 ? "grid-cols-1" :
            results.length === 2 ? "grid-cols-2" :
            "grid-cols-2 xl:grid-cols-3"
          )}>
            {results.map((item, i) => (
              <div key={i} className="flex flex-col gap-2">
                {/* Action label */}
                <p className="text-xs font-medium text-muted-foreground truncate" title={item.action}>
                  {item.action}
                </p>

                {/* Image card */}
                <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-card">
                  {!item.image && !item.error ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : item.error ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-destructive">
                      <ImageOff className="h-6 w-6" />
                      <p className="text-xs">{item.error}</p>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image!} alt={item.action} className="h-full w-full object-contain" />
                  )}
                </div>

                {/* Per-result actions */}
                {item.image && (
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs"
                      onClick={() => saveResult(i)} disabled={item.saving || item.saved}>
                      {item.saved
                        ? <BookmarkCheck className="h-3 w-3" />
                        : item.saving
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Bookmark className="h-3 w-3" />}
                      {item.saved ? "Opgeslagen" : "Opslaan"}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs" onClick={() => download(item)}>
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
