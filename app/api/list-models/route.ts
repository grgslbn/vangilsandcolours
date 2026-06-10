export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) return Response.json({ error: "No API key" }, { status: 500 })

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`,
  )
  const data = await res.json()
  return Response.json(data)
}
