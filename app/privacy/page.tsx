import type { Metadata } from "next";
import { ContentPage, type Section } from "@/components/content-page";
import { getLocale } from "@/lib/i18n/server";
import { CONTACT_EMAIL } from "@/lib/site";

const content = {
  en: {
    title: "Privacy notice",
    updated: "Last updated: 21 October 2026",
    intro: "This notice explains what information Garpuz collects, why, and who processes it. We collect as little as the service needs.",
    sections: [
      { heading: "Visitors", body: ["You can search without an account. We record the text of each new search, how many results it returned and when it happened, so we can see which products people look for. We also record when a WhatsApp button is clicked, together with the listing, shop and product it belongs to. These records do not include your name, account or IP address.", "To protect the service from abuse, your IP address is checked against short-lived rate limits by our hosting provider. It is not stored in our database."] },
      { heading: "Shops", body: ["When a shop signs up we receive the email address of its Google account. Shops then provide business details such as shop name, contact person, phone and WhatsApp numbers, city, address, website and registration number, and may upload a verification document.", "Shop name, city, website, WhatsApp number and listings are shown publicly once the shop is approved. Verification documents are kept in private storage and are only visible to Garpuz administrators."] },
      { heading: "Cookies", body: ["We use a cookie to remember your language choice. Shops and administrators who sign in also receive session cookies that keep them signed in. We do not use advertising or third-party tracking cookies."] },
      { heading: "Service providers", body: ["Garpuz is hosted on Cloudflare. Our database, sign-in and file storage are provided by Supabase. Shop sign-in uses Google. These providers process data on our behalf to run the service.", "When you contact a shop on WhatsApp, that conversation is between you, the shop and WhatsApp, and is not seen by Garpuz."] },
      { heading: "Your choices", body: [`Shops can update their details at any time from the dashboard. To request a copy or deletion of your data, email ${CONTACT_EMAIL}.`] },
    ] as Section[],
  },
  tr: {
    title: "Gizlilik bildirimi",
    updated: "Son güncelleme: 21 Ekim 2026",
    intro: "Bu bildirim, Garpuz’un hangi bilgileri neden topladığını ve bunları kimin işlediğini açıklar. Yalnızca hizmetin ihtiyaç duyduğu kadar bilgi toplarız.",
    sections: [
      { heading: "Ziyaretçiler", body: ["Hesap açmadan arama yapabilirsiniz. İnsanların hangi ürünleri aradığını görebilmek için her yeni aramanın metnini, kaç sonuç döndüğünü ve zamanını kaydederiz. Bir WhatsApp düğmesine tıklandığında da bunu, ait olduğu ilan, mağaza ve ürünle birlikte kaydederiz. Bu kayıtlar adınızı, hesabınızı veya IP adresinizi içermez.", "Hizmeti kötüye kullanıma karşı korumak için IP adresiniz barındırma sağlayıcımız tarafından kısa süreli istek sınırlarıyla karşılaştırılır. Veritabanımızda saklanmaz."] },
      { heading: "Mağazalar", body: ["Bir mağaza kaydolduğunda Google hesabının e-posta adresini alırız. Mağazalar daha sonra mağaza adı, iletişim kişisi, telefon ve WhatsApp numaraları, şehir, adres, web sitesi ve sicil numarası gibi işletme bilgilerini girer ve bir doğrulama belgesi yükleyebilir.", "Mağaza onaylandığında mağaza adı, şehir, web sitesi, WhatsApp numarası ve ilanlar herkese açık olarak gösterilir. Doğrulama belgeleri özel depolamada tutulur ve yalnızca Garpuz yöneticileri tarafından görülebilir."] },
      { heading: "Çerezler", body: ["Dil tercihinizi hatırlamak için bir çerez kullanırız. Giriş yapan mağazalar ve yöneticiler, oturumlarını açık tutan oturum çerezleri de alır. Reklam veya üçüncü taraf izleme çerezleri kullanmayız."] },
      { heading: "Hizmet sağlayıcılar", body: ["Garpuz, Cloudflare üzerinde barındırılır. Veritabanımız, giriş sistemimiz ve dosya depolamamız Supabase tarafından sağlanır. Mağaza girişi Google ile yapılır. Bu sağlayıcılar hizmeti çalıştırmak için verileri bizim adımıza işler.", "Bir mağazayla WhatsApp üzerinden iletişime geçtiğinizde bu yazışma sizinle mağaza ve WhatsApp arasındadır ve Garpuz tarafından görülmez."] },
      { heading: "Seçenekleriniz", body: [`Mağazalar bilgilerini panelden istedikleri zaman güncelleyebilir. Verilerinizin bir kopyasını veya silinmesini talep etmek için ${CONTACT_EMAIL} adresine yazın.`] },
    ] as Section[],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: content[await getLocale()].title };
}

export default async function PrivacyPage() {
  return <ContentPage {...content[await getLocale()]} />;
}
