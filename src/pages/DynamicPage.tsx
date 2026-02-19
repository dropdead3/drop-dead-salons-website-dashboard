import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/SEO';
import { useWebsitePages, getPageBySlug } from '@/hooks/useWebsitePages';
import { PageSectionRenderer } from '@/components/home/PageSectionRenderer';

export default function DynamicPage() {
  const { pageSlug } = useParams<{ pageSlug: string }>();
  const { data: pagesConfig, isLoading } = useWebsitePages();

  const page = useMemo(() => {
    return getPageBySlug(pagesConfig, pageSlug || '');
  }, [pagesConfig, pageSlug]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!page) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold mb-2">404</h1>
            <p className="text-muted-foreground">Page not found</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title={page.seo_title || page.title}
        description={page.seo_description}
      />
      <PageSectionRenderer sections={page.sections} />
    </Layout>
  );
}
