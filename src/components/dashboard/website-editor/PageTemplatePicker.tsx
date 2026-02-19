import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PAGE_TEMPLATES, type PageTemplate } from '@/data/page-templates';
import { FileText } from 'lucide-react';

interface PageTemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: PageTemplate) => void;
}

export function PageTemplatePicker({ open, onOpenChange, onSelect }: PageTemplatePickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Page Templates</DialogTitle>
          <DialogDescription>
            Apply a pre-built page layout. This will replace the current page's sections.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-2">
          {PAGE_TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => {
                onSelect(template);
                onOpenChange(false);
              }}
              className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
            >
              <div className="p-2 rounded-md bg-muted">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{template.name}</span>
                  <Badge variant="outline" className="text-[9px]">{template.sections.length} sections</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{template.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
