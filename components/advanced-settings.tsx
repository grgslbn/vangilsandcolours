"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"

export type ColorStyle = "flat" | "pen" | "watercolour"

export type AdvancedSettingsValue = {
  coverage: number   // 1 (subtle) – 5 (fully coloured)
  contrast: number   // 1 (low) – 5 (high)
  style: ColorStyle
  note: string
}

export const DEFAULT_ADVANCED: AdvancedSettingsValue = {
  coverage: 5,
  contrast: 3,
  style: "flat",
  note: "",
}

const STYLES: { value: ColorStyle; label: string }[] = [
  { value: "flat",        label: "Flat / grafisch" },
  { value: "pen",         label: "Pentekening" },
  { value: "watercolour", label: "Aquarel" },
]

type Props = {
  value: AdvancedSettingsValue
  onChange: (v: AdvancedSettingsValue) => void
}

export function AdvancedSettings({ value, onChange }: Props) {
  function set<K extends keyof AdvancedSettingsValue>(key: K, val: AdvancedSettingsValue[K]) {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="space-y-5">
      {/* Coverage */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Mate van inkleuring</Label>
          <span className="text-xs text-muted-foreground">
            {["Subtiel", "Licht", "Gemengd", "Sterk", "Volledig"][value.coverage - 1]}
          </span>
        </div>
        <Slider
          min={1} max={5} step={1}
          value={[value.coverage]}
          onValueChange={([v]) => set("coverage", v)}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Subtiel</span><span>Volledig</span>
        </div>
      </div>

      {/* Contrast */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Contrast</Label>
          <span className="text-xs text-muted-foreground">
            {["Zeer laag", "Laag", "Gemiddeld", "Hoog", "Zeer hoog"][value.contrast - 1]}
          </span>
        </div>
        <Slider
          min={1} max={5} step={1}
          value={[value.contrast]}
          onValueChange={([v]) => set("contrast", v)}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Laag</span><span>Hoog</span>
        </div>
      </div>

      {/* Style */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Stijl</Label>
        <div className="flex gap-2">
          {STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => set("style", s.value)}
              className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors
                ${value.style === s.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom note */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Extra instructie</Label>
        <Textarea
          rows={2}
          placeholder="bv. enkel de vos in contrastkleur"
          value={value.note}
          onChange={(e) => set("note", e.target.value)}
          className="resize-none text-sm"
        />
      </div>
    </div>
  )
}
