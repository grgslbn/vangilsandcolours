import { NextRequest, NextResponse } from "next/server"
import { fal } from "@fal-ai/client"

fal.config({ credentials: process.env.FAL_KEY })

export const maxDuration = 120

async function toBlob(src: string): Promise<Blob> {
  if (src.startsWith("data:")) {
    const [header, b64] = src.split(",")
    const mime = header.replace("data:", "").replace(";base64", "")
    const bytes = Buffer.from(b64, "base64")
    return new Blob([bytes], { type: mime })
  }
  const res = await fetch(src)
  return res.blob()
}

export async function POST(req: NextRequest) {
  try {
    const { image, prompt, duration, cfgScale, negativePrompt, tailImage } =
      await req.json()

    if (!image) {
      return NextResponse.json({ error: "Geen afbeelding opgegeven." }, { status: 400 })
    }

    const imageBlob = await toBlob(image)
    const imageUrl = await fal.storage.upload(imageBlob)

    type KlingInput = {
      image_url: string
      prompt: string
      duration: "5" | "10"
      cfg_scale: number
      negative_prompt?: string
      tail_image_url?: string
    }

    const input: KlingInput = {
      image_url: imageUrl,
      prompt: prompt || "Gentle, subtle animation with soft movement",
      duration: duration === "10" ? "10" : "5",
      cfg_scale: typeof cfgScale === "number" ? cfgScale : 0.5,
    }

    if (negativePrompt) input.negative_prompt = negativePrompt

    if (tailImage) {
      const tailBlob = await toBlob(tailImage)
      input.tail_image_url = await fal.storage.upload(tailBlob)
    }

    const result = await fal.subscribe("fal-ai/kling-video/v2.1/pro/image-to-video", {
      input,
    })

    // Kling returns result.data.video.url
    const data = result as { data?: { video?: { url?: string } } }
    const videoUrl = data?.data?.video?.url

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Geen video ontvangen van fal.ai." },
        { status: 500 },
      )
    }

    return NextResponse.json({ videoUrl })
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err)
    console.error("[animate] error:", raw)

    let message = "Het animeren is mislukt. Probeer het opnieuw."
    if (/unauthorized|forbidden|invalid.*key|401|403/i.test(raw)) {
      message = "De FAL_KEY ontbreekt of is ongeldig. Controleer je omgevingsvariabelen."
    } else if (/quota|limit|429/i.test(raw)) {
      message = "fal.ai quota bereikt. Probeer het later opnieuw."
    } else if (/not found|404/i.test(raw)) {
      message = "Het fal.ai model is niet beschikbaar."
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
