import { supabaseServer } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { tool, imageDataUrl, settingsJson, promptUsed } = await req.json()

    if (!imageDataUrl || !tool) {
      return Response.json({ error: "Missing fields." }, { status: 400 })
    }

    // Convert data URL to buffer
    const [meta, base64] = imageDataUrl.split(",")
    const mediaType = meta.match(/data:(.*?);base64/)?.[1] ?? "image/png"
    const ext = mediaType.split("/")[1] ?? "png"
    const buffer = Buffer.from(base64, "base64")
    const path = `${tool}/${Date.now()}.${ext}`

    const sb = supabaseServer()

    // Upload to storage
    const { error: uploadError } = await sb.storage
      .from("vangils-generated")
      .upload(path, buffer, { contentType: mediaType })

    if (uploadError) throw uploadError

    const { data: urlData } = sb.storage.from("vangils-generated").getPublicUrl(path)

    // Insert record
    const { error: insertError } = await sb.from("VanGils_generations").insert({
      tool,
      settings_json: settingsJson ?? {},
      prompt_used: promptUsed ?? "",
      output_public_url: urlData.publicUrl,
    })

    if (insertError) throw insertError

    return Response.json({ url: urlData.publicUrl })
  } catch (err) {
    console.error("[save-generation] error:", err)
    return Response.json({ error: "Opslaan mislukt." }, { status: 500 })
  }
}
