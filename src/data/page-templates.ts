import type { CustomSectionType } from '@/hooks/useWebsiteSections';

export interface PageTemplateSectionDef {
  type: CustomSectionType;
  label: string;
  config: Record<string, unknown>;
}

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  sections: PageTemplateSectionDef[];
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'about-us',
    name: 'About Us',
    description: 'Story block, team showcase, and booking CTA',
    sections: [
      {
        type: 'rich_text',
        label: 'Our Story',
        config: {
          heading: 'Our Story',
          body: 'Founded with a passion for beauty and a commitment to excellence, our salon has been serving the community for over a decade.',
          alignment: 'center',
          background: 'none',
        },
      },
      {
        type: 'image_text',
        label: 'Meet the Team',
        config: {
          heading: 'Meet Our Team',
          body: 'Our talented stylists bring years of experience and a passion for making you look and feel your best.',
          image_url: '',
          layout: 'image-right',
          button_text: 'View Stylists',
          button_url: '#',
        },
      },
      {
        type: 'custom_cta',
        label: 'Book Now',
        config: {
          heading: 'Ready for Your Transformation?',
          description: 'Schedule your visit and let our experts take care of the rest.',
          button_text: 'Book Appointment',
          button_url: '#',
          variant: 'primary',
        },
      },
    ],
  },
  {
    id: 'contact',
    name: 'Contact',
    description: 'Contact information and a scheduling CTA',
    sections: [
      {
        type: 'rich_text',
        label: 'Contact Info',
        config: {
          heading: 'Get in Touch',
          body: "We'd love to hear from you. Visit us at our salon, give us a call, or send us a message.",
          alignment: 'center',
          background: 'muted',
        },
      },
      {
        type: 'custom_cta',
        label: 'Schedule Visit',
        config: {
          heading: 'Schedule a Visit',
          description: 'Walk-ins are welcome, but appointments are recommended for the best experience.',
          button_text: 'Book Online',
          button_url: '#',
          variant: 'default',
        },
      },
    ],
  },
  {
    id: 'services-showcase',
    name: 'Services Showcase',
    description: 'Highlight your services with images and descriptions',
    sections: [
      {
        type: 'rich_text',
        label: 'Services Intro',
        config: {
          heading: 'Our Services',
          body: 'From cuts and color to extensions and treatments, we offer a full range of services to help you look your best.',
          alignment: 'center',
          background: 'none',
        },
      },
      {
        type: 'image_text',
        label: 'Color Services',
        config: {
          heading: 'Expert Color',
          body: 'Our colorists are trained in the latest techniques including balayage, highlights, and vivid fashion colors.',
          image_url: '',
          layout: 'image-left',
          button_text: 'See Color Menu',
          button_url: '#',
        },
      },
      {
        type: 'image_text',
        label: 'Extension Services',
        config: {
          heading: 'Hair Extensions',
          body: 'Transform your look with our premium hand-tied and tape-in extension services.',
          image_url: '',
          layout: 'image-right',
          button_text: 'Learn More',
          button_url: '#',
        },
      },
      {
        type: 'custom_cta',
        label: 'Book Service',
        config: {
          heading: 'Find Your Perfect Service',
          description: 'Not sure what you need? Book a consultation and our experts will guide you.',
          button_text: 'Free Consultation',
          button_url: '#',
          variant: 'primary',
        },
      },
    ],
  },
  {
    id: 'minimal-landing',
    name: 'Minimal Landing',
    description: 'A clean, simple page with a statement and CTA',
    sections: [
      {
        type: 'rich_text',
        label: 'Statement',
        config: {
          heading: 'Beauty, Elevated.',
          body: 'Where artistry meets precision.',
          alignment: 'center',
          background: 'none',
        },
      },
      {
        type: 'spacer',
        label: 'Spacer',
        config: { height: 48, show_divider: false },
      },
      {
        type: 'custom_cta',
        label: 'CTA',
        config: {
          heading: '',
          description: '',
          button_text: 'Book Your Visit',
          button_url: '#',
          variant: 'dark',
        },
      },
    ],
  },
];
