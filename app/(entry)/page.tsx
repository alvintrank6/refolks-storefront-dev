import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { locales, type Lang } from "../../src/refolks/data";

export default async function Index() {
  const selected = (await cookies()).get("refolks-lang")?.value;
  redirect(`/${locales.includes(selected as Lang) ? selected : "en"}`);
}
