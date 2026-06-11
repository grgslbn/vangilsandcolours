"use client"

import { useState } from "react"
import { BRAND_PALETTES, type Palette } from "@/lib/palettes"
import { PalettePicker } from "@/components/palette-picker"
import { ImagePicker, type SelectedImage } from "@/components/image-picker"
import { ComparisonView } from "@/components/comparison-view"
import { AdvancedSettings, DEFAULT_ADVANCED, type AdvancedSettingsValue } from "@/components/advanced-settings"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Wand2 } from "lucide-react"
import { toast } from "sonner"

export function Colorizer() {
  const [palettes, setPalettes] = useState<Palette[]>(BRAND_PALETTES)
  const [selectedPalette, setSelectedPalette] = useState<Palette | null>(BRAND_PALETTES[1])
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null)
  const [advanced, setAdvanced] = useState<AdvancedSettingsValue>(DEFAULT_ADVANCED)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addPalette(p: Palette) {
    setPalettes((prev) => [...prev, p])
    setSelectedPalette(p)
    toast.success(`Palet "${p.name}" toegevoegd`)
  }

  async function colorize() {
    if (!selectedImage || !selectedPalette) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/colorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: selectedImage.src,
          colors: selectedPalette.colors,
          paletteName: selectedPalette.name,
          advanced,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error((data.debug || data.error) || "Er ging iets mis.")
      setResult(data.image)
      toast.success("Afbeelding ingekleurd!")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Er ging iets mis."
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const canColorize = !!selectedImage && !!selectedPalette && !loading

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
      {/* Controls */}
      <Card className="h-fit space-y-6 p-5">
        <ImagePicker selected={selectedImage} onSelect={setSelectedImage} />
        <div className="h-px bg-border" />
        <PalettePicker
          palettes={palettes}
          selectedId={selectedPalette?.id ?? null}
          onSelect={setSelectedPalette}
          onAddPalette={addPalette}
        />
        <div className="h-px bg-border" />
        <AdvancedSettings value={advanced} onChange={setAdvanced} />
        <Button className="w-full gap-2" size="lg" disabled={!canColorize} onClick={colorize}>
          <Wand2 className="h-4 w-4" />
          {loading ? "Bezig met inkleuren…" : "Kleur in met Gemini"}
        </Button>
      </Card>

      {/* Comparison */}
      <Card className="p-5">
        <ComparisonView
          originalSrc={selectedImage?.src ?? null}
          resultSrc={result}
          loading={loading}
          error={error}
        />
      </Card>
    </div>
  )
}
