import { CSV_TEMPLATE } from "@/lib/csv";

export function GET() {
  // BOM so Excel opens Turkish characters correctly.
  return new Response(`﻿${CSV_TEMPLATE}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="garpuz-products-template.csv"',
      "cache-control": "public, max-age=3600",
    },
  });
}
