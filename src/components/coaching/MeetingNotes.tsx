import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Lock, Eye, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { useMeetingNotes, useCreateMeetingNote, useUpdateMeetingNote, useDeleteMeetingNote, type TopicCategory, type MeetingNote } from '@/hooks/useMeetingNotes';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const topicCategories: { value: TopicCategory; label: string; color: string }[] = [
  { value: 'performance', label: 'Performance', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'goals', label: 'Goals', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  { value: 'feedback', label: 'Feedback', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  { value: 'development', label: 'Development', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  { value: 'personal', label: 'Personal', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300' },
  { value: 'other', label: 'Other', color: 'bg-muted text-muted-foreground' },
];

interface MeetingNotesProps {
  meetingId: string;
  isCoach: boolean;
}

export function MeetingNotes({ meetingId, isCoach }: MeetingNotesProps) {
  const { user } = useAuth();
  const { data: notes, isLoading } = useMeetingNotes(meetingId);
  const createNote = useCreateMeetingNote();
  const updateNote = useUpdateMeetingNote();
  const deleteNote = useDeleteMeetingNote();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<TopicCategory>('other');
  const [isPrivate, setIsPrivate] = useState(false);

  const resetForm = () => {
    setContent('');
    setCategory('other');
    setIsPrivate(false);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    if (editingId) {
      await updateNote.mutateAsync({
        id: editingId,
        meeting_id: meetingId,
        content,
        topic_category: category,
        is_private: isPrivate,
      });
    } else {
      await createNote.mutateAsync({
        meeting_id: meetingId,
        content,
        topic_category: category,
        is_private: isPrivate,
      });
    }
    resetForm();
  };

  const handleEdit = (note: MeetingNote) => {
    setEditingId(note.id);
    setContent(note.content);
    setCategory(note.topic_category);
    setIsPrivate(note.is_private);
    setIsAdding(true);
  };

  const handleDelete = async (noteId: string) => {
    await deleteNote.mutateAsync({ id: noteId, meeting_id: meetingId });
  };

  const getCategoryBadge = (cat: TopicCategory) => {
    const found = topicCategories.find(c => c.value === cat);
    return found ? (
      <Badge variant="outline" className={found.color}>
        {found.label}
      </Badge>
    ) : null;
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading notes...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Meeting Notes</CardTitle>
        {isCoach && !isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Note
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Topic Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as TopicCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {topicCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="private"
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                  />
                  <Label htmlFor="private" className="flex items-center gap-1">
                    {isPrivate ? <Lock className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {isPrivate ? 'Private' : 'Shared'}
                  </Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Note Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your meeting notes..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!content.trim() || createNote.isPending || updateNote.isPending}>
                <Save className="h-4 w-4 mr-1" />
                {editingId ? 'Update' : 'Save'}
              </Button>
              <Button variant="ghost" onClick={resetForm}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {notes?.length === 0 && !isAdding && (
          <p className="text-muted-foreground text-sm text-center py-4">
            No notes yet. {isCoach && 'Click "Add Note" to get started.'}
          </p>
        )}

        <div className="space-y-3">
          {notes?.map((note) => (
            <div key={note.id} className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryBadge(note.topic_category)}
                  {note.is_private && (
                    <Badge variant="secondary" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Private
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                  {isCoach && note.coach_id === user?.id && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(note)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Note?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(note.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
