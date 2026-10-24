import { describe, expect, it } from "vitest";
import { listingSchema } from "@/lib/validation";

const listing = { price: "1.499,9", currency: "TRY", condition: "new", availability: "in_stock", sku: "" };

describe("listingSchema", () => {
  it("accepts a catalog product by id", () => {
    const parsed = listingSchema.parse({ ...listing, price: "1499.9", mode: "existing", productId: "8f14e45f-ceea-4e7d-a9b2-1c3d4e5f6a7b" });
    expect(parsed).toMatchObject({ mode: "existing", price: 1499.9, sku: null });
  });
  it("tidies a new product's text and treats a blank model as none", () => {
    const parsed = listingSchema.parse({ ...listing, price: "20", mode: "new", brand: "  Acme ", name: "Kettle   Pro  2", model: "  ", category: "Home Appliances" });
    expect(parsed).toMatchObject({ mode: "new", brand: "Acme", name: "Kettle Pro 2", model: null, category: "Home Appliances" });
  });
  it("names the field that is wrong", () => {
    const issue = (input: object) => listingSchema.safeParse(input).error?.issues[0]?.path[0];
    expect(issue({ ...listing, price: "20", mode: "new", brand: "Acme", name: "K", model: "", category: "Home Appliances" })).toBe("name");
    expect(issue({ ...listing, price: "20", mode: "new", brand: "Acme", name: "Kettle", model: "", category: "Spaceships" })).toBe("category");
    expect(issue({ ...listing, price: "-1", mode: "existing", productId: "8f14e45f-ceea-4e7d-a9b2-1c3d4e5f6a7b" })).toBe("price");
    expect(issue({ ...listing, price: "20", mode: "existing", productId: "nope" })).toBe("productId");
  });
});
