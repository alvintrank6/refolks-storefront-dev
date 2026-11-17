"use client";

import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import en from "../messages/en.json";
import vi from "../messages/vi.json";
import type { Lang } from "../refolks/data";

export function LocaleProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: Lang;
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "vi" ? vi : en}
    >
      {children}
    </NextIntlClientProvider>
  );
}
