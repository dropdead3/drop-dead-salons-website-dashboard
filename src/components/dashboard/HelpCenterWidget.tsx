import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowRight, Star, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFeaturedKBArticles, useKBCategoriesWithCounts } from '@/hooks/useKnowledgeBase';

export function HelpCenterWidget() {
  const navigate = useNavigate();
  const { data: featuredArticles } = useFeaturedKBArticles();
  const { data: categories } = useKBCategoriesWithCounts();

  const displayArticles = featuredArticles?.slice(0, 3) || [];
  const totalArticles = categories?.reduce((sum, cat) => sum + (cat.article_count || 0), 0) || 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            Help Center
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/help')}
            className="text-xs gap-1 h-7"
          >
            View All
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayArticles.length > 0 ? (
          <>
            {displayArticles.map((article) => (
              <button
                key={article.id}
                onClick={() =>
                  navigate(
                    `/dashboard/help/${article.category?.slug || 'uncategorized'}/${article.slug}`
                  )
                }
                className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {article.title}
                    </p>
                    {article.category && (
                      <p className="text-xs text-muted-foreground">
                        {article.category.name}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </>
        ) : (
          <div className="text-center py-4">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {totalArticles} articles available
            </p>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/help')}
          className="w-full"
        >
          Browse Help Center
        </Button>
      </CardContent>
    </Card>
  );
}
