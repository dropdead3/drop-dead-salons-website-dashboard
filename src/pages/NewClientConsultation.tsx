import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Check } from "lucide-react";

const serviceInterests = [
  "Haircut & Styling",
  "Hair Color",
  "Highlights / Balayage",
  "Hair Extensions",
  "Keratin Treatment",
  "Special Occasion Styling",
  "Other"
];

const howDidYouHear = [
  "Instagram",
  "Google Search",
  "Friend / Family Referral",
  "Yelp",
  "TikTok",
  "Other"
];

const NewClientConsultation = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    services: [] as string[],
    referralSource: "",
    currentHairDescription: "",
    hairGoals: "",
    allergiesOrSensitivities: "",
    additionalNotes: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleReferralSelect = (source: string) => {
    setFormData(prev => ({ ...prev, referralSource: source }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Consultation Request Submitted!",
      description: "We'll be in touch within 24-48 hours to schedule your consultation.",
    });
    
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      services: [],
      referralSource: "",
      currentHairDescription: "",
      hairGoals: "",
      allergiesOrSensitivities: "",
      additionalNotes: ""
    });
    setIsSubmitting(false);
  };

  return (
    <Layout>
      <SEO
        title="New Client Consultation | Drop Dead Salon"
        description="Start your hair transformation journey with Drop Dead Salon. Fill out our new client form to get matched with the perfect stylist."
      />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20 bg-secondary">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif mb-6">
              Welcome to <em className="not-italic italic">Drop Dead</em>
            </h1>
            <p className="text-foreground/80 text-lg md:text-xl leading-relaxed">
              We're excited to meet you! Please fill out the form below so we can learn about your 
              hair goals and match you with the perfect stylist for your needs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto space-y-12"
          >
            {/* Personal Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-serif border-b border-border pb-4">Your Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Services Interested In */}
            <div className="space-y-6">
              <h2 className="text-2xl font-serif border-b border-border pb-4">Services You're Interested In</h2>
              <p className="text-muted-foreground text-sm">Select all that apply</p>
              
              <div className="flex flex-wrap gap-3">
                {serviceInterests.map((service) => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => handleServiceToggle(service)}
                    className={`flex items-center gap-2 px-4 py-2.5 border transition-all duration-200 text-sm ${
                      formData.services.includes(service)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-foreground/30"
                    }`}
                  >
                    {formData.services.includes(service) && (
                      <Check className="w-4 h-4" />
                    )}
                    <span>{service}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hair Details */}
            <div className="space-y-6">
              <h2 className="text-2xl font-serif border-b border-border pb-4">Tell Us About Your Hair</h2>
              
              <div className="space-y-2">
                <Label htmlFor="currentHairDescription">
                  Describe your current hair (color, texture, length, etc.)
                </Label>
                <Textarea
                  id="currentHairDescription"
                  name="currentHairDescription"
                  value={formData.currentHairDescription}
                  onChange={handleInputChange}
                  rows={3}
                  className="bg-background resize-none"
                  placeholder="e.g., Natural brunette, wavy, shoulder length, some previous highlights..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hairGoals">
                  What are your hair goals? *
                </Label>
                <Textarea
                  id="hairGoals"
                  name="hairGoals"
                  value={formData.hairGoals}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="bg-background resize-none"
                  placeholder="Tell us what you're hoping to achieve. Feel free to describe colors, styles, or share inspiration..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergiesOrSensitivities">
                  Any allergies or scalp sensitivities we should know about?
                </Label>
                <Textarea
                  id="allergiesOrSensitivities"
                  name="allergiesOrSensitivities"
                  value={formData.allergiesOrSensitivities}
                  onChange={handleInputChange}
                  rows={2}
                  className="bg-background resize-none"
                  placeholder="e.g., Sensitive scalp, allergic to certain dyes, etc."
                />
              </div>
            </div>

            {/* How Did You Hear About Us */}
            <div className="space-y-6">
              <h2 className="text-2xl font-serif border-b border-border pb-4">How Did You Hear About Us?</h2>
              
              <div className="flex flex-wrap gap-3">
                {howDidYouHear.map((source) => (
                  <button
                    key={source}
                    type="button"
                    onClick={() => handleReferralSelect(source)}
                    className={`px-4 py-2.5 border transition-all duration-200 text-sm ${
                      formData.referralSource === source
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-foreground/30"
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-6">
              <h2 className="text-2xl font-serif border-b border-border pb-4">Anything Else?</h2>
              
              <div className="space-y-2">
                <Label htmlFor="additionalNotes">
                  Additional notes or questions
                </Label>
                <Textarea
                  id="additionalNotes"
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleInputChange}
                  rows={3}
                  className="bg-background resize-none"
                  placeholder="Anything else you'd like us to know..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="pt-4"
            >
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 text-base font-medium hover:bg-primary/90 transition-colors duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isSubmitting ? "Submitting..." : "Submit Consultation Request"}</span>
                {!isSubmitting && (
                  <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                )}
              </button>
              
              <p className="text-muted-foreground text-sm mt-4">
                We'll reach out within 24-48 hours to confirm your consultation or next steps.
              </p>
            </motion.div>
          </motion.form>
        </div>
      </section>
    </Layout>
  );
};

export default NewClientConsultation;
