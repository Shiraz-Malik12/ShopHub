// Turns a display name into a URL/lookup-safe slug, e.g. "Men's Shoes" ->
// "mens-shoes". Always derived server-side from `name` — a client-supplied
// slug is never trusted (see categoryController.js).
export function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // any run of non-alphanumeric chars -> one hyphen
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens left over from the above
}
