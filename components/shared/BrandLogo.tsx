import Image from "next/image";

type BrandLogoVariant = "compact" | "hero";
type BrandLogoSize = "header" | "sidebar";

export function BrandLogo({
  variant = "compact",
  size = "header",
  showText = false,
  textClassName,
  className,
  priority = false,
}: {
  variant?: BrandLogoVariant;
  size?: BrandLogoSize;
  showText?: boolean;
  textClassName?: string;
  className?: string;
  priority?: boolean;
}) {
  const isHero = variant === "hero";
  const compactSize = size === "sidebar" ? 42 : 44;

  return (
    <span className={className}>
      <Image
        src={isHero ? "/logo.png" : "/logo44.png"}
        alt="Emotion Lab"
        width={isHero ? 300 : compactSize}
        height={isHero ? 300 : compactSize}
        className={isHero ? "brand-logo-hero-img" : `brand-logo-compact-img brand-logo-${size}-img`}
        priority={priority}
        unoptimized
      />
      {showText ? <span className={textClassName}>Emotion Lab</span> : null}
    </span>
  );
}
