import { motion } from "framer-motion";

export function AboutHero() {
  return (
    <section className="pt-32 pb-16 md:pt-40 md:pb-24 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-4xl mx-auto text-center"
        >
          <span className="inline-block text-xs uppercase tracking-[0.25em] text-muted-foreground mb-6">
            Our Story
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display mb-6 leading-tight">
            More Than a Salon—
            <br />
            <span className="text-foreground/70">A Movement</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/60 max-w-2xl mx-auto leading-relaxed">
            Drop Dead was born from a belief that great hair should come with an 
            unforgettable experience. We're redefining what it means to feel beautiful.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
