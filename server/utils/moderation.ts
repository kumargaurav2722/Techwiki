const DEFAULT_ACTION = "reject";

export type ModerationAction = "reject" | "hide";

export function getModerationKeywords() {
  const raw = process.env.MODERATION_KEYWORDS || "";
  return raw
    .split(",")
    .map((word) => word.trim().toLowerCase())
    .filter(Boolean);
}

export function getModerationAction(): ModerationAction {
  const raw = (process.env.MODERATION_KEYWORD_ACTION || DEFAULT_ACTION).toLowerCase();
  return raw === "hide" ? "hide" : "reject";
}

export function containsModerationKeyword(content: string) {
  const keywords = getModerationKeywords();
  if (keywords.length === 0) return false;
  const normalized = content.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}
