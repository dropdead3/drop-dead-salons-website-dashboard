/**
 * SEO Workshop: curated guides (how-to content) and external tools.
 */

export interface SEOWorkshopGuide {
  title: string;
  summary: string;
  url: string;
}

export interface SEOWorkshopTool {
  name: string;
  description: string;
  url: string;
}

export const SEO_WORKSHOP_GUIDES: SEOWorkshopGuide[] = [
  {
    title: 'How to claim your Google Business Profile',
    summary: 'Step-by-step to find, claim, and verify your business on Google.',
    url: 'https://support.google.com/business/answer/2911778',
  },
  {
    title: 'Optimize your Google Business Profile',
    summary: 'Best practices for categories, hours, attributes, and posts.',
    url: 'https://support.google.com/business/answer/7107242',
  },
  {
    title: 'NAP consistency for local SEO',
    summary: 'Why name, address, and phone must match everywhere and how to fix inconsistencies.',
    url: 'https://moz.com/learn/seo/local/listing-consistency',
  },
  {
    title: 'Meta descriptions and title tags',
    summary: 'How to write unique titles and descriptions that improve clicks and relevance.',
    url: 'https://developers.google.com/search/docs/appearance/snippet',
  },
  {
    title: 'Structured data for local businesses',
    summary: 'Schema.org LocalBusiness and HairSalon markup examples and guidelines.',
    url: 'https://developers.google.com/search/docs/appearance/structured-data/local-business',
  },
  {
    title: 'Getting and managing reviews',
    summary: 'How to ask for reviews and respond in a way that builds trust.',
    url: 'https://support.google.com/business/answer/2622994',
  },
  {
    title: 'Submit your sitemap in Search Console',
    summary: 'Add your property and submit a sitemap so Google can discover your pages.',
    url: 'https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap',
  },
  {
    title: 'Mobile-friendly and Core Web Vitals',
    summary: 'What Google looks at for mobile usability and page experience.',
    url: 'https://developers.google.com/search/docs/appearance/page-experience',
  },
];

export const SEO_WORKSHOP_TOOLS: SEOWorkshopTool[] = [
  {
    name: 'Google Search Console',
    description: 'Monitor indexing, submit sitemaps, and see search performance.',
    url: 'https://search.google.com/search-console',
  },
  {
    name: 'Google Business Profile',
    description: 'Manage your business listing, hours, photos, posts, and reviews.',
    url: 'https://business.google.com',
  },
  {
    name: 'Bing Webmaster Tools',
    description: 'Submit your site and sitemap for Bing and Yahoo visibility.',
    url: 'https://www.bing.com/webmasters',
  },
  {
    name: 'PageSpeed Insights',
    description: 'Check load times and get suggestions to improve performance.',
    url: 'https://pagespeed.web.dev/',
  },
  {
    name: 'Mobile-Friendly Test',
    description: 'See if your pages are considered mobile-friendly by Google.',
    url: 'https://search.google.com/test/mobile-friendly',
  },
  {
    name: 'Rich Results Test',
    description: 'Validate structured data and see eligibility for rich results.',
    url: 'https://search.google.com/test/rich-results',
  },
];
