import { SplashPanelGenerator } from "@/components/splash-panel-generator"

export const metadata = { title: "Splash Panels — Van Gils & Colours" }

export default function SplashPanelsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Splash Panels</h1>
        <p className="text-sm text-muted-foreground">
          Genereer een zwart-wit lijntekening op basis van een beschrijving
        </p>
      </div>
      <SplashPanelGenerator />
    </div>
  )
}
