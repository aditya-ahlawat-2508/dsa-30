"use client";

import { Trophy, Snowflake, X } from "lucide-react";
import { useToastStore, type ToastItem } from "@/store/useToastStore";

const ICONS = { badge: Trophy, freeze: Snowflake };

export function Toast({ toast }: { toast: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const Icon = toast.icon ? ICONS[toast.icon] : Trophy;

  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-lg border border-card-border bg-card p-3 shadow-lg"
    >
      <Icon size={16} className="mt-0.5 shrink-0 text-accent" />
      <div className="flex-1 text-sm">
        <p className="font-medium">{toast.title}</p>
        {toast.description && <p className="text-xs text-muted">{toast.description}</p>}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-full p-0.5 text-muted hover:bg-accent-tint hover:text-foreground"
      >
        <X size={14} />
      </button>
    </div>
  );
}
