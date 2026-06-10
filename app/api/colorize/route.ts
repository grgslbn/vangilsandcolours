import { generateText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { readFileSync } from "fs"
import { join, extname } from "path"

export const maxDuration = 60

// Use GEMINI_API_KEY (or the @ai-sdk/google default GOOGLE_GENERATIVE_AI_API_KEY).
const googleAI = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

type ColorizeBody = {
  image: string // data URL or remote URL
  mediaType?: string
  colors: string[]
  paletteName?: string
}

const EXT_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
}

async function toBase64(image: string, fallbackType: string) {
  // Already a data URL
  if (image.startsWith("data:")) {
    const [meta, data] = image.split(",")
    const mediaType = meta.match(/data:(.*?);base64/)?.[1] ?? fallbackType
    return { base64: data, mediaType }
  }
  // Public asset path (e.g. /samples/economie.jpg) — read from disk
  if (image.startsWith("/") && !image.startsWith("//")) {
    const filePath = join(process.cwd(), "public", image)
    const buffer = readFileSync(filePath)
    const mediaType = EXT_MIME[extname(image).toLowerCase()] ?? fallbackType
    return { base64: buffer.toString("base64"), mediaType }
  }
  // Remote URL — fetch and convert
  const res = await fetch(image)
  const mediaType = res.headers.get("content-type") ?? fallbackType
  const buffer = Buffer.from(await res.arrayBuffer())
  return { base64: buffer.toString("base64"), mediaType }
}

export async function POST(req: Request) {
  try {
    const { image, mediaType, colors, paletteName }: ColorizeBody = await req.json()

    if (!image || !colors?.length) {
      return Response.json({ error: "Missing image or colors." }, { status: 400 })
    }

    const { base64, mediaType: detectedType } = await toBase64(image, mediaType ?? "image/jpeg")

    const colorList = colors.join(", ")

    const prompt = `You are a professional illustrator. Take this black-and-white line illustration and color it in completely, staying strictly within the original line work.

Use ONLY the following color palette${paletteName ? ` ("${paletteName}")` : ""}: ${colorList}.

Rules:
- Keep every original black outline exactly intact — do not redraw, move, or remove any lines.
- Fill the shapes and areas with the palette colors, using the lightest tone for backgrounds and the bolder tones for focal elements.
- You may use lighter/darker shades derived from these exact colors for depth, but keep the overall look faithful to the palette.
- Produce a clean, flat, editorial illustration style.
- Return only the fully colored version of the same illustration at the same composition and aspect ratio.`

    const result = await generateText({
      model: googleAI("gemini-2.0-flash-preview-image-generation"),
      providerOptions: {
        google: { responseModalities: ["TEXT", "IMAGE"] },
      },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "file", data: base64, mediaType: detectedType },
          ],
        },
      ],
    })

    const file = result.files?.find((f) => f.mediaType?.startsWith("image/"))

    if (!file) {
      return Response.json(
        { error: "The model did not return an image. Try again." },
        { status: 502 },
      )
    }

    return Response.json({
      image: `data:${file.mediaType};base64,${file.base64}`,
    })
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err)
    console.error("[colorize] full error:", err)

    // Surface a clear, actionable message for the common quota/billing cases.
    let message = "Het inkleuren is mislukt. Probeer het opnieuw."
    if (/quota|free tier|limit.*0|rate.?limit/i.test(raw)) {
      message =
        "Je Gemini API-sleutel zit op het gratis niveau zonder quota voor beeldgeneratie. Schakel betaling in op ai.google.dev om dit model te gebruiken."
    } else if (/api[_ ]?key|unauthorized|401|missing/i.test(raw)) {
      message = "De GEMINI_API_KEY ontbreekt of is ongeldig. Controleer je omgevingsvariabelen."
    } else if (/not found|404/i.test(raw)) {
      message = "Het opgegeven AI-model is niet beschikbaar."
    }

    return Response.json({ error: message, debug: raw }, { status: 500 })
  }
}
