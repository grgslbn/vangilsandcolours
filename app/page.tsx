import { Colorizer } from "@/components/colorizer"
import { Toaster } from "@/components/ui/sonner"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-5 sm:px-6">
          <div>
            <h1 className="text-lg font-semibold leading-tight text-card-foreground text-balance">
              Van Gils & Colours
            </h1>
            <p className="text-sm text-muted-foreground">
              Kleur zwart-wit lijntekeningen in met je huisstijlpalet
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Colorizer />
      </section>

      <Toaster />
    </main>
  )
}
