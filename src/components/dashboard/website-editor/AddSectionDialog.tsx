import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  ImageIcon,
  Video,
  Megaphone,
  Minus,
  Plus,
} from 'lucide-react';
import {
  CUSTOM_SECTION_TYPES,
  CUSTOM_TYPE_INFO,
  type CustomSectionType,
} from '@/hooks/useWebsiteSections';

const TYPE_ICONS: Record<CustomSectionType, React.ElementType> = {
  rich_text: FileText,
  image_text: ImageIcon,
  video: Video,
  custom_cta: Megaphone,
  spacer: Minus,
};

interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (type: CustomSectionType, label: string) => void;
}

export function AddSectionDialog({ open, onOpenChange, onAdd }: AddSectionDialogProps) {
  const [selectedType, setSelectedType] = useState<CustomSectionType | null>(null);
  const [label, setLabel] = useState('');

  const handleAdd = () => {
    if (!selectedType || !label.trim()) return;
    onAdd(selectedType, label.trim());
    setSelectedType(null);
    setLabel('');
    onOpenChange(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setSelectedType(null);
      setLabel('');
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Section</DialogTitle>
          <DialogDescription>Choose a section type and give it a name.</DialogDescription>
        </DialogHeader>

        {!selectedType ? (
          <div className="grid grid-cols-1 gap-2">
            {CUSTOM_SECTION_TYPES.map(type => {
              const info = CUSTOM_TYPE_INFO[type];
              const Icon = TYPE_ICONS[type];
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                >
                  <div className="p-2 rounded-md bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{info.label}</span>
                      <Badge variant="outline" className="text-[9px]">Custom</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{info.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              {(() => { const Icon = TYPE_ICONS[selectedType]; return <Icon className="h-4 w-4" />; })()}
              <span className="text-sm font-medium">{CUSTOM_TYPE_INFO[selectedType].label}</span>
              <Button variant="ghost" size="sm" className="ml-auto h-6 text-xs" onClick={() => setSelectedType(null)}>
                Change
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Section Name</Label>
              <Input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. About Our Philosophy"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!label.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Add Section
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
