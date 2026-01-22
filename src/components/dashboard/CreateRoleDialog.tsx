import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { RoleColorPicker } from './RoleColorPicker';
import { RoleIconPicker } from './RoleIconPicker';
import { Role, useCreateRole, useUpdateRole } from '@/hooks/useRoles';

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editRole?: Role | null;
}

export function CreateRoleDialog({ open, onOpenChange, editRole }: CreateRoleDialogProps) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('blue');
  const [icon, setIcon] = useState('User');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const isEditing = !!editRole;
  const isPending = createRole.isPending || updateRole.isPending;

  // Populate form when editing
  useEffect(() => {
    if (editRole) {
      setName(editRole.name);
      setDisplayName(editRole.display_name);
      setDescription(editRole.description || '');
      setColor(editRole.color);
      setIcon(editRole.icon);
    } else {
      resetForm();
    }
  }, [editRole, open]);

  const resetForm = () => {
    setName('');
    setDisplayName('');
    setDescription('');
    setColor('blue');
    setIcon('User');
    setErrors({});
  };

  // Auto-generate name from display name
  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    if (!isEditing) {
      // Convert to snake_case for internal name
      const generatedName = value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      setName(generatedName);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Internal name is required';
    } else if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      newErrors.name = 'Must start with letter, contain only lowercase letters, numbers, and underscores';
    }

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (isEditing && editRole) {
      await updateRole.mutateAsync({
        id: editRole.id,
        data: {
          display_name: displayName,
          description: description || undefined,
          color,
          icon,
        },
      });
    } else {
      await createRole.mutateAsync({
        name,
        display_name: displayName,
        description: description || undefined,
        color,
        icon,
      });
    }

    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Role' : 'Create New Role'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the role details. System roles can have their display properties changed but not their internal name.'
              : 'Define a new role for your team. The internal name cannot be changed after creation.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              placeholder="e.g., Senior Stylist"
              value={displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              className={errors.displayName ? 'border-destructive' : ''}
              disabled={isPending}
            />
            {errors.displayName && (
              <p className="text-xs text-destructive">{errors.displayName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Internal Name *</Label>
            <Input
              id="name"
              placeholder="e.g., senior_stylist"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? 'border-destructive' : ''}
              disabled={isEditing || isPending}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Used in code and database. Cannot be changed after creation.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What can people with this role do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <RoleColorPicker value={color} onChange={setColor} />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <RoleIconPicker value={icon} onChange={setIcon} />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isEditing ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Save Changes' : 'Create Role'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
