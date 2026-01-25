import { Link } from "react-router-dom";
import { ArrowUpRight, Phone } from "lucide-react";
import { useActiveLocations } from "@/hooks/useLocations";

export function FooterCTA() {
  const { data: locations = [] } = useActiveLocations();

  return (
    <section 
      className="relative z-10 bg-secondary text-foreground py-24 lg:py-32 text-center"
      data-theme="light"
    >
      <div className="container mx-auto px-6 lg:px-12">
        {/* Eyebrow */}
        <p className="text-foreground/50 text-xs uppercase tracking-[0.2em] font-display mb-6">
          Ready for Something Different?
        </p>

        {/* Main headline */}
        <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-foreground mb-6">
          Book Your Consult
        </h2>

        {/* Description */}
        <p className="text-foreground/60 text-base md:text-lg font-sans font-light max-w-xl mx-auto mb-10">
          Every great transformation begins with a conversation. Let's plan yours.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center justify-center gap-4">
          <Link
            to="/booking"
            className="group inline-flex items-center gap-3 px-8 py-4 text-base font-sans font-medium bg-foreground text-background rounded-full hover:bg-foreground/90 transition-all duration-300 active:scale-[0.98]"
          >
            <span>Book consult</span>
            <ArrowUpRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          {/* Phone numbers */}
          <div className="flex items-center gap-2 text-foreground/50">
            <span className="text-sm font-sans">or call</span>
            {locations.map((loc, index) => (
              <span key={loc.name} className="inline-flex items-center">
                <a
                  href={`tel:${loc.phone.replace(/[^0-9]/g, "")}`}
                  className="inline-flex items-center gap-1.5 text-sm font-sans text-foreground/70 hover:text-foreground transition-colors"
                >
                  <Phone size={14} />
                  <span>{loc.name}</span>
                </a>
                {index < locations.length - 1 && <span className="mx-2 text-foreground/30">·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
