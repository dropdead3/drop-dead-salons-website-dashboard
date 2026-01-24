import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { format, parseISO, isThisYear } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  ChevronUp, Star, Clock, Rocket, Bug, Sparkles, Lightbulb, ListFilter,
  LayoutList, GitBranch, MessageSquare, Send, ThumbsUp
} from 'lucide-react';
import {
  usePublishedChangelog, useMarkChangelogRead, useVoteChangelog,
  type ChangelogEntry
} from '@/hooks/useChangelog';
import {
  useFeatureRequests, useSubmitFeatureRequest, useVoteFeatureRequest,
  FEATURE_CATEGORIES, type FeatureRequest
} from '@/hooks/useFeatureRequests';
import { ChangelogTimeline } from '@/components/dashboard/ChangelogTimeline';

const ENTRY_TYPE_CONFIG: Record<string, { icon: typeof Sparkles; label: string; color: string }> = {
  update: { icon: Sparkles, label: 'Update', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  feature: { icon: Rocket, label: 'Feature', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  bugfix: { icon: Bug, label: 'Bug Fix', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  improvement: { icon: Lightbulb, label: 'Improvement', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  coming_soon: { icon: Clock, label: 'Coming Soon', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
};

function ChangelogEntryCard({
  entry,
  onVote,
}: {
  entry: ChangelogEntry;
  onVote?: () => void;
}) {
  const typeConfig = ENTRY_TYPE_CONFIG[entry.entry_type] || ENTRY_TYPE_CONFIG.update;
  const TypeIcon = typeConfig.icon;
  const markRead = useMarkChangelogRead();

  // Mark as read when viewed
  useEffect(() => {
    if (!entry.is_read) {
      markRead.mutate(entry.id);
    }
  }, [entry.id, entry.is_read]);

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    return isThisYear(date) ? format(date, 'MMMM d') : format(date, 'MMMM d, yyyy');
  };

  return (
    <Card className={cn(
      'transition-all',
      !entry.is_read && 'ring-2 ring-primary/20'
    )}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {entry.entry_type === 'coming_soon' && onVote && (
            <button
              onClick={onVote}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors',
                entry.user_voted
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-muted-foreground'
              )}
            >
              <ChevronUp className="h-5 w-5" />
              <span className="text-sm font-bold">{entry.vote_count || 0}</span>
            </button>
          )}
          
          <div className="flex-1">
            <div className="flex flex-wrap items-start gap-2 mb-2">
              {entry.is_major && (
                <Star className="h-5 w-5 text-amber-500 fill-amber-500 shrink-0" />
              )}
              {!entry.is_read && (
                <Badge variant="default" className="text-xs">NEW</Badge>
              )}
              <Badge className={cn('text-xs', typeConfig.color)}>
                <TypeIcon className="h-3 w-3 mr-1" />
                {typeConfig.label}
              </Badge>
              {entry.version && (
                <Badge variant="outline" className="text-xs">{entry.version}</Badge>
              )}
            </div>

            <h3 className="text-lg font-semibold mb-2">{entry.title}</h3>
            
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-muted-foreground whitespace-pre-wrap">{entry.content}</p>
            </div>

            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              {entry.published_at && (
                <span>{formatDate(entry.published_at)}</span>
              )}
              {entry.release_date && entry.entry_type === 'coming_soon' && (
                <span>Expected: {formatDate(entry.release_date)}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureRequestCard({
  request,
  onVote,
}: {
  request: FeatureRequest;
  onVote: () => void;
}) {
  const categoryConfig = FEATURE_CATEGORIES.find(c => c.value === request.category);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <button
            onClick={onVote}
            className={cn(
              'flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors',
              request.user_voted
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-muted text-muted-foreground'
            )}
          >
            <ChevronUp className="h-5 w-5" />
            <span className="text-sm font-bold">{request.vote_count || 0}</span>
          </button>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium">{request.title}</h4>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{request.description}</p>
            
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {categoryConfig?.label || request.category}
              </Badge>
              <span>by {request.submitter_name}</span>
            </div>

            {request.admin_response && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm border-l-2 border-primary">
                <p className="text-muted-foreground">{request.admin_response}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Changelog() {
  const [activeTab, setActiveTab] = useState<'list' | 'timeline'>('list');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [newRequest, setNewRequest] = useState({ title: '', description: '', category: 'general' });

  const { data: entries = [], isLoading: entriesLoading } = usePublishedChangelog();
  const { data: requests = [], isLoading: requestsLoading } = useFeatureRequests();
  const voteChangelog = useVoteChangelog();
  const voteRequest = useVoteFeatureRequest();
  const submitRequest = useSubmitFeatureRequest();

  // Split entries
  const recentUpdates = entries.filter(e => e.entry_type !== 'coming_soon');
  const comingSoon = entries.filter(e => e.entry_type === 'coming_soon');

  // Top voted requests (not completed/declined)
  const topRequests = [...requests]
    .filter(r => !['completed', 'declined'].includes(r.status))
    .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
    .slice(0, 5);

  const handleSubmitRequest = async () => {
    if (!newRequest.title || !newRequest.description) return;
    await submitRequest.mutateAsync(newRequest);
    setShowSubmitDialog(false);
    setNewRequest({ title: '', description: '', category: 'general' });
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-wide">WHAT'S NEW</h1>
            <p className="text-muted-foreground">Stay updated on the latest features and improvements</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border bg-muted p-1">
              <Button
                variant={activeTab === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('list')}
                className="gap-2"
              >
                <LayoutList className="h-4 w-4" />
                List
              </Button>
              <Button
                variant={activeTab === 'timeline' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('timeline')}
                className="gap-2"
              >
                <GitBranch className="h-4 w-4" />
                Timeline
              </Button>
            </div>
          </div>
        </div>

        {activeTab === 'list' ? (
          <div className="space-y-8">
            {/* Recent Updates */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Recent Updates
              </h2>
              {entriesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : recentUpdates.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No updates yet. Check back soon!
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {recentUpdates.slice(0, 5).map(entry => (
                    <ChangelogEntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
            </section>

            {/* Coming Soon */}
            {comingSoon.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  Coming Soon
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    Vote to help prioritize!
                  </span>
                </h2>
                <div className="space-y-4">
                  {comingSoon.map(entry => (
                    <ChangelogEntryCard
                      key={entry.id}
                      entry={entry}
                      onVote={() => voteChangelog.mutate({
                        changelogId: entry.id,
                        vote: !entry.user_voted,
                      })}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Top Feature Requests */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-blue-500" />
                  Top Feature Requests
                </h2>
                <Button variant="outline" size="sm" onClick={() => setShowSubmitDialog(true)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Submit Idea
                </Button>
              </div>
              
              {requestsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : topRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground mb-4">No feature requests yet. Be the first!</p>
                    <Button onClick={() => setShowSubmitDialog(true)}>
                      <Send className="h-4 w-4 mr-2" />
                      Submit a Request
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {topRequests.map(request => (
                    <FeatureRequestCard
                      key={request.id}
                      request={request}
                      onVote={() => voteRequest.mutate({
                        requestId: request.id,
                        vote: !request.user_voted,
                      })}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <ChangelogTimeline entries={entries} />
        )}

        {/* Submit Feature Request Dialog */}
        <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit a Feature Request</DialogTitle>
              <DialogDescription>
                Have an idea to improve the platform? Share it with us!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={newRequest.title}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Client Photo Gallery"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newRequest.category}
                  onValueChange={(v) => setNewRequest(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FEATURE_CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your idea and how it would help..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
              <Button
                onClick={handleSubmitRequest}
                disabled={!newRequest.title || !newRequest.description || submitRequest.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
