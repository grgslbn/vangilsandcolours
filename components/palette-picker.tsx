"use client"

import { useState } from "react"
import type { Palette } from "@/lib/palettes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Check, Plus, X } from "lucide-react"

function Swatches({ colors }: { colors: string[] }) {
  return (
    <div className="flex h-8 w-full overflow-hidden rounded-md ring-1 ring-border">
      {colors.map((c, i) => (
        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
      ))}
    </div>
  )
}

export function PalettePicker({
  palettes,
  selectedId,
  onSelect,
  onAddPalette,
}: {
  palettes: Palette[]
  selectedId: string | null
  onSelect: (p: Palette) => void
  onAddPalette: (p: Palette) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Kleurenpalet</Label>
        <AddPaletteDialog onAdd={onAddPalette} />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {palettes.map((p) => {
          const active = p.id === selectedId
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p)}
              className={cn(
                "group relative rounded-lg border bg-card p-3 text-left transition-colors",
                active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50",
              )}
            >
              {active && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <p className="mb-1 pr-6 text-sm font-medium leading-tight text-card-foreground">{p.name}</p>
              <p className="mb-2 text-xs leading-snug text-muted-foreground">{p.description}</p>
              <Swatches colors={p.colors} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function AddPaletteDialog({ onAdd }: { onAdd: (p: Palette) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [colors, setColors] = useState<string[]>(["#003D4D", "#009CA0", "#9DC698"])

  function updateColor(i: number, value: string) {
    setColors((prev) => prev.map((c, idx) => (idx === i ? value : c)))
  }
  function addColor() {
    if (colors.length < 6) setColors((prev) => [...prev, "#000000"])
  }
  function removeColor(i: number) {
    if (colors.length > 1) setColors((prev) => prev.filter((_, idx) => idx !== i))
  }
  function save() {
    const trimmed = name.trim() || "Eigen palet"
    onAdd({
      id: `custom-${Date.now()}`,
      name: trimmed,
      description: "Eigen toegevoegd palet",
      colors,
    })
    setOpen(false)
    setName("")
    setColors(["#003D4D", "#009CA0", "#9DC698"])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-card-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Plus className="h-4 w-4" />
          Nieuw palet
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuw kleurenpalet</DialogTitle>
          <DialogDescription>Geef je palet een naam en kies de kleuren.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="palette-name">Naam</Label>
            <Input
              id="palette-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bv. Campagne herfst"
            />
          </div>
          <div className="space-y-2">
            <Label>Kleuren</Label>
            <div className="space-y-2">
              {colors.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={c}
                    onChange={(e) => updateColor(i, e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent"
                    aria-label={`Kleur ${i + 1}`}
                  />
                  <Input value={c} onChange={(e) => updateColor(i, e.target.value)} className="font-mono text-sm" />
                  {colors.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeColor(i)} aria-label="Verwijder kleur">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {colors.length < 6 && (
              <Button variant="outline" size="sm" onClick={addColor} className="gap-1">
                <Plus className="h-4 w-4" />
                Kleur toevoegen
              </Button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuleren
          </Button>
          <Button onClick={save}>Palet opslaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
