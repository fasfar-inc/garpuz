import { describe, expect, it } from "vitest";
import { catalogKey, parsePrice, productTitle, textKey } from "@/lib/product-text";

describe("catalogKey", () => {
  it("ignores case and extra whitespace", () => {
    expect(catalogKey(" APPLE ", "iPhone  15", null)).toBe(catalogKey("apple", "iphone 15", ""));
  });
  it("matches the database's lower-casing of I", () => {
    expect(catalogKey("SAMSUNG", "GALAXY", "SILICONE")).toBe(catalogKey("samsung", "galaxy", "silicone"));
    expect(textKey("ARÇELIK İnce")).toBe(textKey("arçelik ince"));
  });
});

describe("productTitle", () => {
  it("joins brand, name and model, skipping blanks", () => {
    expect(productTitle({ brand: "Apple", name: "iPhone 15", model: "128GB" })).toBe("Apple iPhone 15 128GB");
    expect(productTitle({ brand: "", name: "Kettle 1.7L", model: null })).toBe("Kettle 1.7L");
  });
});

describe("parsePrice", () => {
  it.each([
    ["45.999,90", 45999.9], ["45,999.90", 45999.9], ["1.500", 1500], ["1500,5", 1500.5],
    ["1500.5", 1500.5], ["₺ 1 250", 1250], ["1,250", 1250], ["0", 0], ["250 TL", 250],
  ])("parses %s", (input, expected) => expect(parsePrice(input)).toBe(expected));
  it.each(["", "abc", "-5", "1.2.3,4,5"])("rejects %s", (input) => expect(parsePrice(input)).toBeNull());
});
