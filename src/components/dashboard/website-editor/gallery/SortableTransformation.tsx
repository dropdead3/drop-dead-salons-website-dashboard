import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Eye, EyeOff, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GalleryTransformation } from '@/hooks/useGalleryImages';

interface SortableTransformationProps {
  transform: GalleryTransformation;
  onToggleVisibility: (id: string, currentVisibility: boolean) => void;
  onDelete: (id: string) => void;
}

export function SortableTransformation({
  transform,
  onToggleVisibility,
  onDelete,
}: SortableTransformationProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform: dragTransform,
    transition,
    isDragging,
  } = useSortable({ id: transform.id });

  const style = {
    transform: CSS.Transform.toString(dragTransform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'overflow-hidden transition-opacity group',
        !transform.is_visible && 'opacity-60',
        isDragging && 'z-50 shadow-xl opacity-90'
      )}
    >
      <div className="grid grid-cols-2 gap-1 relative">
        <div className="aspect-[3/4] relative">
          <img
            src={transform.before_image}
            alt={transform.before_label}
            className="w-full h-full object-cover"
          />
          <Badge className="absolute bottom-2 left-2">{transform.before_label}</Badge>
        </div>
        <div className="aspect-[3/4] relative">
          <img
            src={transform.after_image}
            alt={transform.after_label}
            className="w-full h-full object-cover"
          />
          <Badge className="absolute bottom-2 right-2">{transform.after_label}</Badge>
        </div>
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 backdrop-blur-sm cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!transform.is_visible && (
            <Badge variant="outline">Hidden</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleVisibility(transform.id, transform.is_visible)}
          >
            {transform.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Transformation?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove this before/after comparison.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(transform.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
