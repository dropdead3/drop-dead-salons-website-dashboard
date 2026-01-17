import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Do the salons accept walk-ins?",
    answer: "At this time, we do not accept walk-ins. All appointments must be scheduled in advance, and an initial consultation is required or must be waived by the stylist matched to you. This ensures you're paired with the right artist and receive the personalized service you deserve."
  },
  {
    question: "Will I need a consultation?",
    answer: "For most color services, extensions, and major transformations, yes. Consultations help us understand your hair history, assess its current condition, and create a personalized plan. Some services like trims or blowouts may not require one—your stylist will let you know."
  },
  {
    question: "Does it matter which location I arrive at for my appointment?",
    answer: "Yes! Please arrive at the specific location where your appointment is booked. Our stylists work at designated locations, so showing up at the correct salon ensures you're seen on time by your scheduled artist."
  },
  {
    question: "What's the vibe like at each salon?",
    answer: "Both locations share the same commitment to quality and creativity, but each has its own unique atmosphere. Val Vista Lakes has a more intimate, boutique feel, while North Mesa offers a larger, energetic space. We recommend visiting both to see which vibe resonates with you!"
  },
  {
    question: "What is your cancellation policy?",
    answer: "We require 48 hours notice for cancellations or rescheduling. Late cancellations or no-shows may result in a fee equal to 50% of the scheduled service. We understand life happens—just communicate with us as early as possible."
  }
];

export function FAQSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section 
      ref={sectionRef}
      className="py-20 lg:py-32 bg-secondary"
    >
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left Column - Intro */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="lg:sticky lg:top-32 lg:self-start"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif mb-6">
              Frequently asked<br />
              <em className="not-italic italic">questions...</em>
            </h2>
            
            <div className="space-y-4 text-foreground/80 mb-8">
              <p>
                At Drop Dead Hair Studio, it's simple—Death to Bad Hair is more than a motto; it's our mission.
              </p>
              <p>
                We're here to deliver bold transformations and flawless results with every visit. Our policies help keep things smooth, respectful of everyone's time, and ensure you always leave loving your hair. Take a moment to review our FAQs and policies—because great hair days shouldn't come with surprises, just killer confidence.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/faq"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                See All FAQ's
              </Link>
              <Link
                to="/policies"
                className="inline-flex items-center justify-center px-6 py-3 border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                Salon Policies
              </Link>
            </div>
          </motion.div>

          {/* Right Column - Accordion */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
          >
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-background border border-border px-6 data-[state=open]:border-foreground/20"
                >
                  <AccordionTrigger className="text-left text-base md:text-lg font-medium py-5 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground/80 pb-5 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
