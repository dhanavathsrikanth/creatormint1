import { ExternalLink } from "lucide-react";

interface CustomLinkBlockProps {
  block: {
    config?: {
      label?: string;
      url?: string;
      style?: "button" | "card";
    };
  };
}

export function CustomLinkBlock({ block }: CustomLinkBlockProps) {
  const label = block.config?.label;
  const url = block.config?.url;
  const style = block.config?.style ?? "button";

  if (!label || !url) return null;

  // Ensure URL has protocol
  const href = url.startsWith("http") ? url : `https://${url}`;

  if (style === "card") {
    return (
      <section className="custom-link-block">
        <a href={href} target="_blank" rel="noopener noreferrer" className="custom-link-card">
          <span className="custom-link-label">{label}</span>
          <ExternalLink size={16} />
        </a>
      </section>
    );
  }

  return (
    <section className="custom-link-block">
      <a href={href} target="_blank" rel="noopener noreferrer" className="btn-primary custom-link-button">
        {label} <ExternalLink size={14} />
      </a>
    </section>
  );
}
