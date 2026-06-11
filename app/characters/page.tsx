import { CharacterGenerator } from "@/components/character-generator"

export const metadata = { title: "Characters — Van Gils & Colours" }

export default function CharactersPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Characters</h1>
        <p className="text-sm text-muted-foreground">
          Genereer een personage in een nieuwe actie of scène
        </p>
      </div>
      <CharacterGenerator />
    </div>
  )
}
