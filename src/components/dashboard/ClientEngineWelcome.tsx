import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Target, 
  Flame, 
  Heart, 
  Trophy, 
  Sparkles,
  ChevronRight,
  Clock,
  CheckCircle2,
  Star,
  Zap
} from 'lucide-react';
import { ColoredLogo } from './ColoredLogo';
import { useProgramConfig, useProgramRules, useDailyTasks, ProgramConfig } from '@/hooks/useProgramConfig';

interface WelcomePageContent {
  headline?: string;
  subheadline?: string;
  ctaText?: string;
}

interface ClientEngineWelcomeProps {
  onStartProgram: () => void;
  isPreview?: boolean;
  previewConfig?: ProgramConfig | null;
  contentOverrides?: WelcomePageContent;
}

export function ClientEngineWelcome({ onStartProgram, isPreview = false, previewConfig, contentOverrides }: ClientEngineWelcomeProps) {
  const { config: savedConfig } = useProgramConfig();
  const { rules } = useProgramRules();
  const { tasks } = useDailyTasks();
  const [isHovered, setIsHovered] = useState(false);

  // Use previewConfig (unsaved state) if provided, otherwise fall back to saved config
  const config = previewConfig || savedConfig;

  const totalDays = config?.total_days || 75;
  const totalPasses = config?.life_happens_passes_total || 2;
  const programName = config?.program_name || 'Client Engine';
  const logoUrl = config?.logo_url;
  const logoSize = config?.logo_size || 64;
  const logoColor = config?.logo_color;

  // Content with overrides
  const headline = contentOverrides?.headline || 'BUILD YOUR CLIENT ENGINE';
  const subheadline = contentOverrides?.subheadline || `${totalDays} days of focused execution. No shortcuts. No excuses. Transform your book and build a business that runs on autopilot.`;
  const ctaText = contentOverrides?.ctaText || "I'M READY — START DAY 1";

  const highlights = [
    {
      icon: Target,
      title: '75 Consecutive Days',
      description: 'Build unstoppable momentum with daily consistency'
    },
    {
      icon: Flame,
      title: 'Streak-Based System',
      description: 'Watch your progress compound day after day'
    },
    {
      icon: Heart,
      title: `${totalPasses} Life Happens Passes`,
      description: 'Grace for when life throws curveballs'
    },
    {
      icon: Trophy,
      title: 'Weekly Wins',
      description: 'Celebrate milestones every 7 days'
    }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div 
      className="min-h-[80vh] flex items-center justify-center py-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-4xl mx-auto px-6">
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-8 flex justify-center"
          >
            <ColoredLogo 
              logoUrl={logoUrl} 
              color={logoColor}
              size={logoSize}
              alt={programName}
            />
          </motion.div>
          
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-xs tracking-wider font-display uppercase">
            <Sparkles className="w-3 h-3 mr-2" />
            {totalDays}-Day Transformation
          </Badge>
          
          <h1 className="font-display text-3xl lg:text-4xl tracking-wide mb-4 text-balance">
            {headline}
          </h1>
          
          <p className="text-muted-foreground font-sans text-lg max-w-xl mx-auto leading-relaxed">
            {subheadline}
          </p>
        </motion.div>

        {/* Highlights Grid */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          {highlights.map((highlight) => (
            <motion.div
              key={highlight.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-5 h-full bg-gradient-to-br from-card to-muted/30 border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                <highlight.icon className="w-6 h-6 text-primary mb-3" />
                <h3 className="font-display text-xs tracking-wide mb-1.5">{highlight.title}</h3>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">{highlight.description}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* The Commitment Card */}
        <motion.div variants={itemVariants}>
          <Card className="p-8 mb-8 bg-gradient-to-br from-background via-card to-muted/20 border-border/50 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg tracking-wide">THE COMMITMENT</h2>
                <p className="text-xs text-muted-foreground">What you're signing up for</p>
              </div>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {/* Daily Tasks Preview */}
              <div className="bg-muted/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="font-display text-sm tracking-wide">DAILY TASKS</span>
                </div>
                <ul className="space-y-2.5">
                  {tasks.slice(0, 5).map((task, i) => (
                    <li key={task.id} className="flex items-start gap-3 text-sm font-sans">
                      <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground">{task.label}</span>
                    </li>
                  ))}
                  {tasks.length > 5 && (
                    <li className="text-xs text-muted-foreground pl-8">
                      + {tasks.length - 5} more tasks
                    </li>
                  )}
                </ul>
              </div>

              {/* Rules Preview */}
              <div className="bg-muted/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="font-display text-sm tracking-wide">THE RULES</span>
                </div>
                <ul className="space-y-2.5">
                  {rules.slice(0, 5).map((rule) => (
                    <li key={rule.id} className="flex items-start gap-3 text-sm font-sans">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                        rule.is_emphasized 
                          ? 'bg-primary text-primary-foreground font-medium' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {rule.rule_number}
                      </span>
                      <span className={rule.is_emphasized ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                        {rule.rule_text}
                      </span>
                    </li>
                  ))}
                  {rules.length > 5 && (
                    <li className="text-xs text-muted-foreground pl-8">
                      + {rules.length - 5} more rules
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Only begin when you're ready</p>
                <p className="text-xs text-muted-foreground">
                  This program requires {totalDays} consecutive days of execution. 
                  Miss a day and you restart from Day 1. You get {totalPasses} Life Happens Passes—use them wisely.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* CTA Section */}
        <motion.div variants={itemVariants} className="text-center">
          <Button
            onClick={isPreview ? undefined : onStartProgram}
            size="lg"
            className="font-display tracking-wider px-10 py-7 text-base bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-xl hover:shadow-2xl transition-all duration-300 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={isPreview}
          >
            <Play className={`w-5 h-5 mr-3 transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`} />
            {ctaText}
            <ChevronRight className={`w-5 h-5 ml-2 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
          </Button>
          
          <p className="text-xs text-muted-foreground mt-4 font-sans">
            By starting, you're committing to {totalDays} days of growth.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
