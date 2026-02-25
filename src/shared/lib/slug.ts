export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\+\+/g, " plus plus ")
    .replace(/\+/g, " plus ")
    .replace(/#/g, " sharp ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleFromSlug(slug: string) {
  const parts = slug.split("-").filter(Boolean);
  const words: string[] = [];

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];

    if (part === "plus") {
      const next = parts[i + 1];
      if (words.length > 0) {
        words[words.length - 1] = `${words[words.length - 1]}${next === "plus" ? "++" : "+"}`;
        if (next === "plus") i += 1;
      } else {
        words.push("+");
      }
      continue;
    }

    if (part === "sharp") {
      if (words.length > 0) {
        words[words.length - 1] = `${words[words.length - 1]}#`;
      } else {
        words.push("#");
      }
      continue;
    }

    words.push(part.charAt(0).toUpperCase() + part.slice(1));
  }

  return words.join(" ");
}
