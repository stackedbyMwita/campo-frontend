"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch by waiting for mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null // or a loading skeleton
  }

  return (
    <ToggleGroup
      type="single"
      value={theme}
      onValueChange={(value) => {
        // Prevent unselecting (clicking active theme does nothing)
        if (value) setTheme(value)
      }}
      className="flex flex-col md:flex-row gap-1 p-1 bg-muted rounded-md border border-border"
    >
      {/* Light Mode Item */}
      <ToggleGroupItem
        value="light"
        aria-label="Toggle light mode"
        className="rounded-full data-[state=on]:bg-white data-[state=on]:text-primary data-[state=on]:shadow-sm transition-all"
      >
        <Sun className="h-4 w-4" />
        {/* Optional: Add text label only visible on mobile if you want */}
        <span className="sr-only">Light</span>
      </ToggleGroupItem>

      {/* Dark Mode Item */}
      <ToggleGroupItem
        value="dark"
        aria-label="Toggle dark mode"
        className="rounded-full data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm transition-all"
      >
        <Moon className="h-4 w-4" />
        <span className="sr-only">Dark</span>
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
