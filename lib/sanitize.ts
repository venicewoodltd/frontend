/**
 * HTML sanitizer utility for safe rendering of user-generated content.
 * Strips potentially dangerous HTML tags/attributes while preserving
 * safe formatting elements.
 */

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "b",
  "i",
  "em",
  "strong",
  "u",
  "s",
  "del",
  "strike",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "pre",
  "code",
  "span",
  "div",
  "hr",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "img",
  "font",
  "sub",
  "sup",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan"]),
  font: new Set(["color"]),
  "*": new Set(["class", "id", "style"]),
};

export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== "string") return "";

  let clean = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");

  clean = clean.replace(
    /(?:href|src|action)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi,
    "",
  );
  clean = clean.replace(
    /(?:href|src|action)\s*=\s*(?:"data:[^"]*"|'data:[^']*')/gi,
    "",
  );

  clean = clean.replace(
    /<\/?(?:iframe|object|embed|form|input|textarea|button|select|option)\b[^>]*>/gi,
    "",
  );

  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  clean = clean.replace(
    /\s+style\s*=\s*(?:"[^"]*expression[^"]*"|'[^']*expression[^']*')/gi,
    "",
  );

  return clean;
}

export function escapeHTML(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
