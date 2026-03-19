interface TestimonialsBlockProps {
  block: {
    config?: {
      testimonials?: { quote: string; name: string; handle?: string }[];
    };
  };
}

export function TestimonialsBlock({ block }: TestimonialsBlockProps) {
  const testimonials = block.config?.testimonials ?? [];
  if (testimonials.length === 0) return null;

  return (
    <section className="testimonials-block">
      <h2 className="block-heading">What people say</h2>
      <div className="testimonials-grid">
        {testimonials.map((t, i) => (
          <div key={i} className="testimonial-card">
            <p className="testimonial-quote">"{t.quote}"</p>
            <div className="testimonial-author">
              <span className="testimonial-name">{t.name}</span>
              {t.handle && <span className="testimonial-handle">@{t.handle}</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
