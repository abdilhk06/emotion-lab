import Image from "next/image";

type BrandLogoVariant = "compact" | "hero";

export function BrandLogo({
  variant = "compact",
  showText = false,
  textClassName,
  className,
  priority = false,
}: {
  variant?: BrandLogoVariant;
  showText?: boolean;
  textClassName?: string;
  className?: string;
  priority?: boolean;
}) {
  const isHero = variant === "hero";

  return (
    <span className={className}>
      <Image
        src={isHero ? "/logo.png" : "/logo32.png"}
        alt="Emotion Lab"
        width={isHero ? 240 : 32}
        height={isHero ? 240 : 32}
        className={isHero ? "brand-logo-hero-img" : "brand-logo-compact-img"}
        priority={priority}
      />
      {showText ? <span className={textClassName}>Emotion Lab</span> : null}
    </span>
  );
}
