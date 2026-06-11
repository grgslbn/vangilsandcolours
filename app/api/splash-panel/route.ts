import { generateText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { readFileSync } from "fs"
import { join } from "path"
import { supabaseServer } from "@/lib/supabase"

export const maxDuration = 90

const googleAI = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export type SplashPanelBody = {
  description: string
  format: "portrait" | "landscape" | "square"
  scenes: number
  layout: "grid" | "mixed" | "circles" | "free"
  lineWeight: "fine" | "medium" | "bold"
  mood: string
  audience: string
  season: string
  useStyleRef: boolean
}

const FORMAT_LABELS: Record<string, string> = {
  portrait:  "A4 portrait (tall, vertical composition)",
  landscape: "A4 landscape (wide, horizontal composition)",
  square:    "square format (1:1 ratio)",
}

const LAYOUT_INSTRUCTIONS: Record<string, string> = {
  grid:    "Divide the composition into a regular grid of equal-sized rectangular panels, clearly separated by black borders.",
  mixed:   "Use panels of varying sizes — some large feature panels and some smaller detail panels — arranged in an asymmetric but balanced layout.",
  circles: "Use a mix of rectangular panels and circular/oval highlight panels that overlap or float within the composition.",
  free:    "Use an open, free-flowing composition where scenes blend naturally into each other without strict panel borders.",
}

const LINE_INSTRUCTIONS: Record<string, string> = {
  fine:   "Use very fine, detailed line work — thin strokes, intricate details, high information density.",
  medium: "Use medium line weight — clear and readable with a balance of detail and simplicity.",
  bold:   "Use bold, graphic line work — thick confident strokes, strong silhouettes, minimal fine detail.",
}

// Load style refs: first try DB images, then fall back to bundled samples
async function loadStyleRefs(): Promise<{ base64: string; mediaType: string }[]> {
  const sb = supabaseServer()
  const { data } = await sb
    .from("VanGils_images")
    .select("public_url")
    .order("sort_order", { ascending: true })
    .limit(3)

  if (data && data.length > 0) {
    const results = await Promise.all(
      data.map(async ({ public_url }) => {
        const res = await fetch(public_url)
        const mediaType = res.headers.get("content-type") ?? "image/jpeg"
        const buffer = Buffer.from(await res.arrayBuffer())
        return { base64: buffer.toString("base64"), mediaType }
      })
    )
    return results
  }

  // Fallback to bundled files
  return ["wonen.jpg", "economie.jpg", "eco.jpg"].map((file) => ({
    base64: readFileSync(join(process.cwd(), "public/samples", file)).toString("base64"),
    mediaType: "image/jpeg",
  }))
}

// Load prompt template from DB, fall back to hardcoded
async function loadPromptTemplate(): Promise<string> {
  const sb = supabaseServer()
  const { data } = await sb
    .from("VanGils_settings")
    .select("value")
    .eq("key", "splash_panel_prompt")
    .single()
  return data?.value ?? FALLBACK_PROMPT
}

function buildPrompt(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (t, [k, v]) => t.replaceAll(`{{${k}}}`, v),
    template,
  )
}

const FALLBACK_PROMPT = `You are a professional Belgian editorial illustrator.

Create a black-and-white line illustration splash panel with the following specifications:

CRITICAL OUTPUT RULES:
- ONLY black ink lines on a pure white background
- Absolutely no gray fills, no shading, no hatching, no color
- Clean line art only — every area is either white or black line

THEME: {{description}}

COMPOSITION:
- Format: {{format}}
- Number of scenes: {{scenes}} distinct scenes that together tell the story of the theme
- Panel layout: {{layout}}
- Line weight: {{lineWeight}}

CONTEXT:
- Mood: {{mood}}
- Target audience: {{audience}}
- Season: {{season}}

STYLE:
- Editorial illustration style, similar to Belgian public communication infographics
- Each scene must clearly illustrate a different aspect of the theme
- Strong, iconic imagery — easily readable at a glance
- No text, no labels, no captions anywhere in the illustration
- Fill the entire canvas edge to edge
{{styleRefLine}}

Return only the illustration, nothing else.`

export async function POST(req: Request) {
  try {
    const body: SplashPanelBody = await req.json()
    const { description, format, scenes, layout, lineWeight, mood, audience, season, useStyleRef } = body

    if (!description?.trim()) {
      return Response.json({ error: "Geef een beschrijving op." }, { status: 400 })
    }

    const [template, styleRefs] = await Promise.all([
      loadPromptTemplate(),
      useStyleRef ? loadStyleRefs() : Promise.resolve([]),
    ])

    const prompt = buildPrompt(template, {
      description,
      format:      FORMAT_LABELS[format],
      scenes:      String(scenes),
      layout:      LAYOUT_INSTRUCTIONS[layout],
      lineWeight:  LINE_INSTRUCTIONS[lineWeight],
      mood,
      audience,
      season:      season !== "none" ? season : "no specific season",
      styleRefLine: useStyleRef
        ? "- The reference illustrations provided show the exact visual style, line quality and composition language to match"
        : "",
    })

    const content: { type: "text" | "file"; text?: string; data?: string; mediaType?: string }[] = [
      { type: "text", text: prompt },
    ]
    for (const ref of styleRefs) {
      content.push({ type: "file", data: ref.base64, mediaType: ref.mediaType })
    }

    const result = await generateText({
      model: googleAI("gemini-3.1-flash-image"),
      providerOptions: {
        google: { responseModalities: ["TEXT", "IMAGE"] },
      },
      messages: [{ role: "user", content: content as never }],
    })

    const file = result.files?.find((f) => f.mediaType?.startsWith("image/"))
    if (!file) {
      return Response.json({ error: "Het model gaf geen afbeelding terug. Probeer opnieuw." }, { status: 502 })
    }

    return Response.json({
      image: `data:${file.mediaType};base64,${file.base64}`,
      promptUsed: prompt,
    })
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err)
    console.error("[splash-panel] error:", err)
    return Response.json({ error: "Genereren mislukt. Probeer opnieuw.", debug: raw }, { status: 500 })
  }
}
