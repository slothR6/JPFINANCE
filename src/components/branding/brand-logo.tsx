import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoVariant = "lockup" | "mark";

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

const brandImages: Record<
  BrandLogoVariant,
  {
    src: string;
    alt: string;
    defaultClassName: string;
    defaultSizes: string;
  }
> = {
  lockup: {
    src: "/branding/jpfinance-logo-lockup.png",
    alt: "JPFINANCE",
    defaultClassName: "h-32 w-72 rounded-2xl shadow-soft ring-1 ring-white/10",
    defaultSizes: "(max-width: 640px) 288px, 320px",
  },
  mark: {
    src: "/branding/jpfinance-mark.png",
    alt: "Simbolo JPFINANCE",
    defaultClassName: "h-9 w-9 rounded-xl shadow-sm ring-1 ring-white/10",
    defaultSizes: "36px",
  },
};

export function BrandLogo({
  variant = "lockup",
  className,
  priority = false,
  sizes,
}: BrandLogoProps) {
  const image = brandImages[variant];

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-[#071f20]",
        image.defaultClassName,
        className,
      )}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority={priority}
        sizes={sizes ?? image.defaultSizes}
        className="object-cover"
      />
    </div>
  );
}
