// V5/src/components/foresight/inject-entity-links.ts
//
// Auto-link injector. Walks an LLM-produced markdown string and wraps known
// entity mentions (ESN/MSN/lessor/operator/etc.) in `[text](url)` markdown
// links so the chat renderer turns them into clickable in-app navigation.
//
// Design constraints (covered by tests/components/foresight/inject-entity-links.test.ts):
//   - Numeric IDs use word-boundary matching so 12345 doesn't link inside 1234567.
//   - Within a group, longer names win (Air France KLM beats Air France).
//   - Idempotent: running it twice on the same content produces the same output.
//   - Skips matches that fall inside an existing markdown link or inside backticks.
//   - Special regex characters in entity names are escaped.

export interface EntityRef {
  name: string;
  urlPath: string;
}

export interface EntityGroup {
  label: string;
  matchKind: "exact-word" | "numeric-id";
  entities: EntityRef[];
}

const SPECIAL_REGEX = /[.*+?^${}()|[\]\\]/g;

function escapeRegex(s: string): string {
  return s.replace(SPECIAL_REGEX, "\\$&");
}

/**
 * Compute the index ranges in `text` that must NOT be touched by the injector.
 * Currently: existing markdown links `[label](url)` and inline code spans `\`...\``.
 *
 * Recomputed every iteration because each replacement mutates `text` and shifts
 * downstream offsets.
 */
function computeProtectedRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];

  const linkRe = /\[[^\]]*\]\([^)]+\)/g;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(text)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }

  const codeRe = /`[^`]*`/g;
  while ((m = codeRe.exec(text)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }

  return ranges;
}

function isInRange(idx: number, ranges: Array<[number, number]>): boolean {
  for (const [a, b] of ranges) {
    if (idx >= a && idx < b) return true;
  }
  return false;
}

/**
 * Replace mentions of canonical entity names with markdown links.
 * Caller passes the full set of known entities grouped by kind.
 */
export function injectEntityLinks(content: string, groups: EntityGroup[]): string {
  if (!content) return content;

  let result = content;

  for (const group of groups) {
    // Sort longest-first so multi-word names win over their shorter prefixes.
    const sorted = [...group.entities].sort((a, b) => b.name.length - a.name.length);

    for (const entity of sorted) {
      if (!entity.name) continue;
      const escaped = escapeRegex(entity.name);

      // Different boundaries depending on whether this is a numeric ID
      // (must not match adjacent digits/letters) or a free-form name
      // (must not match adjacent word chars; also reject when preceded by
      // `[` or backtick to avoid eating into existing markdown).
      const pattern =
        group.matchKind === "numeric-id"
          ? new RegExp(`(?<![\\w])${escaped}(?![\\w])`, "g")
          : new RegExp(`(?<![\\w\\[\`])${escaped}(?![\\w])`, "g");

      // Recompute protected ranges every iteration since `result` mutates.
      const protectedRanges = computeProtectedRanges(result);

      result = result.replace(pattern, (match, offset: number) => {
        if (isInRange(offset, protectedRanges)) return match;
        return `[${entity.name}](${entity.urlPath})`;
      });
    }
  }

  return result;
}
