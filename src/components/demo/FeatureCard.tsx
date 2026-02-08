import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import type { ProductFeature } from '@/hooks/useProductDemo';

interface FeatureCardProps {
  feature: ProductFeature;
  isPrimary?: boolean;
  onLearnMore?: (featureKey: string) => void;
}

const categoryIcons: Record<string, string> = {
  scheduling: '📅',
  team: '👥',
  payroll: '💰',
  clients: '💇',
  analytics: '📊',
  communication: '💬',
  training: '🎓',
  admin: '⚙️',
  overview: '🏠',
};

export function FeatureCard({ feature, isPrimary = false, onLearnMore }: FeatureCardProps) {
  const icon = categoryIcons[feature.category] || '✨';

  if (isPrimary) {
    return (
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background shadow-lg overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <Badge variant="secondary" className="text-xs">
              Recommended Solution
            </Badge>
          </div>
          <CardTitle className="flex items-center gap-3 text-xl">
            <span className="text-2xl">{icon}</span>
            {feature.name}
          </CardTitle>
          {feature.tagline && (
            <p className="text-sm text-muted-foreground font-medium">
              {feature.tagline}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {feature.screenshot_url && (
            <div className="relative rounded-lg overflow-hidden border bg-muted aspect-video">
              <img
                src={feature.screenshot_url}
                alt={`${feature.name} screenshot`}
                className="w-full h-full object-cover"
              />
              {feature.demo_video_url && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="bg-white rounded-full p-3">
                    <Play className="h-6 w-6 text-primary" />
                  </div>
                </div>
              )}
            </div>
          )}
          
          {feature.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          )}

          <Button
            onClick={() => onLearnMore?.(feature.feature_key)}
            className="w-full gap-2"
          >
            See Interactive Demo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Secondary/related feature card
  return (
    <Card className="hover:border-primary/30 transition-colors cursor-pointer group" onClick={() => onLearnMore?.(feature.feature_key)}>
      <CardContent className="p-4 flex items-start gap-3">
        <span className="text-xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
            {feature.name}
          </h4>
          {feature.tagline && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {feature.tagline}
            </p>
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
      </CardContent>
    </Card>
  );
}
