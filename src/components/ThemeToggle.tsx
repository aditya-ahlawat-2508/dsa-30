"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun, SunMoon } from "lucide-react";

type ThemeChoice = "system" | "light" | "dark";
const THEME_KEY = "dsa-tracker:theme";
const ORDER: ThemeChoice[] = ["system", "light", "dark"];
const ICONS = { system: SunMoon, light: Sun, dark: Moon };
const LABELS = { system: "System theme", light: "Light theme", dark: "Dark theme" };

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): ThemeChoice {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

function getServerSnapshot(): ThemeChoice {
  return "system";
}

function setTheme(choice: ThemeChoice) {
  if (choice === "system") {
    localStorage.removeItem(THEME_KEY);
    delete document.documentElement.dataset.theme;
  } else {
    localStorage.setItem(THEME_KEY, choice);
    document.documentElement.dataset.theme = choice;
  }
  listeners.forEach((l) => l());
}

export function ThemeToggle() {
  const choice = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function cycle() {
    setTheme(ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length]);
  }

  const Icon = ICONS[choice];

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${LABELS[choice]}. Click to switch.`}
      title={LABELS[choice]}
      className="rounded-full p-1.5 text-muted hover:bg-accent-tint hover:text-foreground"
    >
      <Icon size={16} />
    </button>
  );
}
