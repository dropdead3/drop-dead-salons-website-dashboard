import { cn } from '@/lib/utils';

interface RoleColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export const ROLE_COLORS = [
  { name: 'red', bg: 'bg-red-500', text: 'text-red-500', preview: 'bg-red-100' },
  { name: 'orange', bg: 'bg-orange-500', text: 'text-orange-500', preview: 'bg-orange-100' },
  { name: 'yellow', bg: 'bg-yellow-500', text: 'text-yellow-500', preview: 'bg-yellow-100' },
  { name: 'green', bg: 'bg-green-500', text: 'text-green-500', preview: 'bg-green-100' },
  { name: 'cyan', bg: 'bg-cyan-500', text: 'text-cyan-500', preview: 'bg-cyan-100' },
  { name: 'blue', bg: 'bg-blue-500', text: 'text-blue-500', preview: 'bg-blue-100' },
  { name: 'purple', bg: 'bg-purple-500', text: 'text-purple-500', preview: 'bg-purple-100' },
  { name: 'pink', bg: 'bg-pink-500', text: 'text-pink-500', preview: 'bg-pink-100' },
  { name: 'gray', bg: 'bg-gray-500', text: 'text-gray-500', preview: 'bg-gray-100' },
];

export function RoleColorPicker({ value, onChange }: RoleColorPickerProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {ROLE_COLORS.map((color) => (
          <button
            key={color.name}
            type="button"
            onClick={() => onChange(color.name)}
            className={cn(
              'w-8 h-8 rounded-full transition-all',
              color.bg,
              value === color.name 
                ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                : 'hover:scale-105'
            )}
            title={color.name}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Preview:</span>
        <span className={cn(
          'px-2 py-0.5 rounded-full text-xs font-medium',
          getRoleColorClasses(value).bg,
          getRoleColorClasses(value).text
        )}>
          Role Name
        </span>
      </div>
    </div>
  );
}

export function getRoleColorClasses(colorName: string): { bg: string; text: string } {
  const colorMap: Record<string, { bg: string; text: string }> = {
    red: { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-700 dark:text-red-300' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300' },
    yellow: { bg: 'bg-yellow-100 dark:bg-yellow-950', text: 'text-yellow-700 dark:text-yellow-300' },
    green: { bg: 'bg-green-100 dark:bg-green-950', text: 'text-green-700 dark:text-green-300' },
    cyan: { bg: 'bg-cyan-100 dark:bg-cyan-950', text: 'text-cyan-700 dark:text-cyan-300' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300' },
    pink: { bg: 'bg-pink-100 dark:bg-pink-950', text: 'text-pink-700 dark:text-pink-300' },
    gray: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
  };
  return colorMap[colorName] || colorMap.gray;
}
