import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PartyPopper, Cake, Eye, MessageCircle } from 'lucide-react';
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
            {todaysBirthdays.map((person, index) => {
              const isOwnBirthday = person.user_id === user?.id;
              const canDM = !isOwnBirthday && person.user_id;
              return (
              <motion.div 
                key={person.id} 
                onClick={canDM ? () => handleSendDM(person.user_id) : undefined}
                whileHover={canDM ? { scale: 1.03 } : undefined}
                whileTap={canDM ? { scale: 0.97 } : undefined}
                className={cn(
                  "flex items-center gap-2 backdrop-blur-sm rounded-full pl-1 py-1 transition-colors group",
                  isViewingAsUser && person.isCurrentUser 
                    ? "bg-background/40 ring-2 ring-background shadow-lg pr-3" 
                    : "bg-background/20 pr-3",
                  canDM && "cursor-pointer hover:bg-background/35 hover:shadow-md"
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
                <span className="text-sm font-medium flex items-center gap-1 whitespace-nowrap">
                  {person.display_name || person.full_name}
                  {isViewingAsUser && person.isCurrentUser && (
                    <Eye className="w-3 h-3" />
                  )}
                </span>
                {index === 0 && <Cake className="w-4 h-4 shrink-0" />}
                {canDM && (
                  <motion.span 
                    className="inline-flex items-center gap-1 overflow-hidden rounded-full bg-background/20 group-hover:bg-background/40 transition-colors ml-1 shrink-0"
                    initial={false}
                    whileHover={{ }}
                  >
                    <span className="flex items-center gap-1 px-1.5 py-0.5">
                      <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-xs font-medium max-w-0 overflow-hidden group-hover:max-w-[4rem] transition-all duration-300 ease-out whitespace-nowrap">
                        DM
                      </span>
                    </span>
                  </motion.span>
                )}
              </motion.div>
            );
            })}
          </div>
          
          <span className="text-sm opacity-80 ml-auto hidden sm:block">
            Wish them a happy birthday! 🎉
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
