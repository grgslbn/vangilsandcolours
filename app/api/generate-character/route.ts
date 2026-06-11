import { generateText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

export const maxDuration = 90

const googleAI = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export type GenerateCharacterBody = {
  characterImageUrl: string   // public URL or data URL
  action: string              // "playing guitar", "running in a park", …
  outputStyle: "same" | "bw" | "coloured"
  background: "white" | "scene"
}

const OUTPUT_STYLE_INSTRUCTIONS: Record<string, string> = {
  same:     "Keep exactly the same illustration style, line weight, and colour treatment as the reference character.",
  bw:       "Output as clean black-and-white line art only — no fills, no colour, just ink lines on white.",
  coloured: "Output as a fully coloured illustration, using colours that feel natural for the character and scene.",
}

const BACKGROUND_INSTRUCTIONS: Record<string, string> = {
  white: "Use a plain white background with no scenery.",
  scene: "Add a simple background scene that fits the action and mood.",
}

async function toBase64(src: string): Promise<{ base64: string; mediaType: string }> {
  if (src.startsWith("data:")) {
    const [meta, data] = src.split(",")
    return { base64: data, mediaType: meta.match(/data:(.*?);base64/)?.[1] ?? "image/jpeg" }
  }
  const res = await fetch(src)
  const mediaType = res.headers.get("content-type") ?? "image/jpeg"
  return { base64: Buffer.from(await res.arrayBuffer()).toString("base64"), mediaType }
}

export async function POST(req: Request) {
  try {
    const { characterImageUrl, action, outputStyle, background }: GenerateCharacterBody = await req.json()

    if (!characterImageUrl || !action?.trim()) {
      return Response.json({ error: "Ontbrekende velden." }, { status: 400 })
    }

    const { base64, mediaType } = await toBase64(characterImageUrl)

    const prompt = `You are a professional illustrator. I am giving you a reference illustration of a character.

Your task: redraw this exact character — ${action}.

CRITICAL RULES:
- Preserve the character's visual identity completely: same design, proportions, distinctive features, markings, and overall look
- Only the pose, action, and context should change — the character must be instantly recognisable as the same character
- ${OUTPUT_STYLE_INSTRUCTIONS[outputStyle]}
- ${BACKGROUND_INSTRUCTIONS[background]}
- Do not add text, speech bubbles, or captions
- Return only the new illustration, nothing else`

    const result = await generateText({
      model: googleAI("gemini-3.1-flash-image"),
      providerOptions: { google: { responseModalities: ["TEXT", "IMAGE"] } },
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "file", data: base64, mediaType },
        ] as never,
      }],
    })

    const file = result.files?.find((f) => f.mediaType?.startsWith("image/"))
    if (!file) {
      return Response.json({ error: "Het model gaf geen afbeelding terug. Probeer opnieuw." }, { status: 502 })
    }

    return Response.json({ image: `data:${file.mediaType};base64,${file.base64}` })
  } catch (err) {
    console.error("[generate-character] error:", err)
    const raw = err instanceof Error ? err.message : String(err)
    return Response.json({ error: "Genereren mislukt. Probeer opnieuw.", debug: raw }, { status: 500 })
  }
}
