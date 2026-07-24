"use client"

import { useRef, useState } from "react"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, Upload, X } from "lucide-react"
import Image from "next/image"

export type MotionSettings = {
  prompt: string
  duration: "5" | "10"
  cfgScale: number
  negativePrompt: string
  tailImage: string | null
}

const DEFAULT_NEGATIVE = "blur, distort, low quality, flickering, watermark"

const MOTION_PRESETS = [
  "Zachte camerazoom naar het midden",
  "Zacht parallax-effect, voorgrond beweegt licht",
  "Personages animeren met subtiele bewegingen",
  "Windeffect — bladeren en bomen wiegen zachtjes",
  "Langzaam pannen van links naar rechts",
]

export const DEFAULT_MOTION_SETTINGS: MotionSettings = {
  prompt: "",
  duration: "5",
  cfgScale: 0.5,
  negativePrompt: DEFAULT_NEGATIVE,
  tailImage: null,
}

export function MotionSettingsPanel({
  settings,
  onChange,
}: {
  settings: MotionSettings
  onChange: (s: MotionSettings) => void
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const tailInputRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof MotionSettings>(key: K, value: MotionSettings[K]) {
    onChange({ ...settings, [key]: value })
  }

  function applyPreset(preset: string) {
    set("prompt", preset)
  }

  function handleTailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set("tailImage", reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  return (
    <div className="space-y-5">
      {/* Motion prompt */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Bewegingsomschrijving</Label>
        <textarea
          value={settings.prompt}
          onChange={(e) => set("prompt", e.target.value)}
          placeholder="Beschrijf hoe de afbeelding moet bewegen…"
          rows={3}
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        />

        {/* Preset chips */}
        <div className="flex flex-wrap gap-1.5">
          {MOTION_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => applyPreset(preset)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                settings.prompt === preset
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-card-foreground hover:border-primary/50 hover:bg-accent",
              )}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Duration toggle */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Duur</Label>
        <div className="flex gap-2">
          {(["5", "10"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => set("duration", d)}
              className={cn(
                "flex-1 rounded-md border py-2 text-sm font-medium transition-colors",
                settings.duration === d
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-card-foreground hover:border-primary/50",
              )}
            >
              {d} seconden
            </button>
          ))}
        </div>
      </div>

      {/* CFG Scale */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Bewegingsintensiteit</Label>
          <span className="text-sm tabular-nums text-muted-foreground">
            {settings.cfgScale.toFixed(1)}
          </span>
        </div>
        <Slider
          min={0.1}
          max={1.0}
          step={0.1}
          value={[settings.cfgScale]}
          onValueChange={([v]) => set("cfgScale", v)}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Losser / creatiever</span>
          <span>Dichter bij prompt</span>
        </div>
      </div>

      {/* Advanced section */}
      <div className="rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-card-foreground"
        >
          <span>Geavanceerd</span>
          {advancedOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {advancedOpen && (
          <div className="space-y-4 border-t border-border px-4 pb-4 pt-4">
            {/* Negative prompt */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Negatieve prompt</Label>
              <textarea
                value={settings.negativePrompt}
                onChange={(e) => set("negativePrompt", e.target.value)}
                rows={2}
                placeholder="Wat moet de AI vermijden?"
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>

            {/* End frame */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Eindframe (optioneel)</Label>
              <p className="text-xs text-muted-foreground">
                Upload een tweede afbeelding als laatste frame van de video.
              </p>

              {settings.tailImage ? (
                <div className="relative overflow-hidden rounded-lg border border-border">
                  <Image
                    src={settings.tailImage}
                    alt="Eindframe"
                    width={320}
                    height={180}
                    className="h-32 w-full object-contain bg-card"
                  />
                  <button
                    type="button"
                    onClick={() => set("tailImage", null)}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-card/90 text-foreground shadow"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => tailInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload eindframe
                </Button>
              )}

              <input
                ref={tailInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleTailUpload}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
