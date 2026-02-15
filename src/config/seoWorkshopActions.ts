/**
 * SEO Workshop: config-driven list of action items by category.
 * Keys are stored in seo_workshop_completions.action_key.
 */

export type SEOWorkshopCategory =
  | 'local'
  | 'on_page'
  | 'technical'
  | 'content'
  | 'schema'
  | 'reputation';

export interface SEOWorkshopAction {
  key: string;
  label: string;
  description: string;
  category: SEOWorkshopCategory;
  guideUrl?: string;
  toolUrl?: string;
  priority?: number; // lower = higher priority for "next recommended"
}

export const SEO_WORKSHOP_CATEGORY_LABELS: Record<SEOWorkshopCategory, string> = {
  local: 'Local SEO',
  on_page: 'On-Page',
  technical: 'Technical',
  content: 'Content',
  schema: 'Schema',
  reputation: 'Reputation',
};

export const SEO_WORKSHOP_ACTIONS: SEOWorkshopAction[] = [
  // Local SEO
  {
    key: 'gbp_claim',
    label: 'Claim and verify Google Business Profile',
    description: 'Claim your listing and complete verification so you control your business info.',
    category: 'local',
    toolUrl: 'https://business.google.com',
    priority: 1,
  },
  {
    key: 'gbp_hours',
    label: 'Set business hours on GBP',
    description: 'Keep hours accurate so customers and search engines see when you are open.',
    category: 'local',
    toolUrl: 'https://business.google.com',
    priority: 2,
  },
  {
    key: 'gbp_categories',
    label: 'Choose primary and secondary categories on GBP',
    description: 'Select the categories that best match your services (e.g. Hair salon, Beauty salon).',
    category: 'local',
    toolUrl: 'https://business.google.com',
    priority: 3,
  },
  {
    key: 'gbp_photos',
    label: 'Add and refresh photos on GBP',
    description: 'Upload interior, exterior, team, and service photos. Update seasonally.',
    category: 'local',
    toolUrl: 'https://business.google.com',
    priority: 4,
  },
  {
    key: 'gbp_posts',
    label: 'Publish regular GBP posts',
    description: 'Use posts for offers, events, and updates to stay visible in local search.',
    category: 'local',
    toolUrl: 'https://business.google.com',
    priority: 5,
  },
  {
    key: 'gbp_qa',
    label: 'Monitor and answer GBP Q&A',
    description: 'Respond to questions so accurate info appears and engagement signals improve.',
    category: 'local',
    toolUrl: 'https://business.google.com',
    priority: 6,
  },
  {
    key: 'nap_consistency',
    label: 'Ensure NAP consistency everywhere',
    description: 'Use the same business name, address, and phone number on site, GBP, and citations.',
    category: 'local',
    priority: 7,
  },
  {
    key: 'local_citations',
    label: 'Build local citations',
    description: 'List your business on relevant directories (Yelp, Apple Maps, industry sites).',
    category: 'local',
    priority: 8,
  },
  // On-Page
  {
    key: 'meta_homepage',
    label: 'Add meta title and description to homepage',
    description: 'Unique title and description that include location and core services.',
    category: 'on_page',
    priority: 10,
  },
  {
    key: 'meta_services',
    label: 'Add meta title and description to service pages',
    description: 'Each service page should have a unique title and meta description.',
    category: 'on_page',
    priority: 11,
  },
  {
    key: 'h1_structure',
    label: 'Use one clear H1 per page',
    description: 'Each page should have a single H1 that reflects the main topic or service.',
    category: 'on_page',
    priority: 12,
  },
  {
    key: 'url_structure',
    label: 'Use clean, readable URLs',
    description: 'Short URLs with keywords (e.g. /services/color) instead of long or random strings.',
    category: 'on_page',
    priority: 13,
  },
  {
    key: 'internal_links',
    label: 'Add internal links between related pages',
    description: 'Link from homepage and category pages to service and location pages.',
    category: 'on_page',
    priority: 14,
  },
  // Technical
  {
    key: 'sitemap',
    label: 'Create and submit XML sitemap',
    description: 'Submit your sitemap in Google Search Console so all important pages are discovered.',
    category: 'technical',
    toolUrl: 'https://search.google.com/search-console',
    priority: 20,
  },
  {
    key: 'robots_txt',
    label: 'Configure robots.txt',
    description: 'Allow crawlers where needed and avoid blocking important pages.',
    category: 'technical',
    priority: 21,
  },
  {
    key: 'mobile_friendly',
    label: 'Ensure site is mobile-friendly',
    description: 'Check that layout, text, and tap targets work well on phones.',
    category: 'technical',
    toolUrl: 'https://search.google.com/test/mobile-friendly',
    priority: 22,
  },
  {
    key: 'page_speed',
    label: 'Improve page speed',
    description: 'Optimize images and reduce blocking resources so pages load quickly.',
    category: 'technical',
    toolUrl: 'https://pagespeed.web.dev/',
    priority: 23,
  },
  {
    key: 'canonical_urls',
    label: 'Set canonical URLs where needed',
    description: 'Use canonicals to avoid duplicate-content issues across similar URLs.',
    category: 'technical',
    priority: 24,
  },
  {
    key: 'https',
    label: 'Serve site over HTTPS',
    description: 'Use a valid SSL certificate so the site is secure and trusted by search engines.',
    category: 'technical',
    priority: 25,
  },
  // Content
  {
    key: 'service_pages',
    label: 'Create dedicated pages for main services',
    description: 'One page per major service with clear copy and local relevance.',
    category: 'content',
    priority: 30,
  },
  {
    key: 'location_pages',
    label: 'Create location-specific pages if multi-location',
    description: 'Each location gets its own page with name, address, hours, and local keywords.',
    category: 'content',
    priority: 31,
  },
  {
    key: 'faq_content',
    label: 'Add FAQ or blog content for key topics',
    description: 'Answer common questions (e.g. pricing, booking) to capture long-tail searches.',
    category: 'content',
    priority: 32,
  },
  {
    key: 'keyword_alignment',
    label: 'Align copy with local search terms',
    description: 'Use the phrases customers use when searching (e.g. "hair color [city]").',
    category: 'content',
    priority: 33,
  },
  // Schema
  {
    key: 'local_business_schema',
    label: 'Implement LocalBusiness or HairSalon schema',
    description: 'Structured data helps search engines show your business correctly in results.',
    category: 'schema',
    priority: 40,
  },
  {
    key: 'service_schema',
    label: 'Add Service schema where relevant',
    description: 'Mark up services so they can appear in rich results.',
    category: 'schema',
    priority: 41,
  },
  {
    key: 'faq_schema',
    label: 'Add FAQPage schema for Q&A content',
    description: 'FAQ schema can enable FAQ rich results in search.',
    category: 'schema',
    priority: 42,
  },
  {
    key: 'verify_schema',
    label: 'Verify schema with Google Rich Results Test',
    description: 'Confirm markup is valid and eligible for rich results.',
    category: 'schema',
    toolUrl: 'https://search.google.com/test/rich-results',
    priority: 43,
  },
  // Reputation
  {
    key: 'review_requests',
    label: 'Ask satisfied clients for Google reviews',
    description: 'More genuine reviews improve visibility and trust in local pack.',
    category: 'reputation',
    priority: 50,
  },
  {
    key: 'review_responses',
    label: 'Respond to all Google reviews within 48 hours',
    description: 'Reply to positive and negative reviews to show engagement and care.',
    category: 'reputation',
    toolUrl: 'https://business.google.com',
    priority: 51,
  },
  {
    key: 'review_monitoring',
    label: 'Monitor reviews across platforms',
    description: 'Track Google, Yelp, and other sites so you can respond quickly.',
    category: 'reputation',
    priority: 52,
  },
];

export function getActionsByCategory(): Record<SEOWorkshopCategory, SEOWorkshopAction[]> {
  const byCategory = {} as Record<SEOWorkshopCategory, SEOWorkshopAction[]>;
  const categories: SEOWorkshopCategory[] = ['local', 'on_page', 'technical', 'content', 'schema', 'reputation'];
  for (const cat of categories) {
    byCategory[cat] = SEO_WORKSHOP_ACTIONS.filter((a) => a.category === cat).sort(
      (a, b) => (a.priority ?? 999) - (b.priority ?? 999)
    );
  }
  return byCategory;
}

export function getActionByKey(key: string): SEOWorkshopAction | undefined {
  return SEO_WORKSHOP_ACTIONS.find((a) => a.key === key);
}
