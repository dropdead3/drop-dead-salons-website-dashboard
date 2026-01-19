import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
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
  clientBook: z.string().min(1, "Please select your current client book size"),
  specialties: z.string().trim().min(1, "Please tell us about your specialties").max(500, "Specialties must be less than 500 characters"),
  whyDropDead: z.string().trim().min(1, "Please tell us why you want to work at Drop Dead").max(500, "Response must be less than 500 characters"),
  message: z.string().trim().max(1000, "Message must be less than 1000 characters").optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface ApplicationFormProps {
  onClose: () => void;
}

export function ApplicationForm({ onClose }: ApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      instagram: "",
      experience: "",
      clientBook: "",
      specialties: "",
      whyDropDead: "",
      message: "",
    },
  });

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Application submitted:", data);
    toast.success("Application submitted! We'll be in touch soon.");
    form.reset();
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="container mx-auto px-6 pt-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-background border border-border rounded-2xl p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider">Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
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
                        <Input type="email" placeholder="you@email.com" {...field} />
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
                        <Input type="tel" placeholder="(555) 555-5555" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider">Instagram</FormLabel>
                      <FormControl>
                        <Input placeholder="@yourusername" {...field} />
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
                      <FormLabel className="text-xs uppercase tracking-wider">Experience *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
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
              </div>

              <FormField
                control={form.control}
                name="clientBook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider">Do you currently have a book of clients? *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="less-than-10">Less than 10</SelectItem>
                        <SelectItem value="10-20">Yes - 10-20 clients</SelectItem>
                        <SelectItem value="20-30">Yes - 20-30 clients</SelectItem>
                        <SelectItem value="30-50">Yes - 30-50 clients</SelectItem>
                        <SelectItem value="50+">Yes - 50+ clients</SelectItem>
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
                        placeholder="e.g., balayage, extensions, vivid colors..." 
                        {...field} 
                        className="resize-none"
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whyDropDead"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider">What's the biggest reason you want to work at Drop Dead? *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us what excites you about joining our team..." 
                        {...field} 
                        className="resize-none"
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
                    <FormLabel className="text-xs uppercase tracking-wider">Message (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Anything else you'd like us to know?" 
                        {...field} 
                        className="resize-none"
                        rows={2}
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
        </div>
      </div>
    </div>
  );
}
