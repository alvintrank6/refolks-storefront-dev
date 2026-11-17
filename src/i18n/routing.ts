import { defineRouting } from "next-intl/routing";

/** Shared pathname contract for all five storefront locales. */
export const routing = defineRouting({
  locales: ["en", "vi", "ko", "ja", "zh-CN"],
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: false,
  pathnames: {
    "/": "/",
    "/shop": { en: "/shop", vi: "/cua-hang", ko: "/shop", ja: "/shop", "zh-CN": "/shop" },
    "/craft": { en: "/craft", vi: "/thu-cong", ko: "/craft", ja: "/craft", "zh-CN": "/craft" },
    "/donation-event": { en: "/donation-event", vi: "/su-kien-quyen-gop", ko: "/donation-event", ja: "/donation-event", "zh-CN": "/donation-event" },
    "/about": { en: "/about", vi: "/ve-chung-toi", ko: "/about", ja: "/about", "zh-CN": "/about" },
    "/studio": "/studio",
    "/cart": { en: "/cart", vi: "/gio-hang", ko: "/cart", ja: "/cart", "zh-CN": "/cart" },
    "/checkout": { en: "/checkout", vi: "/thanh-toan", ko: "/checkout", ja: "/checkout", "zh-CN": "/checkout" },
    "/contact": { en: "/contact", vi: "/lien-he", ko: "/contact", ja: "/contact", "zh-CN": "/contact" },
    "/products/[handle]": {
      en: "/products/[handle]",
      vi: "/san-pham/[handle]",
      ko: "/products/[handle]",
      ja: "/products/[handle]",
      "zh-CN": "/products/[handle]",
    },
  },
});
