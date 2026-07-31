const SLUG_WORD_OVERRIDES: Record<string, string> = {
  Bst: "BST",
  Ii: "II",
  Iii: "III",
  Lru: "LRU",
  Kth: "Kth",
};

export function deriveTitleFromUrl(url: string): string {
  const match = url.match(/\/problems\/([a-z0-9-]+)\/?/i);
  if (!match) return "";
  const slug = match[1];
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => {
      const capitalised = word[0].toUpperCase() + word.slice(1).toLowerCase();
      return SLUG_WORD_OVERRIDES[capitalised] ?? capitalised;
    })
    .join(" ");
}
