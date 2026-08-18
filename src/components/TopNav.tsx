import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { CountdownTimer } from "./CountdownTimer";

export function TopNav() {
  return (
    <header className="border-b border-card-border">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="shrink-0 text-sm font-bold tracking-tight">
          dsa-30
        </Link>
        <CountdownTimer />
        <div className="flex items-center gap-4 text-sm text-muted">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <Link href="/browse" className="hover:text-foreground">
            Browse
          </Link>
          <Link href="/badges" className="hover:text-foreground">
            Badges
          </Link>
          <Link href="/settings" className="hover:text-foreground">
            Settings
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
