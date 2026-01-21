import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings2, Cake, Calendar, Award } from 'lucide-react';
import { BirthdayWidget } from './BirthdayWidget';
import { WorkScheduleWidgetCompact } from './WorkScheduleWidgetCompact';
import { AnniversaryWidget } from './AnniversaryWidget';

// Widget configuration - add more widgets here as needed
const AVAILABLE_WIDGETS = [
  { id: 'birthdays', label: 'Team Birthdays', icon: Cake },
  { id: 'anniversaries', label: 'Work Anniversaries', icon: Award },
  { id: 'schedule', label: 'My Schedule', icon: Calendar },
] as const;

type WidgetId = typeof AVAILABLE_WIDGETS[number]['id'];

interface WidgetsSectionProps {
  // Allow parent to control enabled widgets if needed
  defaultEnabledWidgets?: WidgetId[];
}

export function WidgetsSection({ defaultEnabledWidgets = ['birthdays', 'anniversaries', 'schedule'] }: WidgetsSectionProps) {
  const [enabledWidgets, setEnabledWidgets] = useState<WidgetId[]>(defaultEnabledWidgets);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleWidget = (widgetId: WidgetId) => {
    setEnabledWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const isWidgetEnabled = (widgetId: WidgetId) => enabledWidgets.includes(widgetId);

  // Don't render if no widgets are enabled
  if (enabledWidgets.length === 0 && !isSettingsOpen) {
    return (
      <div className="flex items-center justify-end">
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <Settings2 className="w-4 h-4" />
              <span className="text-xs">Add Widgets</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display tracking-wide">WIDGET SETTINGS</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {AVAILABLE_WIDGETS.map((widget) => {
                const Icon = widget.icon;
                return (
                  <div key={widget.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{widget.label}</span>
                    </div>
                    <Switch
                      checked={isWidgetEnabled(widget.id)}
                      onCheckedChange={() => toggleWidget(widget.id)}
                    />
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm tracking-wide">WIDGETS</h2>
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Settings2 className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display tracking-wide">WIDGET SETTINGS</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {AVAILABLE_WIDGETS.map((widget) => {
                const Icon = widget.icon;
                return (
                  <div key={widget.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{widget.label}</span>
                    </div>
                    <Switch
                      checked={isWidgetEnabled(widget.id)}
                      onCheckedChange={() => toggleWidget(widget.id)}
                    />
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div 
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${Math.min(enabledWidgets.length, 4)}, minmax(0, 1fr))`,
        }}
      >
        {isWidgetEnabled('birthdays') && <BirthdayWidget />}
        {isWidgetEnabled('anniversaries') && <AnniversaryWidget />}
        {isWidgetEnabled('schedule') && <WorkScheduleWidgetCompact />}
      </div>
    </div>
  );
}
