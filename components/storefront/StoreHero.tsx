import type { Profile } from "@/types/database";
import { Package } from "lucide-react";

interface StoreHeroProps {
  profile: Pick<Profile, "store_name" | "full_name" | "store_description" | "avatar_url" | "store_accent_color" | "total_sales">;
  productCount: number;
}

export function StoreHero({ profile, productCount }: StoreHeroProps) {
  const displayName = profile.store_name ?? profile.full_name ?? "Creator";
  const accentColor = profile.store_accent_color ?? "#3ECF8E";

  return (
    <header
      className="bg-white border-b border-gray-100"
      style={{ borderTop: `4px solid ${accentColor}` }}
    >
      <div className="max-w-5xl mx-auto px-6 py-14 flex flex-col items-center text-center">
        {/* Avatar */}
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md mb-5"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white border-4 border-white shadow-md mb-5"
            style={{ backgroundColor: accentColor }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Store name */}
        <h1
          className="text-4xl font-black text-gray-900 tracking-tight leading-tight"
          style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
        >
          {displayName}
        </h1>

        {/* Description */}
        {profile.store_description && (
          <p className="mt-3 text-gray-500 max-w-lg text-balance leading-relaxed">
            {profile.store_description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-6 mt-5 text-sm text-gray-400">
          <div className="flex items-center gap-1.5">
            <Package className="w-4 h-4" />
            <span>
              <strong className="text-gray-700">{productCount}</strong>{" "}
              product{productCount !== 1 ? "s" : ""}
            </span>
          </div>
          {profile.total_sales > 0 && (
            <div className="flex items-center gap-1">
              <span>🎉</span>
              <span>
                <strong className="text-gray-700">{profile.total_sales.toLocaleString("en-IN")}</strong>{" "}
                happy buyer{profile.total_sales !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
