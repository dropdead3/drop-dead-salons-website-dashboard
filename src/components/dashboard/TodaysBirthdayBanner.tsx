import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PartyPopper, Cake, Eye, Send } from 'lucide-react';
import { useTodaysBirthdays } from '@/hooks/useBirthdays';
import { motion, AnimatePresence } from 'framer-motion';
import { useViewAs } from '@/contexts/ViewAsContext';
import { useNavigate } from 'react-router-dom';
import { useDMChannels } from '@/hooks/team-chat/useDMChannels';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function TodaysBirthdayBanner() {
  const { data: todaysBirthdays, isLoading } = useTodaysBirthdays();
  const { isViewingAsUser } = useViewAs();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createDM, isCreating } = useDMChannels();

  const handleSendDM = async (userId: string) => {
    if (isCreating) return;
    try {
      const channel = await createDM(userId);
      navigate('/dashboard/team-chat', { state: { openChannelId: channel.id } });
    } catch {
      // error handled by useDMChannels toast
    }
  };

  if (isLoading || !todaysBirthdays || todaysBirthdays.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="relative rounded-xl mb-6 overflow-hidden"
        style={{
          padding: '1.5px',
          background: 'linear-gradient(90deg, rgba(236,72,153,0.5), rgba(168,85,247,0.5), rgba(236,72,153,0.5))',
          boxShadow: '0 0 20px rgba(168,85,247,0.25)',
        }}
      >
        {/* Animated sheen on the stroke only */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: 5,
            ease: 'easeInOut',
          }}
          style={{
            width: '35%',
            background: 'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0) 25%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 55%, rgba(255,255,255,0) 75%, transparent 100%)',
          }}
        />
        <div className="relative z-[1] bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-white rounded-[calc(0.75rem-1.5px)] p-4 overflow-hidden">
          <div className="relative flex items-center flex-wrap gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <PartyPopper className="w-5 h-5" />
              <span className="font-display text-sm tracking-wide">
                BIRTHDAY{todaysBirthdays.length > 1 ? 'S' : ''} TODAY!
              </span>
            </div>
            
            <div className="flex items-center flex-wrap gap-3">
              {todaysBirthdays.map((person, index) => {
                const isOwnBirthday = isViewingAsUser ? person.isCurrentUser : person.user_id === user?.id;
                const canDM = !isOwnBirthday && !!person.user_id;
                return (
                <motion.div 
                  key={person.id} 
                  role={canDM ? "button" : undefined}
                  tabIndex={canDM ? 0 : undefined}
                  onClick={canDM ? () => handleSendDM(person.user_id) : undefined}
                  whileHover={canDM ? { scale: 1.04 } : undefined}
                  whileTap={canDM ? { scale: 0.96 } : undefined}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className={cn(
                    "flex items-center gap-1.5 backdrop-blur-sm rounded-full pl-0.5 pr-2.5 py-0.5 group",
                    isViewingAsUser && person.isCurrentUser 
                      ? "bg-background/40 ring-2 ring-background shadow-lg" 
                      : "bg-background/20",
                    canDM && "cursor-pointer hover:bg-background/30 transition-all duration-200"
                  )}
                >
                  <Avatar className={cn(
                    "w-6 h-6 border-2 shrink-0",
                    isViewingAsUser && person.isCurrentUser 
                      ? "border-background" 
                      : "border-background/30"
                  )}>
                    <AvatarImage src={person.photo_url || undefined} />
                    <AvatarFallback className="bg-background/20 text-background text-xs">
                      {(person.display_name || person.full_name)?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium whitespace-nowrap flex items-center gap-1">
                    {person.display_name || person.full_name}
                    {isViewingAsUser && person.isCurrentUser && (
                      <Eye className="w-3 h-3" />
                    )}
                  </span>
                  {!canDM && <Cake className="w-3.5 h-3.5 shrink-0 opacity-80" />}
                  {canDM && (
                    <Send className="w-3.5 h-3.5 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity duration-200" />
                  )}
                </motion.div>
              );
              })}
            </div>
            
            <span className="text-sm opacity-80 ml-auto hidden sm:block">
              Wish them a happy birthday! 🎉
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
