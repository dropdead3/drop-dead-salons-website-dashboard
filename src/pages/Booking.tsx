import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, Mail, Phone, ArrowUpRight } from "lucide-react";

export default function Booking() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Request Received",
      description: "We'll be in touch within 24 hours to confirm your appointment.",
    });

    setFormData({
      name: "",
      email: "",
      phone: "",
      service: "",
      message: "",
    });
    setIsSubmitting(false);
  };

  const serviceOptions = [
    "Color & Blonding",
    "Extensions",
    "Cutting & Styling",
    "Treatments & Care",
    "Consultation",
    "Not sure yet",
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-32 lg:pt-40 pb-16 lg:pb-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-sans block mb-6"
            >
              Contact Us
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight text-foreground leading-[1.1]"
            >
              Book Your
              <br />
              <span className="italic font-light">Appointment</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 text-base md:text-lg text-muted-foreground font-sans font-light max-w-lg"
            >
              Select your service, share a few details, and we'll be in touch.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Contact Form & Details */}
      <Section className="pt-0">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans mb-3"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-4 bg-background border border-border text-foreground font-sans font-light placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans mb-3"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-4 bg-background border border-border text-foreground font-sans font-light placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans mb-3"
                >
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-4 bg-background border border-border text-foreground font-sans font-light placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label
                  htmlFor="service"
                  className="block text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans mb-3"
                >
                  Service Interest
                </label>
                <select
                  id="service"
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-4 bg-background border border-border text-foreground font-sans font-light focus:outline-none focus:border-foreground transition-colors appearance-none"
                >
                  <option value="">Select a service</option>
                  {serviceOptions.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans mb-3"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-4 bg-background border border-border text-foreground font-sans font-light placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors resize-none"
                  placeholder="Tell us about your hair goals..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 text-sm uppercase tracking-[0.15em] font-sans font-normal bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Sending..." : "Request Appointment"}
                {!isSubmitting && <ArrowUpRight size={14} />}
              </button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground font-sans font-light text-center">
              Not sure what to book?{" "}
              <span className="text-foreground">Start with a consultation.</span>
            </p>
          </motion.div>

          {/* Salon Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:pl-12 lg:border-l lg:border-border"
          >
            <h2 className="font-serif text-2xl font-normal text-foreground mb-8">
              Visit the Salon
            </h2>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <MapPin size={20} className="text-muted-foreground mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-sm uppercase tracking-[0.15em] text-foreground font-sans mb-2">
                    Location
                  </h3>
                  <p className="text-muted-foreground font-sans font-light">
                    123 Luxury Lane
                    <br />
                    Los Angeles, CA 90001
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock size={20} className="text-muted-foreground mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-sm uppercase tracking-[0.15em] text-foreground font-sans mb-2">
                    Hours
                  </h3>
                  <div className="text-muted-foreground font-sans font-light space-y-1">
                    <p>Tuesday – Friday: 10am – 7pm</p>
                    <p>Saturday: 9am – 5pm</p>
                    <p>Sunday – Monday: Closed</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail size={20} className="text-muted-foreground mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-sm uppercase tracking-[0.15em] text-foreground font-sans mb-2">
                    Email
                  </h3>
                  <a
                    href="mailto:hello@dropdeadsalon.com"
                    className="text-muted-foreground font-sans font-light hover:text-foreground transition-colors"
                  >
                    hello@dropdeadsalon.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone size={20} className="text-muted-foreground mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-sm uppercase tracking-[0.15em] text-foreground font-sans mb-2">
                    Phone
                  </h3>
                  <a
                    href="tel:+15551234567"
                    className="text-muted-foreground font-sans font-light hover:text-foreground transition-colors"
                  >
                    (555) 123-4567
                  </a>
                </div>
              </div>
            </div>

            {/* Note for new clients */}
            <div className="mt-12 p-6 bg-secondary border border-border">
              <h3 className="text-sm uppercase tracking-[0.15em] text-foreground font-sans mb-3">
                New Clients
              </h3>
              <p className="text-sm text-muted-foreground font-sans font-light leading-relaxed">
                First-time clients may be required to book a consultation prior to
                service. Some specialized services require approval before booking.
              </p>
            </div>
          </motion.div>
        </div>
      </Section>
    </Layout>
  );
}
