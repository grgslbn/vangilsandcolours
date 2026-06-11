import { Colorizer } from "@/components/colorizer"

export const metadata = { title: "Colouring — Van Gils & Colours" }

export default function ColouringPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Colouring</h1>
        <p className="text-sm text-muted-foreground">
          Kleur zwart-wit lijntekeningen in met je huisstijlpalet
        </p>
      </div>
      <Colorizer />
    </div>
  )
}
