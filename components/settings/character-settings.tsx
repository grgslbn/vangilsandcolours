"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Upload, Trash2, Loader2 } from "lucide-react"

type Character = { id: string; name: string; description: string; storage_path: string; public_url: string }

export function CharacterSettings() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function load() {
    const { data, error } = await supabase
      .from("VanGils_characters")
      .select("*")
      .order("sort_order").order("created_at")
    if (error) { toast.error("Kon personages niet laden."); return }
    setCharacters(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const path = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`
      const { error: uploadError } = await supabase.storage
        .from("vangils-characters")
        .upload(path, file, { contentType: file.type })
      if (uploadError) { toast.error(`Upload mislukt: ${file.name}`); continue }

      const { data: urlData } = supabase.storage.from("vangils-characters").getPublicUrl(path)
      await supabase.from("VanGils_characters").insert({
        name: file.name.replace(/\.[^.]+$/, ""),
        storage_path: path,
        public_url: urlData.publicUrl,
        sort_order: characters.length,
      })
    }
    toast.success("Personage(s) geüpload.")
    e.target.value = ""
    setUploading(false)
    load()
  }

  async function deleteCharacter(c: Character) {
    await supabase.storage.from("vangils-characters").remove([c.storage_path])
    await supabase.from("VanGils_characters").delete().eq("id", c.id)
    toast.success(`"${c.name}" verwijderd.`)
    setCharacters((prev) => prev.filter((x) => x.id !== c.id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Personage-bibliotheek</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Basisillustraties beschikbaar in de Characters-tool
          </p>
        </div>
        <Button variant="outline" className="gap-2" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploaden…" : "Upload"}
        </Button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : characters.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">Nog geen personages. Upload er een.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {characters.map((c) => (
            <div key={c.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.public_url} alt={c.name} className="h-full w-full object-contain p-2" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-card/90 px-2 py-1">
                <span className="truncate text-xs font-medium text-card-foreground">{c.name}</span>
                <button type="button" onClick={() => deleteCharacter(c)}
                  className="ml-1 shrink-0 text-muted-foreground hover:text-destructive transition-colors">
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
