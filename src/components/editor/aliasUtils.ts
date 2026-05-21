export function slugifyAlias(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export function slugifyAliasInput(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 100);
}

export function suggestAlias(parts: Array<string | undefined | null>) {
  return slugifyAlias(parts.filter(Boolean).join(" "));
}

export function isValidAlias(alias: string) {
  return /^[a-z0-9-]{1,100}$/.test(alias);
}
