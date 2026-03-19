import type { Profile } from "@/types/database";

interface AboutBlockProps {
  block: {
    config?: {
      content?: string;
      heading?: string;
      showPhoto?: boolean;
    };
  };
  profile: Pick<Profile, "full_name" | "store_name" | "avatar_url">;
}

export function AboutBlock({ block, profile }: AboutBlockProps) {
  const content = block.config?.content;
  const heading = block.config?.heading ?? "About me";
  const showPhoto = block.config?.showPhoto === true;

  if (!content) return null;

  return (
    <section className="about-block">
      <div className={`about-inner ${showPhoto ? "about-with-photo" : ""}`}>
        {showPhoto && profile.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.store_name ?? profile.full_name ?? "Creator"}
            className="about-avatar"
          />
        )}
        <div className="about-content">
          <h2 className="about-heading">{heading}</h2>
          <div className="about-text">
            {content.split("\n").filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
