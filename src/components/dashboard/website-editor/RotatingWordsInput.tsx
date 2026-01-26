import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RotatingWordsInputProps {
  words: string[];
  onChange: (words: string[]) => void;
  label?: string;
  placeholder?: string;
}

export function RotatingWordsInput({ 
  words, 
  onChange, 
  label = "Rotating Words",
  placeholder = "Add a word..."
}: RotatingWordsInputProps) {
  const [newWord, setNewWord] = useState('');

  const handleAddWord = () => {
    if (newWord.trim()) {
      onChange([...words, newWord.trim()]);
      setNewWord('');
    }
  };

  const handleRemoveWord = (index: number) => {
    onChange(words.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddWord();
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">{label}</label>
      
      {/* Current words */}
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {words.map((word, index) => (
          <Badge 
            key={index} 
            variant="secondary"
            className="pl-3 pr-1.5 py-1.5 gap-1.5 text-sm"
          >
            {word}
            <button
              onClick={() => handleRemoveWord(index)}
              className="p-0.5 hover:bg-foreground/10 rounded transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      
      {/* Add new word */}
      <div className="flex gap-2">
        <Input
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button 
          type="button"
          variant="outline" 
          size="icon"
          onClick={handleAddWord}
          disabled={!newWord.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
