import { defaultLocale, localeMeta } from "@/i18n/locales";
import { localePath } from "@/i18n/paths";

export default function NotFound() {
  const meta = localeMeta[defaultLocale];
  const home = localePath(defaultLocale);
  return (
    <html lang={meta.htmlLang} dir={meta.dir}>
      <body>
        <p>
          Not found. <a href={home}>4Airdrops</a>
        </p>
      </body>
    </html>
  );
}
