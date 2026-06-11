"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { VanGilsImage } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Upload, Trash2, Loader2 } from "lucide-react"

export function ImageSettings() {
  const [images, setImages] = useState<VanGilsImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function loadImages() {
    const { data, error } = await supabase
      .from("VanGils_images")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
    if (error) { toast.error("Kon afbeeldingen niet laden."); return }
    setImages(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadImages() }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const path = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`
      const { error: uploadError } = await supabase.storage
        .from("vangils-samples")
        .upload(path, file, { contentType: file.type })
      if (uploadError) { toast.error(`Upload mislukt: ${file.name}`); continue }

      const { data: urlData } = supabase.storage
        .from("vangils-samples")
        .getPublicUrl(path)

      await supabase.from("VanGils_images").insert({
        name: file.name.replace(/\.[^.]+$/, ""),
        storage_path: path,
        public_url: urlData.publicUrl,
        sort_order: images.length,
      })
    }
    toast.success("Afbeelding(en) geüpload.")
    e.target.value = ""
    setUploading(false)
    loadImages()
  }

  async function deleteImage(img: VanGilsImage) {
    await supabase.storage.from("vangils-samples").remove([img.storage_path])
    await supabase.from("VanGils_images").delete().eq("id", img.id)
    toast.success(`"${img.name}" verwijderd.`)
    setImages((prev) => prev.filter((i) => i.id !== img.id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Voorbeeldafbeeldingen</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Zwart-wit lijntekeningen beschikbaar in alle tools
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploaden…" : "Upload"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">Nog geen afbeeldingen. Upload er een.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.public_url} alt={img.name} className="h-full w-full object-contain p-2" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-card/90 px-2 py-1">
                <span className="truncate text-xs font-medium text-card-foreground">{img.name}</span>
                <button
                  type="button"
                  onClick={() => deleteImage(img)}
                  className="ml-1 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
