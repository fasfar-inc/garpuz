import { AVAILABILITIES, CONDITIONS, CURRENCIES } from "@/lib/validation";

export const MAX_IMPORT_ROWS = 1000;

export type ImportReason =
  | "missing_columns" | "too_many_rows" | "missing_fields" | "invalid_price" | "invalid_currency"
  | "invalid_condition" | "invalid_availability" | "no_catalog_match" | "duplicate_row";

export type ImportRow = {
  line: number; brand: string; name: string; model: string | null; price: number;
  currency: (typeof CURRENCIES)[number]; condition: (typeof CONDITIONS)[number];
  availability: (typeof AVAILABILITIES)[number]; sku: string | null;
};

export type ImportProblem = { line: number; reason: ImportReason };

/** Parses RFC 4180 CSV (quoted fields, escaped quotes, CRLF). Also accepts `;` as the delimiter. */
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^﻿/, "");
  const firstLine = source.slice(0, source.search(/\r?\n|$/));
  const delimiter = firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === delimiter) { row.push(field); field = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export function catalogKey(brand: string, name: string, model: string | null) {
  const clean = (value: string | null) => (value ?? "").normalize("NFC").toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();
  return `${clean(brand)}|${clean(name)}|${clean(model)}`;
}

/**
 * Parses prices written in Turkish or English style: "45.999,90", "45,999.90", "1.500" (thousands),
 * "1500,5" and "1500.5". Returns null for anything else.
 */
export function parsePrice(value: string): number | null {
  let text = value.replace(/[\s\u00A0]/g, "").replace(/^(₺|TL|TRY|€|£|\$)|(₺|TL|TRY|€|£|\$)$/gi, "");
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

/** Validates CSV text into import rows. Line numbers are 1-based and include the header. */
export function parseImport(text: string): { rows: ImportRow[]; problems: ImportProblem[] } {
  const table = parseCsv(text).filter((cells) => cells.some((cell) => cell.trim()));
  const header = (table[0] ?? []).map((cell) => cell.trim().toLowerCase());
  const column = (name: string) => header.indexOf(name);
  if (["brand", "name", "price"].some((name) => column(name) === -1)) return { rows: [], problems: [{ line: 1, reason: "missing_columns" }] };
  if (table.length - 1 > MAX_IMPORT_ROWS) return { rows: [], problems: [{ line: MAX_IMPORT_ROWS + 2, reason: "too_many_rows" }] };

  const rows: ImportRow[] = [];
  const problems: ImportProblem[] = [];
  table.slice(1).forEach((cells, index) => {
    const line = index + 2;
    const get = (name: string) => (column(name) === -1 ? "" : (cells[column(name)] ?? "").trim());
    const brand = get("brand"); const name = get("name");
    if (!brand || !name) return problems.push({ line, reason: "missing_fields" });
    const price = parsePrice(get("price"));
    if (price === null || price > 99_999_999) return problems.push({ line, reason: "invalid_price" });
    const currency = (get("currency") || "TRY").toUpperCase();
    if (!(CURRENCIES as readonly string[]).includes(currency)) return problems.push({ line, reason: "invalid_currency" });
    const condition = (get("condition") || "new").toLowerCase();
    if (!(CONDITIONS as readonly string[]).includes(condition)) return problems.push({ line, reason: "invalid_condition" });
    const availability = (get("availability") || "in_stock").toLowerCase().replace(/[\s-]+/g, "_");
    if (!(AVAILABILITIES as readonly string[]).includes(availability)) return problems.push({ line, reason: "invalid_availability" });
    rows.push({
      line, brand, name, model: get("model") || null, price: Math.round(price * 100) / 100,
      currency: currency as ImportRow["currency"], condition: condition as ImportRow["condition"],
      availability: availability as ImportRow["availability"], sku: get("sku").slice(0, 80) || null,
    });
  });
  return { rows, problems };
}
