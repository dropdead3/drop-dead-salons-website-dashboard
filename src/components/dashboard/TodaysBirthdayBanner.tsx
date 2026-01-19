import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PartyPopper, Cake, Eye } from 'lucide-react';
import { useTodaysBirthdays } from '@/hooks/useBirthdays';
import { motion, AnimatePresence } from 'framer-motion';
import { useViewAs } from '@/contexts/ViewAsContext';
import { cn } from '@/lib/utils';

export function TodaysBirthdayBanner() {
  const { data: todaysBirthdays, isLoading } = useTodaysBirthdays();
  const { isViewingAsUser } = useViewAs();

  if (isLoading || !todaysBirthdays || todaysBirthdays.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-white rounded-xl p-4 mb-6 shadow-lg"
      >
        <div className="flex items-center flex-wrap gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <PartyPopper className="w-5 h-5" />
            <span className="font-display text-sm tracking-wide">
              🎂 BIRTHDAY{todaysBirthdays.length > 1 ? 'S' : ''} TODAY!
            </span>
          </div>
          
          <div className="flex items-center flex-wrap gap-3">
            {todaysBirthdays.map((person, index) => (
              <div 
                key={person.id} 
                className={cn(
                  "flex items-center gap-2 backdrop-blur-sm rounded-full pl-1 pr-3 py-1",
                  isViewingAsUser && person.isCurrentUser 
                    ? "bg-white/40 ring-2 ring-white shadow-lg" 
                    : "bg-white/20"
                )}
              >
                <Avatar className={cn(
                  "w-6 h-6 border-2",
                  isViewingAsUser && person.isCurrentUser 
                    ? "border-white" 
                    : "border-white/30"
                )}>
                  <AvatarImage src={person.photo_url || undefined} />
                  <AvatarFallback className="bg-white/20 text-white text-xs">
                    {(person.display_name || person.full_name)?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium flex items-center gap-1">
                  {person.display_name || person.full_name}
                  {isViewingAsUser && person.isCurrentUser && (
                    <Eye className="w-3 h-3" />
                  )}
                </span>
                {index === 0 && <Cake className="w-4 h-4 ml-1" />}
              </div>
            ))}
          </div>
          
          <span className="text-sm opacity-80 ml-auto hidden sm:block">
            Wish them a happy birthday! 🎉
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
