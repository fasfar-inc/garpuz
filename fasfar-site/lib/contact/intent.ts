"use client";

import { contactCategories, type ContactCategoryId } from "@/content/finale";

/**
 * The contact category a visitor has already shown interest in (by opening
 * a path in Scene 7's network), so the contact panel can start there. Kept
 * for the tab's session; storage failures are ignored.
 */
const KEY = "fasfar:contact-intent";
let intent: ContactCategoryId | null = null;
let loaded = false;

export function setContactIntent(value: ContactCategoryId | null) {
  intent = value;
  loaded = true;
  try {
    if (value) sessionStorage.setItem(KEY, value);
    else sessionStorage.removeItem(KEY);
  } catch {}
}

export function getContactIntent(): ContactCategoryId | null {
  if (!loaded) {
    loaded = true;
    try {
      const stored = sessionStorage.getItem(KEY);
      intent = contactCategories.find((c) => c.id === stored)?.id ?? null;
    } catch {}
  }
  return intent;
}
