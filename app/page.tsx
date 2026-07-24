"use client"

import { Colorizer } from "@/components/colorizer"
import { Animator } from "@/components/animator"
import { Toaster } from "@/components/ui/sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clapperboard, Palette } from "lucide-react"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-5 sm:px-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Palette className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-card-foreground text-balance">
              Illustratie Studio
            </h1>
            <p className="text-sm text-muted-foreground">
              Kleur in en animeer lijntekeningen met je huisstijl
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <Tabs defaultValue="inkleuren">
          <TabsList className="mb-6 h-11 w-full max-w-sm">
            <TabsTrigger value="inkleuren" className="flex-1 gap-2">
              <Palette className="h-4 w-4" />
              Inkleuren
            </TabsTrigger>
            <TabsTrigger value="animeren" className="flex-1 gap-2">
              <Clapperboard className="h-4 w-4" />
              Animeren
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inkleuren" className="pb-8">
            <Colorizer />
          </TabsContent>

          <TabsContent value="animeren" className="pb-8">
            <Animator />
          </TabsContent>
        </Tabs>
      </div>

      <Toaster />
    </main>
  )
}
