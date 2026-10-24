/** Text helpers for products, safe to use in both server and browser code. */

/** Compares product text the way the catalog's case-insensitive unique index does, ignoring extra spaces. */
export function textKey(value: string | null) {
  // Turkish lower-casing maps "I" to "ı" where the database's lower() gives "i"; folding both keeps
  // keys in line with the catalog's unique index.
  return (value ?? "").normalize("NFC").toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/\s+/g, " ").trim();
}

export function catalogKey(brand: string, name: string, model: string | null) {
  return `${textKey(brand)}|${textKey(name)}|${textKey(model)}`;
}

/** The name a shop sees and types for a catalog product: brand, name and model in one line. */
export function productTitle(product: { brand: string; name: string; model: string | null }) {
  return [product.brand, product.name, product.model].map((part) => part?.trim()).filter(Boolean).join(" ");
}

/**
 * Parses prices written in Turkish or English style: "45.999,90", "45,999.90", "1.500" (thousands),
 * "1500,5" and "1500.5", with an optional currency sign. Returns null for anything else.
 */
export function parsePrice(value: string): number | null {
  let text = value.replace(/[\s ]/g, "").replace(/^(₺|TL|TRY|€|£|\$)|(₺|TL|TRY|€|£|\$)$/gi, "");
  if (!/^\d[\d.,]*$/.test(text)) return null;
  const lastComma = text.lastIndexOf(","); const lastDot = text.lastIndexOf(".");
  if (lastComma !== -1 && lastDot !== -1) {
    const decimal = lastComma > lastDot ? "," : ".";
    text = text.replaceAll(decimal === "," ? "." : ",", "").replace(",", ".");
  } else if (lastComma !== -1) {
    text = /^\d+,\d{1,2}$/.test(text) ? text.replace(",", ".") : text.replaceAll(",", "");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    text = text.replaceAll(".", "");
  }
  const price = Number(text);
  return Number.isFinite(price) && price >= 0 ? price : null;
}
