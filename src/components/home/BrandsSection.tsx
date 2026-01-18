const brandLogos = [
  { name: "Kevin Murphy", text: "KEVIN.MURPHY" },
  { name: "AIIR", text: "AIIR" },
  { name: "Nutrafol", text: "NUTRAFOL" },
  { name: "Drop Dead Professional", text: "DROP DEAD PROFESSIONAL" },
  { name: "Danger Jones", text: "DANGER JONES" },
];

export function BrandsSection() {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto" style={{ paddingLeft: 'calc(1.5rem + 6px)', paddingRight: 'calc(1.5rem + 6px)' }}>
        <div className="flex items-center">
          {/* Left side text with divider */}
          <div className="flex-shrink-0 pr-6 md:pr-10 flex items-center">
            <div className="max-w-[180px] md:max-w-[200px]">
              <p 
                className="text-xs md:text-sm tracking-[0.02em] text-foreground/80 leading-relaxed"
                style={{ fontFamily: "'Aeonik Pro', sans-serif" }}
              >
                Our favorite brands
                <br />
                we love to use in the
                <br />
                salon
              </p>
            </div>
            {/* Vertical divider */}
            <div className="ml-6 md:ml-10 h-16 md:h-20 w-px bg-foreground/30" />
          </div>

          {/* Scrolling logos container with mask */}
          <div 
            className="flex-1 overflow-hidden relative"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 100%)',
            }}
          >
            <div className="flex animate-marquee hover:[animation-play-state:paused]">
              {/* First set */}
              {brandLogos.map((brand, index) => (
                <span
                  key={index}
                  className="text-lg md:text-xl lg:text-2xl font-medium tracking-[0.1em] text-foreground whitespace-nowrap uppercase flex-shrink-0 px-8 md:px-14 lg:px-18"
                  style={{ fontFamily: "'Termina', sans-serif" }}
                >
                  {brand.text}
                </span>
              ))}
              {/* Duplicate set for seamless loop */}
              {brandLogos.map((brand, index) => (
                <span
                  key={`dup-${index}`}
                  className="text-lg md:text-xl lg:text-2xl font-medium tracking-[0.1em] text-foreground whitespace-nowrap uppercase flex-shrink-0 px-8 md:px-14 lg:px-18"
                  style={{ fontFamily: "'Termina', sans-serif" }}
                  aria-hidden="true"
                >
                  {brand.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
