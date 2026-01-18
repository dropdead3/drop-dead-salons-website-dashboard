import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Loader2, Download, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

interface Handbook {
  id: string;
  title: string;
  category: string | null;
  content: string | null;
  file_url: string | null;
  version: string | null;
  updated_at: string;
}

export default function MyHandbooks() {
  const { roles } = useAuth();
  const [handbooks, setHandbooks] = useState<Handbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHandbook, setSelectedHandbook] = useState<Handbook | null>(null);

  useEffect(() => {
    fetchHandbooks();
  }, [roles]);

  const fetchHandbooks = async () => {
    if (roles.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch handbooks where visible_to_roles contains any of the user's roles
    const { data, error } = await supabase
      .from('handbooks')
      .select('id, title, category, content, file_url, version, updated_at')
      .eq('is_active', true)
      .order('category')
      .order('title');

    if (error) {
      console.error('Error fetching handbooks:', error);
      setLoading(false);
      return;
    }

    // Filter handbooks where visible_to_roles overlaps with user's roles
    const filteredHandbooks = (data || []).filter((handbook: any) => {
      const visibleRoles = handbook.visible_to_roles || [];
      return roles.some(role => visibleRoles.includes(role));
    });

    setHandbooks(filteredHandbooks);
    setLoading(false);
  };

  const groupedHandbooks = handbooks.reduce((acc, handbook) => {
    const cat = handbook.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(handbook);
    return acc;
  }, {} as Record<string, Handbook[]>);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl lg:text-4xl mb-2">MY HANDBOOKS</h1>
          <p className="text-muted-foreground font-sans">
            Training materials and resources for your role.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : handbooks.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground font-sans">
              No handbooks available for your role yet.
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedHandbooks).map(([category, items]) => (
              <div key={category}>
                <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-4">
                  {category.toUpperCase()}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map(handbook => (
                    <Card 
                      key={handbook.id} 
                      className="p-5 hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedHandbook(handbook)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-muted rounded-lg group-hover:bg-background transition-colors">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-sans font-medium truncate">{handbook.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            v{handbook.version} • Updated {format(new Date(handbook.updated_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Handbook Detail Dialog */}
        <Dialog open={!!selectedHandbook} onOpenChange={(open) => !open && setSelectedHandbook(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedHandbook && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">
                    {selectedHandbook.title}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Version {selectedHandbook.version} • {selectedHandbook.category || 'General'}
                  </p>
                </DialogHeader>
                
                <div className="mt-4 space-y-4">
                  {selectedHandbook.content && (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {selectedHandbook.content}
                      </div>
                    </div>
                  )}

                  {selectedHandbook.file_url && (
                    <Button asChild className="w-full font-display">
                      <a href={selectedHandbook.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" />
                        DOWNLOAD FILE
                      </a>
                    </Button>
                  )}

                  {!selectedHandbook.content && !selectedHandbook.file_url && (
                    <p className="text-muted-foreground text-center py-8">
                      No content available for this handbook.
                    </p>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
