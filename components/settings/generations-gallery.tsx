"use client"

import { useEffect, useState } from "react"
import { supabase, type Generation } from "@/lib/supabase"
import { toast } from "sonner"
import { Trash2, Download, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const TOOL_LABELS: Record<string, string> = {
  colouring:    "Colouring",
  splash_panels: "Splash Panels",
}

export function GenerationsGallery() {
  const router = useRouter()
  const [items, setItems] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "colouring" | "splash_panels">("all")

  async function load() {
    setLoading(true)
    let query = supabase
      .from("VanGils_generations")
      .select("*")
      .order("created_at", { ascending: false })
    if (filter !== "all") query = query.eq("tool", filter)
    const { data, error } = await query
    if (error) { toast.error("Kon geschiedenis niet laden."); return }
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  async function deleteItem(item: Generation) {
    // Remove from storage
    const path = new URL(item.output_public_url).pathname.split("/vangils-generated/")[1]
    if (path) await supabase.storage.from("vangils-generated").remove([path])
    await supabase.from("VanGils_generations").delete().eq("id", item.id)
    toast.success("Verwijderd.")
    setItems((prev) => prev.filter((i) => i.id !== item.id))
  }

  function download(item: Generation) {
    const a = document.createElement("a")
    a.href = item.output_public_url
    a.download = `${item.tool}-${item.id.slice(0, 8)}.png`
    a.click()
  }

  function sendToColouring(item: Generation) {
    // Fetch the image and pass it via sessionStorage
    fetch(item.output_public_url)
      .then((r) => r.blob())
      .then((blob) => {
        const reader = new FileReader()
        reader.onload = () => {
          sessionStorage.setItem("injected_image", reader.result as string)
          router.push("/colouring")
        }
        reader.readAsDataURL(blob)
      })
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("nl-BE", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Opgeslagen resultaten</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Alle gegenereerde afbeeldingen</p>
        </div>
        {/* Filter */}
        <div className="flex gap-1">
          {(["all", "colouring", "splash_panels"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted",
              )}
            >
              {f === "all" ? "Alles" : TOOL_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">Nog niets opgeslagen.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-lg border border-border bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.output_public_url}
                alt={TOOL_LABELS[item.tool] ?? item.tool}
                className="aspect-square w-full object-contain p-2"
              />

              {/* Overlay on hover */}
              <div className="absolute inset-0 flex flex-col justify-between bg-black/60 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex items-start justify-between gap-1">
                  <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs text-white">
                    {TOOL_LABELS[item.tool] ?? item.tool}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteItem(item)}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-white/70">{formatDate(item.created_at)}</p>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 flex-1 gap-1 text-xs"
                      onClick={() => download(item)}
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                    {item.tool === "splash_panels" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 flex-1 gap-1 text-xs"
                        onClick={() => sendToColouring(item)}
                      >
                        <Palette className="h-3 w-3" />
                        Inkleuren
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
