export const COARSE_BUCKETS = [
  "Array",
  "String",
  "Binary Search",
  "LinkedList",
  "Recursion",
  "Bit Manipulation",
  "Stack/Queue",
  "Sliding Window",
  "Heap",
  "Greedy",
  "Tree",
  "BST",
  "Graph",
  "DP",
  "Trie",
] as const;

export type CoarseBucket = (typeof COARSE_BUCKETS)[number] | "Other";

// Order matters — more specific keywords are checked before broader ones
// (e.g. "BST" before generic "tree", "priority queue" before "queue") so a
// pattern isn't force-fit into the wrong coarse bucket.
const RULES: [RegExp, CoarseBucket][] = [
  [/\bbinary search tree\b|\bbst\b/i, "BST"],
  [/\btrie\b/i, "Trie"],
  [/\btree\b/i, "Tree"],
  [/\bgraph\b|\bunion[\s-]?find\b|\bdijkstra\b|\bbfs\b|\bdfs\b|\bshortest path\b|\btopological\b/i, "Graph"],
  [/\bdp\b|\bdynamic programming\b/i, "DP"],
  [/\bbinary search\b/i, "Binary Search"],
  [/\bpriority queue\b|\bheap\b/i, "Heap"],
  [/\bstack\b|\bqueue\b/i, "Stack/Queue"],
  [/\bsliding window\b/i, "Sliding Window"],
  [/\blinked list\b/i, "LinkedList"],
  [/\brecursion\b|\bbacktrack/i, "Recursion"],
  [/\bbit manipulation\b|\bbitwise\b|\bxor\b/i, "Bit Manipulation"],
  [/\bgreedy\b/i, "Greedy"],
  [/\bstring\b/i, "String"],
  [/\barray\b/i, "Array"],
];

/**
 * Maps a question's free-text `pattern` field to one of the 15 coarse browse
 * buckets, falling back to "Other" for anything that doesn't clearly match —
 * e.g. "Math", "Queries", "Simulation", "Sorting" from the current plan.json
 * data intentionally land in "Other" rather than being guessed into a
 * DSA-pattern bucket they don't really belong to.
 */
export function bucketForPattern(pattern: string): CoarseBucket {
  if (!pattern) return "Other";
  for (const [re, bucket] of RULES) {
    if (re.test(pattern)) return bucket;
  }
  return "Other";
}
