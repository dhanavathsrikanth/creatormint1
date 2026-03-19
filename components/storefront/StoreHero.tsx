import type { Profile } from "@/types/database";
import { Package } from "lucide-react";

interface StoreHeroProps {
  profile: Pick<Profile, "store_name" | "full_name" | "store_description" | "avatar_url" | "store_accent_color" | "total_sales">;
  productCount: number;
}

export function StoreHero({ profile, productCount }: StoreHeroProps) {
  const displayName = profile.store_name ?? profile.full_name ?? "Creator";
  const accentColor = profile.store_accent_color ?? "#000000";

  return (
    <div className="relative overflow-hidden bg-white border-b border-gray-100">
      {/* Decorative premium gradient header */}
      <div 
        className="absolute inset-x-0 top-0 h-40 opacity-20 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, ${accentColor}, transparent)`
        }}
      />
      
      <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16 flex flex-col items-center text-center z-10">
        {/* Avatar */}
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="w-24 h-24 rounded-full object-cover shadow-xl ring-4 ring-white mb-6 hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-xl ring-4 ring-white mb-6 hover:scale-105 transition-transform duration-300"
            style={{ backgroundColor: accentColor }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Store name */}
        <h1
          className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight"
          style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
        >
          {displayName}
        </h1>

        {/* Description */}
        {profile.store_description && (
          <p className="mt-4 text-gray-500 text-lg max-w-xl text-balance leading-relaxed">
            {profile.store_description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-6 mt-8 text-sm text-gray-500 font-medium">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
            <Package className="w-4 h-4" style={{ color: accentColor }} />
            <span>{productCount} product{productCount !== 1 ? "s" : ""}</span>
          </div>
          {profile.total_sales > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
              <span style={{ color: accentColor }}>★</span>
              <span>{profile.total_sales.toLocaleString("en-IN")} sales</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
