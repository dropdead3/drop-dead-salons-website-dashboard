import type { SectionType } from '@/hooks/useWebsiteSections';
import type { StyleOverrides } from '@/components/home/SectionStyleWrapper';

export interface SectionTemplate {
  id: string;
  name: string;
  description: string;
  category: 'content' | 'cta' | 'media' | 'spacing';
  section_type: SectionType;
  default_config: Record<string, unknown>;
  style_overrides?: Partial<StyleOverrides>;
}

export const SECTION_TEMPLATES: SectionTemplate[] = [
  // Content blocks
  {
    id: 'story-block',
    name: 'Story Block',
    description: 'A centered text block for telling your brand story',
    category: 'content',
    section_type: 'rich_text',
    default_config: {
      heading: 'Our Story',
      body: 'Founded with a passion for beauty, we believe every person deserves to feel confident and radiant. Our journey began with a simple mission: to create a welcoming space where artistry meets care.',
      alignment: 'center',
      background: 'none',
    },
  },
  {
    id: 'feature-left',
    name: 'Feature (Image Left)',
    description: 'Image on the left with text on the right',
    category: 'content',
    section_type: 'image_text',
    default_config: {
      heading: 'Why Choose Us',
      body: 'We combine expertise with personalized service to deliver results that exceed expectations.',
      image_url: '',
      layout: 'image-left',
      button_text: 'Learn More',
      button_url: '#',
    },
  },
  {
    id: 'feature-right',
    name: 'Feature (Image Right)',
    description: 'Text on the left with image on the right',
    category: 'content',
    section_type: 'image_text',
    default_config: {
      heading: 'Our Expertise',
      body: 'From precision cuts to vibrant color, our team stays at the forefront of beauty trends.',
      image_url: '',
      layout: 'image-right',
      button_text: 'View Services',
      button_url: '#',
    },
  },
  {
    id: 'muted-text-block',
    name: 'Muted Background Text',
    description: 'Text block with a soft muted background',
    category: 'content',
    section_type: 'rich_text',
    default_config: {
      heading: 'Our Philosophy',
      body: 'We believe in sustainable beauty practices, using premium products that are as kind to the environment as they are to your hair.',
      alignment: 'center',
      background: 'muted',
    },
  },

  // CTA blocks
  {
    id: 'cta-default',
    name: 'Simple CTA',
    description: 'Clean call-to-action with button',
    category: 'cta',
    section_type: 'custom_cta',
    default_config: {
      heading: 'Ready to Transform Your Look?',
      description: 'Book your appointment today and experience the difference.',
      button_text: 'Book Now',
      button_url: '#',
      variant: 'default',
    },
  },
  {
    id: 'cta-primary',
    name: 'Bold CTA',
    description: 'Vibrant primary-color call-to-action',
    category: 'cta',
    section_type: 'custom_cta',
    default_config: {
      heading: 'New Client Special',
      description: 'First-time visitors enjoy 20% off their first service.',
      button_text: 'Claim Offer',
      button_url: '#',
      variant: 'primary',
    },
  },
  {
    id: 'cta-dark',
    name: 'Dark CTA',
    description: 'Dramatic dark-background call-to-action',
    category: 'cta',
    section_type: 'custom_cta',
    default_config: {
      heading: 'Join Our Team',
      description: "We're always looking for talented stylists. Let's grow together.",
      button_text: 'Apply Now',
      button_url: '#',
      variant: 'dark',
    },
  },

  // Media blocks
  {
    id: 'video-tour',
    name: 'Salon Tour Video',
    description: 'Embedded video showcasing your space',
    category: 'media',
    section_type: 'video',
    default_config: {
      heading: 'Take a Tour',
      video_url: '',
      autoplay: false,
    },
  },
  {
    id: 'video-tutorial',
    name: 'Tutorial Video',
    description: 'Educational content video with autoplay',
    category: 'media',
    section_type: 'video',
    default_config: {
      heading: 'Hair Care Tips',
      video_url: '',
      autoplay: false,
    },
  },

  // Spacing
  {
    id: 'spacer-small',
    name: 'Small Spacer',
    description: '32px breathing room between sections',
    category: 'spacing',
    section_type: 'spacer',
    default_config: { height: 32, show_divider: false },
  },
  {
    id: 'divider-line',
    name: 'Divider Line',
    description: 'Subtle horizontal line separator',
    category: 'spacing',
    section_type: 'spacer',
    default_config: { height: 64, show_divider: true },
  },
  {
    id: 'spacer-large',
    name: 'Large Spacer',
    description: '120px dramatic spacing',
    category: 'spacing',
    section_type: 'spacer',
    default_config: { height: 120, show_divider: false },
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: 'content', label: 'Content' },
  { id: 'cta', label: 'Call to Action' },
  { id: 'media', label: 'Media' },
  { id: 'spacing', label: 'Spacing' },
] as const;
