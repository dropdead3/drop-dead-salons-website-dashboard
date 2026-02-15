import { Card, CardContent } from '@/components/ui/card';
import { SEO_WORKSHOP_GUIDES } from '@/config/seoWorkshopGuides';
import { ExternalLink } from 'lucide-react';

export function SEOWorkshopGuides() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SEO_WORKSHOP_GUIDES.map((guide) => (
        <Card key={guide.url} className="flex flex-col">
          <CardContent className="p-4 flex flex-col flex-1">
            <a
              href={guide.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col flex-1 text-left"
            >
              <span className="font-medium text-sm group-hover:text-primary group-hover:underline inline-flex items-center gap-1">
                {guide.title}
                <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
              </span>
              <p className="text-xs text-muted-foreground mt-1 flex-1">
                {guide.summary}
              </p>
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
