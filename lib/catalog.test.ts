import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { findCatalogProduct, foldSearchText, matchCatalogProduct, readProductImage, searchCatalog } from "@/lib/catalog";

/** A query builder stand-in that records filters and resolves to `rows`. */
function fakeClient(rows: unknown[]) {
  const calls: [string, ...unknown[]][] = [];
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "ilike", "order", "limit"]) builder[method] = (...args: unknown[]) => { calls.push([method, ...args]); return builder; };
  builder.then = (resolve: (value: unknown) => void) => resolve({ data: rows, error: null });
  return { client: { from: () => builder } as unknown as SupabaseClient, calls };
}

describe("foldSearchText", () => {
  it("matches the database's folding of Turkish letters and punctuation", () => {
    expect(foldSearchText("Çay Makinesi – Ğ/ı/ö/ş/ü")).toBe("caymakinesigiosu");
    expect(foldSearchText("iPhone 15 Pro!")).toBe("iphone15pro");
  });
});

describe("searchCatalog", () => {
  it("requires every typed word, in any order", async () => {
    const { client, calls } = fakeClient([]);
    await searchCatalog(client, "  Apple  iphone 15%_ ");
    expect(calls.filter(([method]) => method === "ilike")).toEqual([["ilike", "search_text", "*apple*"], ["ilike", "search_text", "*iphone*"], ["ilike", "search_text", "*15*"]]);
  });
  it("skips the query when nothing searchable was typed", async () => {
    const { client, calls } = fakeClient([]);
    expect(await searchCatalog(client, " %%% ")).toEqual([]);
    expect(calls).toEqual([]);
  });
});

describe("findCatalogProduct", () => {
  const rows = [
    { id: "a", brand: "Apple", name: "iPhone 15", model: "128GB", category: "Mobile Phones", image_url: null },
    { id: "b", brand: "Apple", name: "iPhone 15", model: null, category: "Mobile Phones", image_url: null },
  ];
  it("returns the product with the same brand, name and model", async () => {
    const { client, calls } = fakeClient(rows);
    expect((await findCatalogProduct(client, { brand: "APPLE", name: "iphone  15", model: "128gb", category: "Other" }))?.id).toBe("a");
    expect((await findCatalogProduct(client, { brand: "Apple", name: "iPhone 15", model: null, category: "Other" }))?.id).toBe("b");
    expect(await findCatalogProduct(client, { brand: "Apple", name: "iPhone 15", model: "256GB", category: "Other" })).toBeNull();
    expect(calls).toContainEqual(["ilike", "brand", "APPLE"]);
  });
  it("escapes LIKE wildcards so they match literally", async () => {
    const { client, calls } = fakeClient([]);
    await findCatalogProduct(client, { brand: "50%_Off", name: "a\\b", model: null, category: "Other" });
    expect(calls).toContainEqual(["ilike", "brand", "50\\%\\_Off"]);
    expect(calls).toContainEqual(["ilike", "name", "a\\\\b"]);
  });
});

describe("matchCatalogProduct", () => {
  const rows = [
    { id: "a", brand: "Apple", name: "iPhone 15", model: "128GB", category: "Mobile Phones", image_url: null },
    { id: "b", brand: "", name: "Kettle 1.7L", model: null, category: "Other", image_url: null },
  ];
  it("matches the full title or the title without the brand, ignoring case and spacing", async () => {
    const { client } = fakeClient(rows);
    expect((await matchCatalogProduct(client, "apple iphone  15 128gb"))?.id).toBe("a");
    expect((await matchCatalogProduct(client, "iPhone 15 128GB"))?.id).toBe("a");
    expect((await matchCatalogProduct(client, "KETTLE 1.7l"))?.id).toBe("b");
  });
  it("does not match a different size or a partial name", async () => {
    const { client } = fakeClient(rows);
    expect(await matchCatalogProduct(client, "iPhone 15 256GB")).toBeNull();
    expect(await matchCatalogProduct(client, "iPhone 15")).toBeNull();
  });
});

describe("readProductImage", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const webp = new Uint8Array([...new TextEncoder().encode("RIFF"), 0, 0, 0, 0, ...new TextEncoder().encode("WEBP")]);
  it("accepts photos whose contents match their type", async () => {
    expect((await readProductImage(new File([png], "a.png", { type: "image/png" })))?.ext).toBe("png");
    expect((await readProductImage(new File([webp], "a.webp", { type: "image/webp" })))?.ext).toBe("webp");
  });
  it("rejects other types, disguised files, empty and oversized files", async () => {
    expect(await readProductImage(new File(["<svg/>"], "a.svg", { type: "image/svg+xml" }))).toBeNull();
    expect(await readProductImage(new File(["MZ not a png"], "a.png", { type: "image/png" }))).toBeNull();
    expect(await readProductImage(new File([], "a.png", { type: "image/png" }))).toBeNull();
    expect(await readProductImage(new File([png, new Uint8Array(5 * 1024 * 1024)], "a.png", { type: "image/png" }))).toBeNull();
  });
});
