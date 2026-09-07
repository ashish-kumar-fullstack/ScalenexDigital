import PublicPage, {
  generateMetadata as meta,
} from "@/components/pages/public-page";
import { headers } from "next/headers";
import { appUrl } from "@/lib/env";
export const generateMetadata = () =>
  meta({ params: Promise.resolve({ slug: "contact" }) });
export default async function Page() {
  const nonce = (await headers()).get("x-nonce") || undefined;
  const schema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact ScaleNex Digital",
    url: appUrl() + "/contact",
    mainEntity: {
      "@type": "Organization",
      name: "ScaleNex Digital",
      email: "scalenexdigital@gmail.com",
      telephone: "+916398520345",
    },
  };
  return (
    <>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
      <PublicPage params={Promise.resolve({ slug: "contact" })} />
    </>
  );
}
