import { Animator } from "@/components/animator"

export const metadata = { title: "Animation — Van Gils & Colours" }

export default function AnimationPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Animation</h1>
        <p className="text-sm text-muted-foreground">
          Animeer een illustratie naar een korte video
        </p>
      </div>
      <Animator />
    </div>
  )
}
