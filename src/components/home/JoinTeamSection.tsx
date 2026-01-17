import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const applicationSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(10, "Please enter a valid phone number").max(20, "Phone number is too long"),
  instagram: z.string().trim().max(50, "Instagram handle is too long").optional(),
  experience: z.string().min(1, "Please select your experience level"),
  specialties: z.string().trim().min(1, "Please tell us about your specialties").max(500, "Specialties must be less than 500 characters"),
  message: z.string().trim().max(1000, "Message must be less than 1000 characters").optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export function JoinTeamSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      instagram: "",
      experience: "",
      specialties: "",
      message: "",
    },
  });

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Application submitted:", data);
    toast.success("Application submitted! We'll be in touch soon.");
    form.reset();
    setIsSubmitting(false);
  };

  return (
    <section 
      ref={sectionRef}
      className="py-20 md:py-28 bg-background border-t border-border"
    >
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left - Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-foreground/60" />
                <p className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                  Join Our Team
                </p>
              </div>
              <h2 className="text-3xl md:text-4xl font-serif mb-6">
                Work at <em className="italic">Drop Dead</em>
              </h2>
              <p className="text-foreground/70 leading-relaxed mb-6">
                Are you a passionate stylist looking for your next opportunity? 
                We're always searching for talented artists who share our vision 
                for excellence and creativity.
              </p>
              <div className="space-y-3 text-sm text-foreground/70">
                <p>✓ Competitive commission structure</p>
                <p>✓ Ongoing education & training</p>
                <p>✓ Supportive team environment</p>
                <p>✓ Premium product lines</p>
              </div>
            </motion.div>

            {/* Right - Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
              className="bg-secondary p-6 md:p-8"
            >
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider">Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider">Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="you@email.com" {...field} className="bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider">Phone *</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(555) 555-5555" {...field} className="bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider">Instagram Handle</FormLabel>
                        <FormControl>
                          <Input placeholder="@yourusername" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider">Experience Level *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select your experience" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0-2">0-2 years</SelectItem>
                            <SelectItem value="2-5">2-5 years</SelectItem>
                            <SelectItem value="5-10">5-10 years</SelectItem>
                            <SelectItem value="10+">10+ years</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialties"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider">Your Specialties *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about your specialties (e.g., balayage, extensions, vivid colors...)" 
                            {...field} 
                            className="bg-background resize-none"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider">Additional Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Anything else you'd like us to know?" 
                            {...field} 
                            className="bg-background resize-none"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full group"
                  >
                    <span>{isSubmitting ? "Submitting..." : "Submit Application"}</span>
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </form>
              </Form>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
