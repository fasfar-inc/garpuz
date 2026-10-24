import { describe, expect, it } from "vitest";
import { productSchema, shopSchema } from "@/lib/validation";

const firstIssue = (result: { error?: { issues: { path: PropertyKey[] }[] } }) => result.error?.issues[0]?.path[0];

describe("shopSchema", () => {
  it("accepts the three shop details and stores WhatsApp as international digits", () => {
    expect(shopSchema.parse({ businessName: " Girne Tech ", city: "Girne", whatsapp: "0533 123 45 67" })).toEqual({ businessName: "Girne Tech", city: "Girne", whatsapp: "905331234567" });
    expect(shopSchema.parse({ businessName: "Shop", city: "Lefkoşa", whatsapp: "+90 (533) 123-45-67" }).whatsapp).toBe("905331234567");
  });
  it("names the field that is wrong", () => {
    expect(firstIssue(shopSchema.safeParse({ businessName: "G", city: "Girne", whatsapp: "+905331234567" }))).toBe("businessName");
    expect(firstIssue(shopSchema.safeParse({ businessName: "Shop", city: "Paris", whatsapp: "+905331234567" }))).toBe("city");
    expect(firstIssue(shopSchema.safeParse({ businessName: "Shop", city: "Girne", whatsapp: "12" }))).toBe("whatsapp");
  });
});

describe("productSchema", () => {
  it("tidies the name and reads lira prices written either way", () => {
    expect(productSchema.parse({ name: "  Olive   oil 1L ", price: "1.250,50" })).toEqual({ id: null, name: "Olive oil 1L", price: 1250.5 });
    expect(productSchema.parse({ id: "8f14e45f-ceea-4e7d-a9b2-1c3d4e5f6a7b", name: "iPhone 15 128GB", price: "₺45999.9" }).price).toBe(45999.9);
  });
  it("requires a name and a price above zero", () => {
    expect(firstIssue(productSchema.safeParse({ name: "A", price: "10" }))).toBe("name");
    expect(firstIssue(productSchema.safeParse({ name: "Kettle", price: "0" }))).toBe("price");
    expect(firstIssue(productSchema.safeParse({ name: "Kettle", price: "ten" }))).toBe("price");
    expect(firstIssue(productSchema.safeParse({ name: "Kettle", price: "10", id: "nope" }))).toBe("id");
  });
});
