import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const drinks = [
  {
    id: 1,
    name: "Tropical Death",
    colors: "from-purple-400 via-pink-400 to-purple-600",
  },
  {
    id: 2,
    name: "Creme De Dead",
    colors: "from-yellow-300 via-teal-400 to-cyan-500",
  },
  {
    id: 3,
    name: "Scary Stories",
    colors: "from-cyan-400 via-blue-500 to-purple-500",
  },
  {
    id: 4,
    name: "Stay Awhile",
    colors: "from-pink-300 via-rose-400 to-red-400",
  },
  {
    id: 5,
    name: "Drop Dead Gorgeous",
    colors: "from-emerald-300 via-teal-400 to-cyan-500",
  },
  {
    id: 6,
    name: "Sweet Dreams",
    colors: "from-violet-400 via-purple-500 to-indigo-500",
  },
];

const DrinkIcon = ({ colors }: { colors: string }) => (
  <div className="relative w-20 h-28 md:w-24 md:h-32">
    {/* Cup */}
    <div 
      className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-24 md:w-20 md:h-28 rounded-b-lg bg-gradient-to-b ${colors} opacity-90`}
      style={{
        clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
      }}
    />
    {/* Ice cubes effect */}
    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 md:w-14 flex flex-wrap gap-1 justify-center">
      <div className="w-3 h-3 bg-white/40 rounded-sm rotate-12" />
      <div className="w-2.5 h-2.5 bg-white/30 rounded-sm -rotate-6" />
      <div className="w-2 h-2 bg-white/20 rounded-sm rotate-45" />
    </div>
    {/* Garnish */}
    <div className="absolute -top-1 right-2 w-3 h-3 rounded-full bg-green-500" />
    <div className="absolute -top-2 right-1 w-1.5 h-4 bg-green-600 rotate-45 rounded-full" />
  </div>
);

export function DrinkMenuSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-16 lg:py-24 overflow-hidden bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-6 text-center mb-12"
      >
        <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-muted-foreground font-sans">
          Drinks on us. We have an exclusive menu of{" "}
          <span className="underline underline-offset-4">complimentary</span>{" "}
          options for your appointment.
        </p>
      </motion.div>

      {/* Scrolling Drinks */}
      <div 
        className="flex animate-drink-scroll"
        style={{ width: 'fit-content' }}
      >
        {/* First set */}
        {drinks.map((drink, index) => (
          <motion.div
            key={drink.id}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="flex flex-col items-center gap-4 px-8 md:px-12"
          >
            <DrinkIcon colors={drink.colors} />
            <h3 className="font-serif text-lg md:text-xl lg:text-2xl text-foreground whitespace-nowrap">
              {drink.name}
            </h3>
          </motion.div>
        ))}
        
        {/* Duplicate set for seamless loop */}
        {drinks.map((drink) => (
          <div
            key={`dup-${drink.id}`}
            className="flex flex-col items-center gap-4 px-8 md:px-12"
            aria-hidden="true"
          >
            <DrinkIcon colors={drink.colors} />
            <h3 className="font-serif text-lg md:text-xl lg:text-2xl text-foreground whitespace-nowrap">
              {drink.name}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
}
