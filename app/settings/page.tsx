"use client"

import { useState } from "react"
import { PromptSettings } from "@/components/settings/prompt-settings"
import { ImageSettings } from "@/components/settings/image-settings"
import { GenerationsGallery } from "@/components/settings/generations-gallery"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "prompts",      label: "Prompts" },
  { id: "afbeeldingen", label: "Afbeeldingen" },
  { id: "resultaten",   label: "Resultaten" },
]

export default function SettingsPage() {
  const [tab, setTab] = useState("prompts")

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Instellingen</h1>
        <p className="text-sm text-muted-foreground">Beheer prompts en afbeeldingen</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "prompts"      && <PromptSettings />}
      {tab === "afbeeldingen" && <ImageSettings />}
      {tab === "resultaten"   && <GenerationsGallery />}
    </div>
  )
}
