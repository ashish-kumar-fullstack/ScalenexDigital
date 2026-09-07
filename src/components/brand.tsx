import Link from "next/link";
import Image from "next/image";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="ScaleNex Digital home">
      <span className="brand-logo-window">
        <Image
          src="/brand/scalenex-digital-logo.png"
          alt="ScaleNex Digital — Growth Acceleration"
          width={669}
          height={373}
          className="brand-logo-image"
          sizes="290px"
          preload
        />
      </span>
    </Link>
  );
}
