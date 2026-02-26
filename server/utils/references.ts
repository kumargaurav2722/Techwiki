export type ReferenceItem = { title: string; url: string };

const headingRegex = /^#{1,3}\s+References\b/i;

function normalizeUrl(url: string) {
  return url.replace(/\)$/g, "").trim();
}

export function parseReferencesFromMarkdown(markdown: string): ReferenceItem[] {
  const lines = markdown.split(/\r?\n/);
  let start = -1;

  for (let i = 0; i < lines.length; i += 1) {
    if (headingRegex.test(lines[i].trim())) {
      start = i + 1;
      break;
    }
  }

  if (start === -1) return [];

  const refs: ReferenceItem[] = [];

  for (let i = start; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/^#{1,3}\s+/.test(line)) break;

    const cleaned = line
      .replace(/^[-*]\s+/, "")
      .replace(/^\d+\.\s+/, "")
      .trim();

    let title = "";
    let url = "";

    const mdMatch = cleaned.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (mdMatch) {
      title = mdMatch[1].trim();
      url = normalizeUrl(mdMatch[2]);
    } else if (cleaned.includes("|")) {
      const [left, right] = cleaned.split("|").map((part) => part.trim());
      title = left || "";
      url = normalizeUrl(right || "");
    } else if (cleaned.includes(" - ")) {
      const [left, right] = cleaned.split(" - ").map((part) => part.trim());
      title = left || "";
      url = normalizeUrl(right || "");
    }

    if (!title || !url) continue;
    if (!/^https?:\/\//i.test(url)) continue;

    refs.push({ title, url });
  }

  const map = new Map<string, ReferenceItem>();
  for (const ref of refs) {
    if (!map.has(ref.url)) map.set(ref.url, ref);
  }

  return Array.from(map.values());
}
