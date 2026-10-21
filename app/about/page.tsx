import type { Metadata } from "next";
import { ContentPage, type Section } from "@/components/content-page";
import { getLocale } from "@/lib/i18n/server";
import { CONTACT_EMAIL } from "@/lib/site";

const content = {
  en: {
    title: "About Garpuz",
    intro: "Garpuz is a product search engine for North Cyprus. Type what you are looking for and see which local shops have it, at what price, and contact them directly on WhatsApp.",
    sections: [
      { heading: "For shoppers", body: ["Searching is free and never needs an account. Results only include listings from shops that an administrator has reviewed and approved, and you can sort by price and filter by city, brand, condition and availability.", "Garpuz does not sell anything itself. When you find a product, you talk to the shop directly to confirm the price and arrange the purchase."] },
      { heading: "For shops", body: ["Shops sign in with Google, add their details and verification document, and list products from the shared Garpuz catalog — one at a time or by importing a CSV file. Listings become searchable once the shop is approved.", "Listing your shop is free."] },
      { heading: "Contact", body: [`Questions, product requests or feedback: ${CONTACT_EMAIL}.`] },
    ] as Section[],
  },
  tr: {
    title: "Garpuz hakkında",
    intro: "Garpuz, Kuzey Kıbrıs için bir ürün arama motorudur. Aradığınız ürünü yazın; hangi yerel mağazalarda, hangi fiyata bulunduğunu görün ve mağazayla doğrudan WhatsApp üzerinden iletişime geçin.",
    sections: [
      { heading: "Alışveriş yapanlar için", body: ["Arama ücretsizdir ve hiçbir zaman hesap gerektirmez. Sonuçlarda yalnızca bir yönetici tarafından incelenip onaylanmış mağazaların ilanları yer alır; fiyata göre sıralayabilir, şehir, marka, durum ve stoka göre filtreleyebilirsiniz.", "Garpuz kendisi satış yapmaz. Bir ürün bulduğunuzda fiyatı teyit etmek ve satın almayı ayarlamak için doğrudan mağazayla konuşursunuz."] },
      { heading: "Mağazalar için", body: ["Mağazalar Google ile giriş yapar, bilgilerini ve doğrulama belgesini ekler ve ortak Garpuz kataloğundaki ürünleri tek tek ya da CSV dosyasıyla listeler. Mağaza onaylandığında ilanlar aramada görünür.", "Mağazanızı listelemek ücretsizdir."] },
      { heading: "İletişim", body: [`Sorular, ürün talepleri veya geri bildirim için: ${CONTACT_EMAIL}.`] },
    ] as Section[],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: content[await getLocale()].title };
}

export default async function AboutPage() {
  return <ContentPage {...content[await getLocale()]} />;
}
