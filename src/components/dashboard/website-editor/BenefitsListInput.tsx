import { useState } from 'react';
import { X, Plus, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Reorder } from 'framer-motion';

interface BenefitsListInputProps {
  benefits: string[];
  onChange: (benefits: string[]) => void;
  label?: string;
  placeholder?: string;
}

export function BenefitsListInput({ 
  benefits, 
  onChange, 
  label = "Benefits",
  placeholder = "Add a benefit..."
}: BenefitsListInputProps) {
  const [newBenefit, setNewBenefit] = useState('');

  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      onChange([...benefits, newBenefit.trim()]);
      setNewBenefit('');
    }
  };

  const handleRemoveBenefit = (index: number) => {
    onChange(benefits.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddBenefit();
    }
  };

  const handleReorder = (reordered: string[]) => {
    onChange(reordered);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">{label}</label>
      
      {/* Current benefits */}
      <Reorder.Group 
        axis="y" 
        values={benefits} 
        onReorder={handleReorder}
        className="space-y-2"
      >
        {benefits.map((benefit, index) => (
          <Reorder.Item
            key={benefit}
            value={benefit}
            className="touch-none"
          >
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 cursor-grab active:cursor-grabbing border border-border">
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="flex-1 text-sm">{benefit}</span>
              <button
                onClick={() => handleRemoveBenefit(index)}
                className="p-1 hover:bg-foreground/10 rounded transition-colors"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
      
      {/* Add new benefit */}
      <div className="flex gap-2">
        <Input
          value={newBenefit}
          onChange={(e) => setNewBenefit(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button 
          type="button"
          variant="outline" 
          size="icon"
          onClick={handleAddBenefit}
          disabled={!newBenefit.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
