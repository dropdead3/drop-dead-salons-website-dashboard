import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  FileText, 
  Loader2, 
  Download, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight,
  PartyPopper,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Handbook {
  id: string;
  title: string;
  category: string | null;
  content: string | null;
  file_url: string | null;
  version: string | null;
  updated_at: string;
}

interface Acknowledgment {
  handbook_id: string;
  acknowledged_at: string;
}

export default function Onboarding() {
  const { roles, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [handbooks, setHandbooks] = useState<Handbook[]>([]);
  const [acknowledgments, setAcknowledgments] = useState<Acknowledgment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHandbook, setSelectedHandbook] = useState<Handbook | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasReadContent, setHasReadContent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (roles.length > 0 && user) {
      fetchData();
    } else if (roles.length === 0) {
      setLoading(false);
    }
  }, [roles, user]);

  const fetchData = async () => {
    const [handbooksResult, acknowledgementsResult] = await Promise.all([
      supabase
        .from('handbooks')
        .select('id, title, category, content, file_url, version, updated_at, visible_to_roles')
        .eq('is_active', true)
        .eq('category', 'Onboarding')
        .order('title'),
      supabase
        .from('handbook_acknowledgments')
        .select('handbook_id, acknowledged_at')
    ]);

    if (handbooksResult.error) {
      console.error('Error fetching handbooks:', handbooksResult.error);
    } else {
      const filteredHandbooks = (handbooksResult.data || []).filter((handbook: any) => {
        const visibleRoles = handbook.visible_to_roles || [];
        return roles.some(role => visibleRoles.includes(role));
      });
      setHandbooks(filteredHandbooks);
      
      // Find first unacknowledged handbook
      if (acknowledgementsResult.data) {
        const ackIds = acknowledgementsResult.data.map(a => a.handbook_id);
        const firstUnack = filteredHandbooks.findIndex(h => !ackIds.includes(h.id));
        if (firstUnack !== -1) {
          setCurrentIndex(firstUnack);
        }
      }
    }

    if (!acknowledgementsResult.error) {
      setAcknowledgments(acknowledgementsResult.data || []);
    }

    setLoading(false);
  };

  const isAcknowledged = (handbookId: string) => {
    return acknowledgments.some(ack => ack.handbook_id === handbookId);
  };

  const handleAcknowledge = async () => {
    if (!selectedHandbook || !user) return;
    
    setSubmitting(true);
    
    const { error } = await supabase
      .from('handbook_acknowledgments')
      .insert({
        user_id: user.id,
        handbook_id: selectedHandbook.id
      });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    } else {
      setAcknowledgments(prev => [...prev, {
        handbook_id: selectedHandbook.id,
        acknowledged_at: new Date().toISOString()
      }]);
      toast({
        title: 'Acknowledged!',
        description: 'Moving to the next document...'
      });
      setSelectedHandbook(null);
      
      // Move to next unacknowledged
      const nextUnack = handbooks.findIndex((h, i) => 
        i > currentIndex && !isAcknowledged(h.id) && h.id !== selectedHandbook.id
      );
      if (nextUnack !== -1) {
        setCurrentIndex(nextUnack);
      } else {
        // Check if all are done
        const allAcknowledged = handbooks.every(h => 
          h.id === selectedHandbook.id || isAcknowledged(h.id)
        );
        if (allAcknowledged) {
          setCurrentIndex(handbooks.length); // Show completion
        }
      }
    }
    
    setSubmitting(false);
  };

  const openHandbook = (handbook: Handbook, index: number) => {
    setSelectedHandbook(handbook);
    setCurrentIndex(index);
    setHasReadContent(false);
  };

  const acknowledgedCount = handbooks.filter(h => isAcknowledged(h.id)).length;
  const totalCount = handbooks.length;
  const progress = totalCount > 0 ? (acknowledgedCount / totalCount) * 100 : 0;
  const isComplete = acknowledgedCount === totalCount && totalCount > 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (handbooks.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <Card className="p-12 text-center max-w-lg mx-auto">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="font-display text-2xl mb-2">ALL SET!</h2>
            <p className="text-muted-foreground font-sans mb-6">
              No onboarding documents are assigned to your role.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="font-display">
              GO TO DASHBOARD
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl lg:text-4xl mb-2">
            {isComplete ? '🎉 ONBOARDING COMPLETE!' : 'WELCOME ABOARD'}
          </h1>
          <p className="text-muted-foreground font-sans max-w-md mx-auto">
            {isComplete 
              ? "You've completed all required onboarding documents. You're ready to go!"
              : "Please review and acknowledge each of the following documents to complete your onboarding."
            }
          </p>
        </div>

        {/* Progress */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display text-sm tracking-wider">ONBOARDING PROGRESS</span>
            <span className="font-sans text-sm text-muted-foreground">
              {acknowledgedCount} of {totalCount} complete
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </Card>

        {/* Completion State */}
        {isComplete ? (
          <Card className="p-12 text-center">
            <PartyPopper className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="font-display text-2xl mb-2">YOU'RE ALL SET!</h2>
            <p className="text-muted-foreground font-sans mb-6 max-w-md mx-auto">
              You've reviewed and acknowledged all required onboarding documents. 
              You're ready to start your journey!
            </p>
            <Button onClick={() => navigate('/dashboard')} size="lg" className="font-display">
              <Sparkles className="w-4 h-4 mr-2" />
              START YOUR JOURNEY
            </Button>
          </Card>
        ) : (
          /* Document List */
          <div className="space-y-3">
            {handbooks.map((handbook, index) => {
              const acknowledged = isAcknowledged(handbook.id);
              const isCurrent = index === currentIndex && !acknowledged;
              
              return (
                <Card 
                  key={handbook.id} 
                  className={`p-5 transition-all ${
                    acknowledged 
                      ? 'border-primary/30 bg-primary/5' 
                      : isCurrent 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Step number or check */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display text-sm ${
                      acknowledged 
                        ? 'bg-primary text-primary-foreground' 
                        : isCurrent 
                          ? 'bg-foreground text-background' 
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {acknowledged ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sans font-medium">{handbook.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        v{handbook.version}
                      </p>
                    </div>

                    {/* Action */}
                    {acknowledged ? (
                      <span className="text-xs text-primary font-sans">Completed</span>
                    ) : isCurrent ? (
                      <Button 
                        onClick={() => openHandbook(handbook, index)}
                        className="font-display text-xs"
                      >
                        REVIEW <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground font-sans">Pending</span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Handbook Detail Dialog */}
        <Dialog open={!!selectedHandbook} onOpenChange={(open) => !open && setSelectedHandbook(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
            {selectedHandbook && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span className="px-2 py-0.5 bg-muted rounded">
                      Step {currentIndex + 1} of {totalCount}
                    </span>
                  </div>
                  <DialogTitle className="font-display text-xl">
                    {selectedHandbook.title}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Version {selectedHandbook.version}
                  </p>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto mt-4 space-y-4">
                  {selectedHandbook.content && (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {selectedHandbook.content}
                      </div>
                    </div>
                  )}

                  {selectedHandbook.file_url && (
                    <Button asChild variant="outline" className="w-full font-display">
                      <a href={selectedHandbook.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" />
                        DOWNLOAD & REVIEW FILE
                      </a>
                    </Button>
                  )}

                  {!selectedHandbook.content && !selectedHandbook.file_url && (
                    <p className="text-muted-foreground text-center py-8">
                      No content available for this document.
                    </p>
                  )}
                </div>

                <DialogFooter className="mt-6 border-t pt-4">
                  <div className="w-full space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                      <Checkbox
                        id="read-confirm"
                        checked={hasReadContent}
                        onCheckedChange={(checked) => setHasReadContent(checked === true)}
                        className="mt-0.5"
                      />
                      <label 
                        htmlFor="read-confirm" 
                        className="text-sm font-sans leading-tight cursor-pointer"
                      >
                        I confirm that I have read, understood, and agree to comply with the contents of this document.
                      </label>
                    </div>
                    <Button 
                      onClick={handleAcknowledge} 
                      disabled={!hasReadContent || submitting}
                      className="w-full font-display"
                      size="lg"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          ACKNOWLEDGE & CONTINUE
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
