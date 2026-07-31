import { Modal } from "./Modal";

const SHORTCUTS: [string, string][] = [
  ["j / k", "Move selection down / up"],
  ["space", "Cycle status of selected question"],
  ["s", "Star / unstar selected question"],
  ["e", "Edit selected slot"],
  ["n", "Focus the day notes"],
  ["?", "Toggle this overlay"],
];

export function ShortcutOverlay({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Keyboard shortcuts" onClose={onClose}>
      <ul className="flex flex-col gap-2 text-sm">
        {SHORTCUTS.map(([key, desc]) => (
          <li key={key} className="flex items-center justify-between gap-4">
            <kbd className="rounded border border-card-border bg-accent-tint px-2 py-0.5 font-mono text-xs">
              {key}
            </kbd>
            <span className="text-muted">{desc}</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
