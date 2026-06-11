"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Palette, Users, Layers, Shuffle } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/colouring",     label: "Colouring",      icon: Palette },
  { href: "/characters",    label: "Characters",     icon: Users },
  { href: "/splash-panels", label: "Splash Panels",  icon: Layers },
  { href: "/variations",    label: "Variations",     icon: Shuffle },
]

export function AppNav() {
  const pathname = usePathname()

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
      {/* Brand */}
      <div className="border-b border-border px-5 py-5">
        <span className="text-base font-semibold tracking-tight text-card-foreground">
          Van Gils &amp; Colours
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
