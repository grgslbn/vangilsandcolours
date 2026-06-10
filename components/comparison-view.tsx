"use client"

import Image from "next/image"
import { Loader2, ImageOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ComparisonView({
  originalSrc,
  resultSrc,
  loading,
  error,
}: {
  originalSrc: string | null
  resultSrc: string | null
  loading: boolean
  error: string | null
}) {
  function download() {
    if (!resultSrc) return
    const a = document.createElement("a")
    a.href = resultSrc
    a.download = "ingekleurd.png"
    a.click()
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Original */}
      <figure className="flex flex-col">
        <figcaption className="mb-2 text-sm font-medium text-muted-foreground">Origineel (zwart-wit)</figcaption>
        <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
          {originalSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={originalSrc || "/placeholder.svg"} alt="Origineel" className="h-full w-full object-contain" />
          ) : (
            <p className="px-6 text-center text-sm text-muted-foreground">Selecteer of upload een afbeelding</p>
          )}
        </div>
      </figure>

      {/* Result */}
      <figure className="flex flex-col">
        <figcaption className="mb-2 flex items-center justify-between text-sm font-medium text-muted-foreground">
          <span>Ingekleurd</span>
          {resultSrc && (
            <Button variant="link" size="sm" className="h-auto p-0 text-primary" onClick={download}>
              Download
            </Button>
          )}
        </figcaption>
        <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Gemini kleurt je afbeelding in…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 px-6 text-center text-destructive">
              <ImageOff className="h-7 w-7" />
              <p className="text-sm">{error}</p>
            </div>
          ) : resultSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resultSrc || "/placeholder.svg"} alt="Ingekleurd resultaat" className="h-full w-full object-contain" />
          ) : (
            <p className="px-6 text-center text-sm text-muted-foreground">
              Het resultaat verschijnt hier na het inkleuren
            </p>
          )}
        </div>
      </figure>
    </div>
  )
}
