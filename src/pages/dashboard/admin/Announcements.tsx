import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Megaphone, 
  Pin, 
  Trash2, 
  Edit2, 
  Loader2,
  AlertTriangle,
  Info,
  AlertCircle,
  Bell
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

type Priority = 'low' | 'normal' | 'high' | 'urgent';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: Priority;
  is_pinned: boolean;
  is_active: boolean;
  author_id: string;
  expires_at: string | null;
  created_at: string;
}

const priorityConfig: Record<Priority, { label: string; icon: React.ReactNode; color: string }> = {
  low: { label: 'Low', icon: <Info className="w-4 h-4" />, color: 'text-muted-foreground' },
  normal: { label: 'Normal', icon: <Bell className="w-4 h-4" />, color: 'text-blue-600' },
  high: { label: 'High', icon: <AlertCircle className="w-4 h-4" />, color: 'text-orange-600' },
  urgent: { label: 'Urgent', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-600' },
};

export default function Announcements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [isPinned, setIsPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newAnnouncement: Omit<Announcement, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('announcements')
        .insert(newAnnouncement);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement created');
      resetForm();
      setIsCreateOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to create announcement');
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Announcement> & { id: string }) => {
      const { error } = await supabase
        .from('announcements')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement updated');
      resetForm();
      setEditingAnnouncement(null);
    },
    onError: (error) => {
      toast.error('Failed to update announcement');
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete announcement');
      console.error(error);
    },
  });

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPriority('normal');
    setIsPinned(false);
    setExpiresAt('');
  };

  const handleCreate = () => {
    if (!user) return;
    createMutation.mutate({
      title,
      content,
      priority,
      is_pinned: isPinned,
      is_active: true,
      author_id: user.id,
      expires_at: expiresAt || null,
    });
  };

  const handleUpdate = () => {
    if (!editingAnnouncement) return;
    updateMutation.mutate({
      id: editingAnnouncement.id,
      title,
      content,
      priority,
      is_pinned: isPinned,
      expires_at: expiresAt || null,
    });
  };

  const openEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setPriority(announcement.priority);
    setIsPinned(announcement.is_pinned);
    setExpiresAt(announcement.expires_at?.split('T')[0] || '');
  };

  const toggleActive = (announcement: Announcement) => {
    updateMutation.mutate({
      id: announcement.id,
      is_active: !announcement.is_active,
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl lg:text-4xl mb-2">Announcements</h1>
            <p className="text-muted-foreground font-sans">
              Post updates and news for the team
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">Create Announcement</DialogTitle>
              </DialogHeader>
              <AnnouncementForm
                title={title}
                setTitle={setTitle}
                content={content}
                setContent={setContent}
                priority={priority}
                setPriority={setPriority}
                isPinned={isPinned}
                setIsPinned={setIsPinned}
                expiresAt={expiresAt}
                setExpiresAt={setExpiresAt}
                onSubmit={handleCreate}
                isLoading={createMutation.isPending}
                submitLabel="Create Announcement"
              />
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : announcements?.length === 0 ? (
          <Card className="p-12 text-center">
            <Megaphone className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-display text-lg mb-2">No Announcements</h3>
            <p className="text-sm text-muted-foreground font-sans">
              Create your first announcement to share news with the team.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements?.map((announcement) => (
              <Card 
                key={announcement.id} 
                className={`p-6 ${!announcement.is_active ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {announcement.is_pinned && (
                        <Pin className="w-4 h-4 text-foreground" />
                      )}
                      <span className={`flex items-center gap-1 text-xs font-medium ${priorityConfig[announcement.priority].color}`}>
                        {priorityConfig[announcement.priority].icon}
                        {priorityConfig[announcement.priority].label}
                      </span>
                      {!announcement.is_active && (
                        <span className="text-xs bg-muted px-2 py-0.5">Inactive</span>
                      )}
                    </div>
                    <h3 className="font-display text-lg mb-2">{announcement.title}</h3>
                    <p className="text-sm text-muted-foreground font-sans whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-4">
                      Posted {format(new Date(announcement.created_at), 'MMM d, yyyy h:mm a')}
                      {announcement.expires_at && (
                        <span> · Expires {format(new Date(announcement.expires_at), 'MMM d, yyyy')}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(announcement)}
                      title={announcement.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <Switch checked={announcement.is_active} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(announcement)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Delete this announcement?')) {
                          deleteMutation.mutate(announcement.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingAnnouncement} onOpenChange={(open) => !open && setEditingAnnouncement(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">Edit Announcement</DialogTitle>
            </DialogHeader>
            <AnnouncementForm
              title={title}
              setTitle={setTitle}
              content={content}
              setContent={setContent}
              priority={priority}
              setPriority={setPriority}
              isPinned={isPinned}
              setIsPinned={setIsPinned}
              expiresAt={expiresAt}
              setExpiresAt={setExpiresAt}
              onSubmit={handleUpdate}
              isLoading={updateMutation.isPending}
              submitLabel="Save Changes"
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

interface AnnouncementFormProps {
  title: string;
  setTitle: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  priority: Priority;
  setPriority: (v: Priority) => void;
  isPinned: boolean;
  setIsPinned: (v: boolean) => void;
  expiresAt: string;
  setExpiresAt: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  submitLabel: string;
}

function AnnouncementForm({
  title,
  setTitle,
  content,
  setContent,
  priority,
  setPriority,
  isPinned,
  setIsPinned,
  expiresAt,
  setExpiresAt,
  onSubmit,
  isLoading,
  submitLabel,
}: AnnouncementFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Announcement title"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your announcement..."
          rows={4}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="expires">Expires (optional)</Label>
          <Input
            id="expires"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Switch
          id="pinned"
          checked={isPinned}
          onCheckedChange={setIsPinned}
        />
        <Label htmlFor="pinned" className="font-normal">Pin to top</Label>
      </div>
      
      <Button 
        onClick={onSubmit} 
        disabled={isLoading || !title.trim() || !content.trim()}
        className="w-full"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : submitLabel}
      </Button>
    </div>
  );
}
