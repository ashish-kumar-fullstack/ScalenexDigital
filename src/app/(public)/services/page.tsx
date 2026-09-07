import PublicPage, {
  generateMetadata as meta,
} from "@/components/pages/public-page";
export const generateMetadata = () =>
  meta({ params: Promise.resolve({ slug: "services" }) });
export default function Page() {
  return <PublicPage params={Promise.resolve({ slug: "services" })} />;
}
