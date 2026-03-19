import type { Profile } from "@/types/database";
import { Instagram, Twitter, Youtube, Globe } from "lucide-react";

interface HeroBlockProps {
  block: {
    config?: {
      layout?: "centred" | "left" | "fullbleed" | "editorial";
      showTagline?: boolean;
      showSocials?: boolean;
      tagline?: string;
    };
  };
  profile: Pick<Profile, "full_name" | "store_name" | "store_description" | "avatar_url" | "social_links">;
}

export function HeroBlock({ block, profile }: HeroBlockProps) {
  const layout = block.config?.layout ?? "centred";
  const tagline = block.config?.tagline || profile.store_description;
  const showSocials = block.config?.showSocials !== false;
  const showTagline = block.config?.showTagline !== false;

  const socials = (profile.social_links ?? {}) as Record<string, string>;

  const Avatar = () =>
    profile.avatar_url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={profile.avatar_url} alt={profile.store_name ?? "Creator"} className="hero-avatar" />
    ) : (
      <div className="hero-avatar-placeholder">
        {(profile.store_name ?? profile.full_name ?? "C")[0].toUpperCase()}
      </div>
    );

  const Content = () => (
    <div className="hero-content">
      <h1 className="hero-name">{profile.store_name ?? profile.full_name}</h1>
      {showTagline && tagline && <p className="hero-tagline">{tagline}</p>}
      {showSocials && (
        <div className="hero-socials">
          {socials.instagram && (
            <a href={socials.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram size={18} />
            </a>
          )}
          {socials.twitter && (
            <a href={socials.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <Twitter size={18} />
            </a>
          )}
          {socials.youtube && (
            <a href={socials.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <Youtube size={18} />
            </a>
          )}
          {socials.website && (
            <a href={socials.website} target="_blank" rel="noopener noreferrer" aria-label="Website">
              <Globe size={18} />
            </a>
          )}
        </div>
      )}
    </div>
  );

  if (layout === "left") {
    return (
      <section className="hero-block hero-layout-left">
        <div className="hero-inner">
          <Avatar />
          <Content />
        </div>
      </section>
    );
  }

  if (layout === "fullbleed") {
    return (
      <section className="hero-block hero-layout-fullbleed">
        <div className="hero-fullbleed-overlay" />
        <div className="hero-inner">
          <Avatar />
          <Content />
        </div>
      </section>
    );
  }

  if (layout === "editorial") {
    return (
      <section className="hero-block hero-layout-editorial">
        <div className="hero-inner">
          <Content />
          <Avatar />
        </div>
      </section>
    );
  }

  // Default: centred
  return (
    <section className="hero-block hero-layout-centred">
      <div className="hero-inner">
        <Avatar />
        <Content />
      </div>
    </section>
  );
}
