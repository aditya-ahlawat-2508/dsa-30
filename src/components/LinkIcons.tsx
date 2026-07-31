import { ExternalLink, BookOpen, SquarePlay } from "lucide-react";

function LinkIcon({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: typeof ExternalLink;
}) {
  if (!href) {
    return (
      <span
        aria-hidden="true"
        title={`${label} link not set`}
        className="inline-flex items-center justify-center rounded-full p-1.5 text-muted opacity-30"
      >
        <Icon size={16} />
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${label} link`}
      title={label}
      className="inline-flex items-center justify-center rounded-full p-1.5 text-accent transition-colors hover:bg-accent-tint"
    >
      <Icon size={16} />
    </a>
  );
}

export function LinkIcons({
  primary,
  editorial,
  video,
}: {
  primary: string;
  editorial: string;
  video: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <LinkIcon href={primary} label="Problem" Icon={ExternalLink} />
      <LinkIcon href={editorial} label="Editorial" Icon={BookOpen} />
      <LinkIcon href={video} label="Video" Icon={SquarePlay} />
    </div>
  );
}
