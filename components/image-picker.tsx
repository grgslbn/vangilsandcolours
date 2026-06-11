"use client"

import { useRef, useEffect, useState } from "react"
import { SAMPLE_IMAGES } from "@/lib/palettes"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Check, Upload } from "lucide-react"

export type SelectedImage = {
  src: string
  name: string
  isUpload: boolean
}

type DisplayImage = { id: string; name: string; src: string }

export function ImagePicker({
  selected,
  onSelect,
}: {
  selected: SelectedImage | null
  onSelect: (img: SelectedImage) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [samples, setSamples] = useState<DisplayImage[]>(
    SAMPLE_IMAGES.map((s) => ({ id: s.id, name: s.name, src: s.src }))
  )

  // Load from Supabase; fall back to bundled samples
  useEffect(() => {
    supabase
      .from("VanGils_images")
      .select("id, name, public_url")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSamples(data.map((d) => ({ id: d.id, name: d.name, src: d.public_url })))
        }
      })
  }, [])

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      onSelect({ src: reader.result as string, name: file.name, isUpload: true })
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Zwart-wit afbeelding</Label>
        <Button variant="outline" size="sm" className="gap-1" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" />
          Upload
        </Button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {samples.map((s) => {
          const active = selected?.src === s.src
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect({ src: s.src, name: s.name, isUpload: false })}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border bg-card transition-colors",
                active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={s.name} className="h-full w-full object-contain p-1" />
              {active && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 bg-card/90 px-2 py-1 text-center text-xs font-medium text-card-foreground">
                {s.name}
              </span>
            </button>
          )
        })}
      </div>

      {selected?.isUpload && (
        <div className="relative aspect-video overflow-hidden rounded-lg border border-primary bg-card ring-2 ring-primary/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selected.src} alt={selected.name} className="h-full w-full object-contain" />
          <span className="absolute inset-x-0 bottom-0 truncate bg-card/90 px-2 py-1 text-center text-xs font-medium text-card-foreground">
            {selected.name}
          </span>
        </div>
      )}
    </div>
  )
}
