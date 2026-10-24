import { describe, expect, it } from "vitest";
import { catalogKey, parseCsv, parseImport, parsePrice } from "@/lib/catalog-import";

describe("parseCsv", () => {
  it("handles quotes, escaped quotes and CRLF", () => {
    expect(parseCsv('a,b\r\n"x, y","say ""hi"""\r\n')).toEqual([["a", "b"], ["x, y", 'say "hi"']]);
  });
  it("detects semicolon delimiters", () => {
    expect(parseCsv("brand;name;price\nApple;iPhone;10,5")).toEqual([["brand", "name", "price"], ["Apple", "iPhone", "10,5"]]);
  });
});

describe("parseImport", () => {
  it("requires the core columns", () => {
    expect(parseImport("brand,name\nApple,iPhone").problems).toEqual([{ line: 1, reason: "missing_columns" }]);
  });
  it("applies defaults and reports invalid rows by line", () => {
    const { rows, problems } = parseImport("Brand,Name,Model,Price,Condition\nApple,iPhone 15,A3090,\"45.999,90\",used\nSamsung,,S24,10,new\nSony,WH-1000XM5,,abc,new\nLG,TV,,10,broken");
    expect(rows).toEqual([{ line: 2, brand: "Apple", name: "iPhone 15", model: "A3090", price: 45999.9, currency: "TRY", condition: "used", availability: "in_stock", sku: null, category: null }]);
    expect(problems).toEqual([{ line: 3, reason: "missing_fields" }, { line: 4, reason: "invalid_price" }, { line: 5, reason: "invalid_condition" }]);
  });
  it("reads an optional category for new products, case-insensitively", () => {
    const { rows, problems } = parseImport("brand,name,price,category\nApple,iPhone 15,10,mobile phones\nAcme,Kettle  Pro,10,\nAcme,Toaster,10,Spaceships");
    expect(rows.map((row) => [row.name, row.category])).toEqual([["iPhone 15", "Mobile Phones"], ["Kettle Pro", null]]);
    expect(problems).toEqual([{ line: 4, reason: "invalid_category" }]);
  });
});

describe("catalogKey", () => {
  it("ignores case and extra whitespace", () => {
    expect(catalogKey(" APPLE ", "iPhone  15", null)).toBe(catalogKey("apple", "iphone 15", ""));
  });
  it("matches the database's lower-casing of I", () => {
    expect(catalogKey("SAMSUNG", "GALAXY", "SILICONE")).toBe(catalogKey("samsung", "galaxy", "silicone"));
    expect(catalogKey("Arçelik", "İnce", null)).toBe(catalogKey("ARÇELIK", "ince", null));
  });
});

describe("parsePrice", () => {
  it.each([
    ["45.999,90", 45999.9], ["45,999.90", 45999.9], ["1.500", 1500], ["1500,5", 1500.5],
    ["1500.5", 1500.5], ["₺ 1 250", 1250], ["1,250", 1250], ["0", 0],
  ])("parses %s", (input, expected) => expect(parsePrice(input)).toBe(expected));
  it.each(["", "abc", "-5", "1.2.3,4,5"])("rejects %s", (input) => expect(parsePrice(input)).toBeNull());
});
