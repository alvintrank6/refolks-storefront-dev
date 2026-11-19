import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RefolksExperience } from "../../../src/components/RefolksExperience";
import { copy, localize, locales, products, translate, type Lang } from "../../../src/refolks/data";
import { absoluteUrl } from "../../../src/lib/seo";

type Props = {
  params: Promise<{ locale: string; slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
const isLocale = (value: string): value is Lang => locales.includes(value as Lang);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug = [] } = await params;
  if (!isLocale(locale)) return {};
  const pageCopy = locale === "vi" ? copy.vi : locale === "en" ? copy.en : localize(copy.en, locale);
  const section = slug[0] ?? "";
  const product = products.find((p) => p.id === slug[1]);
  const title =
    product?.name[locale] ??
    (["shop", "cua-hang", "women", "men", "collections", "gifts"].includes(
      section,
    )
      ? pageCopy.shopTitle
      : section === "accessories" ? locale === "vi" ? "Phụ kiện & Quà tặng" : translate("Accessories & Gifts", locale)
      : ["huong-dan-phoi-do", "styling-guide"].includes(section) ? locale === "vi" ? "Hướng dẫn phối đồ" : translate("Styling guide", locale)
      : ["huong-dan-bao-quan", "care-guide"].includes(section) ? locale === "vi" ? "Hướng dẫn bảo quản" : translate("Care guide", locale)
      : ["contact", "lien-he"].includes(section) ? locale === "vi" ? "Liên hệ" : translate("Contact", locale)
      : [
            "community",
            "cong-dong",
            "donation-event",
            "su-kien-quyen-gop",
          ].includes(section)
        ? pageCopy.communityTitle
        : ["about", "ve-chung-toi", "craft", "thu-cong"].includes(section)
          ? pageCopy.aboutTitle
          : ["journal", "news", "tin-tuc"].includes(section)
            ? locale === "vi"
              ? "Tin tức & sự kiện mới nhất"
              : translate("Latest news & events", locale)
            : pageCopy.heroTitle);
  const description =
    product?.short[locale] ??
    (section === "shop" || section === "cua-hang"
      ? pageCopy.shopIntro
      : pageCopy.heroSub);
  const suffix = slug.length ? `/${slug.join("/")}` : "";
  const path = `/${locale}${suffix}`;
  const privatePage = [
    "account",
    "checkout",
    "cart",
    "orders",
    "tai-khoan",
    "thanh-toan",
    "gio-hang",
    "don-hang",
    "admin",
    "quan-tri",
  ].includes(section);
  return {
    title: `${title} | Refolks`,
    description,
    robots: privatePage
      ? { index: false, follow: false }
      : { index: true, follow: true },
    alternates: {
      canonical: absoluteUrl(path),
      languages: Object.fromEntries(locales.map((language) => [language, absoluteUrl(`/${language}${suffix}`)])),
    },
    openGraph: {
      siteName: "Refolks",
      title,
      description,
      images: product && product.images.length === 0 ? [] : [
        {
          url: product?.images[0] ?? "/images/refolks/tote-02-lifestyle.webp",
          width: 1200,
          height: 900,
          alt: title,
        },
      ],
    },
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { locale, slug = [] } = await params;
  if (!isLocale(locale)) notFound();
  const known = new Set(["shop","cua-hang","women","men","collections","gifts","accessories","products","san-pham","community","cong-dong","donation-event","su-kien-quyen-gop","about","ve-chung-toi","craft","thu-cong","journal","news","tin-tuc","account","tai-khoan","orders","don-hang","cart","gio-hang","checkout","thanh-toan","huong-dan-phoi-do","styling-guide","huong-dan-bao-quan","care-guide","contact","lien-he","admin","quan-tri"]);
  if (slug[0] && !known.has(slug[0])) notFound();
  if (["products","san-pham"].includes(slug[0]) && !products.some((p)=>p.id===slug[1])) notFound();
  if (slug[0]==="collections" && slug[1]!=="heritage-in-motion") notFound();
  const query = new URLSearchParams(
    Object.entries(await searchParams).flatMap(([key, value]) =>
      typeof value === "string" ? [[key, value]] : [],
    ),
  ).toString();
  return (
    <RefolksExperience
      initialLocale={locale}
      initialPath={`/${locale}${slug.length ? `/${slug.join("/")}` : ""}`}
      initialQuery={query}
    />
  );
}
