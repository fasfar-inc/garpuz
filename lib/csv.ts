/**
 * Small RFC 4180 CSV parser. Handles quoted fields, escaped quotes, CRLF line
 * endings, a UTF-8 BOM, and Excel exports that use ";" or tabs as separators
 * (common with Turkish regional settings).
 */
export function parseCsv(text: string): string[][] {
  const input = text.replace(/^﻿/, "");
  const delimiter = detectDelimiter(input);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += char;
      continue;
    }
    if (char === '"' && field === "") quoted = true;
    else if (char === delimiter) { row.push(field); field = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(field); field = "";
      rows.push(row); row = [];
    } else field += char;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function detectDelimiter(text: string) {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  let best = ",";
  let bestCount = 0;
  for (const candidate of [",", ";", "\t"]) {
    const count = firstLine.split(candidate).length - 1;
    if (count > bestCount) { best = candidate; bestCount = count; }
  }
  return best;
}

/**
 * Parses prices written as 1299, 1299.50, 1.299,50, 1,299.50 or "₺1 299".
 * The last "." or "," is treated as the decimal mark when it is followed by
 * one or two digits; otherwise separators are thousands separators.
 */
export function parsePrice(value: string): number | null {
  const cleaned = value.replace(/[^\d.,-]/g, "");
  if (!cleaned || !/\d/.test(cleaned)) return null;
  const lastMark = Math.max(cleaned.lastIndexOf("."), cleaned.lastIndexOf(","));
  let normalized: string;
  if (lastMark >= 0 && cleaned.length - lastMark - 1 <= 2 && cleaned.length - lastMark - 1 > 0) {
    normalized = cleaned.slice(0, lastMark).replace(/[.,]/g, "") + "." + cleaned.slice(lastMark + 1);
  } else {
    normalized = cleaned.replace(/[.,]/g, "");
  }
  const number = Number(normalized);
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : null;
}

const CONDITION_ALIASES: Record<string, string> = {
  new: "new", "sıfır": "new", sifir: "new", yeni: "new",
  used: "used", "ikinci el": "used", "2. el": "used", kullanilmis: "used", "kullanılmış": "used",
  refurbished: "refurbished", "yenilenmiş": "refurbished", yenilenmis: "refurbished",
};

const AVAILABILITY_ALIASES: Record<string, string> = {
  in_stock: "in_stock", "in stock": "in_stock", stokta: "in_stock", var: "in_stock", yes: "in_stock",
  out_of_stock: "out_of_stock", "out of stock": "out_of_stock", "stokta yok": "out_of_stock", yok: "out_of_stock", no: "out_of_stock",
  preorder: "preorder", "pre-order": "preorder", "ön sipariş": "preorder", "on siparis": "preorder",
};

export function normalizeCondition(value: string) {
  const key = value.trim().toLocaleLowerCase("tr");
  return key ? CONDITION_ALIASES[key] ?? key : "new";
}

export function normalizeAvailability(value: string) {
  const key = value.trim().toLocaleLowerCase("tr");
  return key ? AVAILABILITY_ALIASES[key] ?? key : "in_stock";
}

/** Accepts English column names plus common Turkish ones. */
const HEADER_ALIASES: Record<string, string> = {
  name: "name", product: "name", "product name": "name", "ürün": "name", "ürün adı": "name", urun: "name", ad: "name",
  brand: "brand", marka: "brand",
  model: "model",
  category: "category", kategori: "category",
  price: "price", fiyat: "price",
  currency: "currency", "para birimi": "currency",
  condition: "condition", durum: "condition",
  availability: "availability", stock: "availability", stok: "availability",
  sku: "sku", code: "sku", kod: "sku", "stok kodu": "sku",
  image_url: "image_url", image: "image_url", "görsel": "image_url", resim: "image_url",
};

export function mapHeaders(headers: string[]) {
  return headers.map((h) => HEADER_ALIASES[h.trim().toLocaleLowerCase("tr")] ?? null);
}

export const CSV_TEMPLATE = [
  "name,brand,model,category,price,currency,condition,availability,sku,image_url",
  "Galaxy A55,Samsung,128GB,Electronics,18999,TRY,new,in_stock,SAM-A55-128,",
  "Cordless drill GSR 12V,Bosch,,Home & Garden,3450.50,TRY,new,in_stock,,",
].join("\r\n") + "\r\n";
