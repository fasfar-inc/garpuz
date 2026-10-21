import type { Metadata } from "next";
import { ContentPage, type Section } from "@/components/content-page";
import { getLocale } from "@/lib/i18n/server";
import { CONTACT_EMAIL } from "@/lib/site";

const content = {
  en: {
    title: "Terms of use",
    updated: "Last updated: 21 October 2026",
    intro: "By using Garpuz you agree to these terms. If you do not agree, please do not use the service.",
    sections: [
      { heading: "What Garpuz is", body: ["Garpuz is a search directory of products offered by independent local shops. Garpuz is not a party to any sale. Purchases, payment, delivery, returns and warranties are agreed directly between you and the shop."] },
      { heading: "Listings and prices", body: ["Prices, stock and product details are provided by shops and may change. Always confirm them with the shop before buying. We review shops before their listings appear, but we cannot guarantee that every listing is accurate or up to date."] },
      { heading: "Shop responsibilities", body: ["Shops must provide truthful business information, only list products they actually offer, keep prices and availability current, and comply with applicable laws, including consumer protection rules.", "We may decline, suspend or remove a shop or listing that breaks these terms, misleads customers or harms the service."] },
      { heading: "Acceptable use", body: ["Do not scrape the service at scale, interfere with its operation, attempt to access accounts or data that are not yours, or use it to send spam."] },
      { heading: "Liability", body: ["The service is provided as is. To the extent permitted by law, Garpuz is not liable for transactions between shoppers and shops or for losses arising from inaccurate listings."] },
      { heading: "Contact", body: [`Questions about these terms: ${CONTACT_EMAIL}.`] },
    ] as Section[],
  },
  tr: {
    title: "Kullanım koşulları",
    updated: "Son güncelleme: 21 Ekim 2026",
    intro: "Garpuz’u kullanarak bu koşulları kabul etmiş olursunuz. Kabul etmiyorsanız lütfen hizmeti kullanmayın.",
    sections: [
      { heading: "Garpuz nedir", body: ["Garpuz, bağımsız yerel mağazaların sunduğu ürünlerin arama rehberidir. Garpuz hiçbir satışın tarafı değildir. Satın alma, ödeme, teslimat, iade ve garanti doğrudan sizinle mağaza arasında kararlaştırılır."] },
      { heading: "İlanlar ve fiyatlar", body: ["Fiyatlar, stok durumu ve ürün bilgileri mağazalar tarafından sağlanır ve değişebilir. Satın almadan önce her zaman mağazayla teyit edin. Mağazaları ilanları görünmeden önce inceleriz, ancak her ilanın doğru veya güncel olduğunu garanti edemeyiz."] },
      { heading: "Mağazaların sorumlulukları", body: ["Mağazalar doğru işletme bilgileri vermeli, yalnızca gerçekten sundukları ürünleri listelemeli, fiyat ve stok bilgilerini güncel tutmalı ve tüketici koruma kuralları dahil yürürlükteki mevzuata uymalıdır.", "Bu koşulları ihlal eden, müşterileri yanıltan veya hizmete zarar veren bir mağazayı ya da ilanı reddedebilir, askıya alabilir veya kaldırabiliriz."] },
      { heading: "Kabul edilebilir kullanım", body: ["Hizmetten büyük ölçekte veri kazımayın, işleyişine müdahale etmeyin, size ait olmayan hesaplara veya verilere erişmeye çalışmayın ve hizmeti istenmeyen mesaj göndermek için kullanmayın."] },
      { heading: "Sorumluluk", body: ["Hizmet olduğu gibi sunulur. Yasaların izin verdiği ölçüde Garpuz, alışveriş yapanlarla mağazalar arasındaki işlemlerden veya hatalı ilanlardan doğan kayıplardan sorumlu değildir."] },
      { heading: "İletişim", body: [`Bu koşullarla ilgili sorular için: ${CONTACT_EMAIL}.`] },
    ] as Section[],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: content[await getLocale()].title };
}

export default async function TermsPage() {
  return <ContentPage {...content[await getLocale()]} />;
}
