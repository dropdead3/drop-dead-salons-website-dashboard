import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Check, Copy, Palette, Type, Sparkles, MousePointer, Square, CircleDot, Layers, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { SPECIAL_GRADIENTS } from "@/utils/categoryColors";
import { getRoleColorClasses, ROLE_COLORS } from "@/components/dashboard/RoleColorPicker";

const DesignSystem = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    toast({ title: "Copied!", description: `${label} copied to clipboard` });
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <button
      onClick={() => copyToClipboard(text, label)}
      className="ml-2 p-1 rounded hover:bg-accent transition-colors"
      title="Copy to clipboard"
    >
      {copiedItem === label ? (
        <Check className="h-3 w-3 text-success-foreground" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  );

  // Semantic color tokens
  const semanticColors = [
    { name: "background", variable: "--background", usage: "Page backgrounds", light: "40 30% 96%", dark: "0 0% 4%" },
    { name: "foreground", variable: "--foreground", usage: "Primary text", light: "0 0% 8%", dark: "40 20% 92%" },
    { name: "primary", variable: "--primary", usage: "CTA buttons, links", light: "0 0% 8%", dark: "40 20% 92%" },
    { name: "secondary", variable: "--secondary", usage: "Secondary actions", light: "40 20% 94%", dark: "0 0% 12%" },
    { name: "muted", variable: "--muted", usage: "Disabled states, subtle bg", light: "40 15% 88%", dark: "0 0% 15%" },
    { name: "accent", variable: "--accent", usage: "Highlights, hover states", light: "40 25% 90%", dark: "35 20% 18%" },
    { name: "oat", variable: "--oat", usage: "Brand accent color", light: "35 35% 82%", dark: "35 30% 25%" },
    { name: "gold", variable: "--gold", usage: "Premium badges, awards", light: "38 70% 38%", dark: "38 85% 55%" },
    { name: "success", variable: "--success", usage: "Availability, positive", light: "145 40% 85%", dark: "145 30% 25%" },
    { name: "destructive", variable: "--destructive", usage: "Errors, warnings", light: "0 62% 50%", dark: "0 62% 50%" },
  ];

  // Typography scale
  const typography = [
    { class: "font-display", font: "Termina", weight: "Medium (500 only)", transform: "UPPERCASE, tracking-wide", usage: "Headlines, buttons, navigation" },
    { class: "font-sans", font: "Aeonik Pro", weight: "400-500", transform: "Normal", usage: "Body text, paragraphs" },
    { class: "font-serif", font: "Laguna", weight: "700", transform: "Normal", usage: "Editorial accents (rarely used)" },
    { class: "font-script", font: "Sloop Script", weight: "400", transform: "Normal", usage: "Decorative elements" },
  ];

  // Border radius scale
  const borderRadius = [
    { class: "rounded-none", value: "0", usage: "Sharp edges" },
    { class: "rounded-xs", value: "2px", usage: "Very subtle rounding" },
    { class: "rounded-sm", value: "3px", usage: "Subtle rounding" },
    { class: "rounded-md", value: "5px", usage: "Default inputs" },
    { class: "rounded-lg", value: "10px", usage: "Cards, containers" },
    { class: "rounded-xl", value: "20px", usage: "Large cards" },
    { class: "rounded-2xl", value: "30px", usage: "Premium cards, dialogs" },
    { class: "rounded-3xl", value: "40px", usage: "Hero sections" },
    { class: "rounded-full", value: "9999px", usage: "Pills, avatars, badges" },
  ];

  // Animation classes
  const animations = [
    { class: "animate-fade-in", description: "Fade in with slight upward movement", duration: "0.3s" },
    { class: "animate-fade-in-up", description: "Fade in with more pronounced upward movement", duration: "0.6s" },
    { class: "animate-scale-in", description: "Scale up from 95% with fade", duration: "0.2s" },
    { class: "animate-slide-in-left", description: "Slide in from left", duration: "0.4s" },
    { class: "animate-slide-in-right", description: "Slide in from right", duration: "0.4s" },
    { class: "animate-blur-in", description: "Blur to sharp with fade", duration: "0.5s" },
    { class: "animate-float", description: "Gentle floating motion", duration: "3s infinite" },
    { class: "animate-shimmer", description: "Loading shimmer effect", duration: "3s infinite" },
    { class: "animate-shine", description: "Shine sweep effect", duration: "8s infinite" },
    { class: "animate-bounce-once", description: "Single bounce for emphasis", duration: "0.3s" },
    { class: "animate-swing", description: "Pendulum swing motion", duration: "1s infinite" },
  ];

  // Utility effect classes
  const effectClasses = [
    { class: "hover-lift", description: "Lift card on hover with shadow", code: "hover:-translate-y-1 hover:shadow-lg" },
    { class: "card-glow", description: "Glow effect on hover", code: "hover:shadow-[0_0_30px_rgba(0,0,0,0.1)]" },
    { class: "btn-hover-fill", description: "Background fill animation on buttons", code: "Custom CSS transition" },
    { class: "link-underline", description: "Animated underline for links", code: "after:scale-x animation" },
    { class: "badge-shine", description: "Reflective shine on badges", code: "Gradient overlay animation" },
    { class: "shimmer", description: "Skeleton loading shimmer", code: "Background position animation" },
    { class: "gold-shimmer", description: "Premium gold shimmer effect", code: "Gold gradient animation" },
    { class: "pulse-glow", description: "Pulsing glow for emphasis", code: "Box-shadow pulse" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display uppercase tracking-wide">Design System</h1>
            <p className="text-muted-foreground mt-1">Visual reference for all design tokens and components</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </Button>
          </div>
        </div>

        <Accordion type="multiple" defaultValue={["colors", "gradients", "typography"]} className="space-y-4">
          {/* Color Palette */}
          <AccordionItem value="colors" className="border rounded-xl px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-gold" />
                <span className="font-display uppercase tracking-wide">Color Palette</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-3 pb-4">
                {semanticColors.map((color) => (
                  <div key={color.name} className="flex items-center gap-4 p-3 rounded-lg bg-background border">
                    <div className="flex gap-2">
                      <div 
                        className="w-12 h-12 rounded-lg border shadow-sm"
                        style={{ backgroundColor: `hsl(${color.light})` }}
                        title="Light mode"
                      />
                      <div 
                        className="w-12 h-12 rounded-lg border shadow-sm"
                        style={{ backgroundColor: `hsl(${color.dark})` }}
                        title="Dark mode"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                          {color.variable}
                        </code>
                        <CopyButton text={color.variable} label={color.name} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{color.usage}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground font-mono">
                      <div>Light: {color.light}</div>
                      <div>Dark: {color.dark}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Trend Colors */}
              <div className="pb-4">
                <h4 className="font-display uppercase tracking-wide text-sm mb-3">Trend Indicator Colors</h4>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: 'hsl(145 50% 45%)' }} />
                    <div>
                      <code className="text-sm font-mono">hsl(145 50% 45%)</code>
                      <p className="text-xs text-muted-foreground">Uptrend (green)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: 'hsl(0 60% 60%)' }} />
                    <div>
                      <code className="text-sm font-mono">hsl(0 60% 60%)</code>
                      <p className="text-xs text-muted-foreground">Downtrend (red)</p>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Special Gradients */}
          <AccordionItem value="gradients" className="border rounded-xl px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-gold" />
                <span className="font-display uppercase tracking-wide">Special Gradients</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {Object.entries(SPECIAL_GRADIENTS).map(([key, gradient]) => (
                  <Card key={key} className="overflow-hidden">
                    <div 
                      className="h-24 flex items-center justify-center"
                      style={{ background: gradient.background }}
                    >
                      <span 
                        className="font-display uppercase tracking-wide text-sm"
                        style={{ color: gradient.textColor }}
                      >
                        {gradient.name}
                      </span>
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <code className="text-xs font-mono">{key}</code>
                        <CopyButton text={gradient.background} label={gradient.name} />
                      </div>
                      <div 
                        className="mt-2 h-6 rounded border"
                        style={{ 
                          background: gradient.glassStroke,
                          opacity: 0.5 
                        }}
                        title="Glass stroke overlay"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Typography */}
          <AccordionItem value="typography" className="border rounded-xl px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Type className="h-5 w-5 text-gold" />
                <span className="font-display uppercase tracking-wide">Typography</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pb-4">
                {typography.map((type) => (
                  <div key={type.class} className="p-4 rounded-lg bg-background border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{type.class}</code>
                        <CopyButton text={type.class} label={type.font} />
                      </div>
                      <span className="text-xs text-muted-foreground">{type.weight}</span>
                    </div>
                    <div className={type.class === 'font-display' ? 'font-display uppercase tracking-wide' : type.class}>
                      <span className="text-2xl">{type.font}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{type.usage}</p>
                    {type.class === 'font-display' && (
                      <div className="mt-3 p-2 rounded bg-destructive/10 border border-destructive/20">
                        <p className="text-xs text-destructive font-medium">
                          ⚠️ NEVER use font-bold or font-semibold with Termina. Always use font-medium (500).
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                <Separator className="my-4" />

                {/* Typography examples */}
                <div className="space-y-3">
                  <h4 className="font-display uppercase tracking-wide text-sm">Live Examples</h4>
                  <div className="p-4 rounded-lg bg-background border space-y-4">
                    <h1 className="font-display uppercase tracking-wide text-3xl">Display Headline</h1>
                    <h2 className="font-display uppercase tracking-wide text-xl">Section Title</h2>
                    <p className="font-sans">This is body text using Aeonik Pro. It's clean, modern, and highly readable for longer passages of content.</p>
                    <p className="font-serif text-lg">Editorial accent with Laguna serif.</p>
                    <p className="font-script text-2xl">Decorative script styling</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Buttons */}
          <AccordionItem value="buttons" className="border rounded-xl px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <MousePointer className="h-5 w-5 text-gold" />
                <span className="font-display uppercase tracking-wide">Buttons</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 pb-4">
                {/* Variants */}
                <div>
                  <h4 className="font-display uppercase tracking-wide text-sm mb-3">Variants</h4>
                  <div className="flex flex-wrap gap-3 p-4 rounded-lg bg-background border">
                    <div className="space-y-2 text-center">
                      <Button variant="default">Default</Button>
                      <code className="block text-xs">variant="default"</code>
                    </div>
                    <div className="space-y-2 text-center">
                      <Button variant="secondary">Secondary</Button>
                      <code className="block text-xs">variant="secondary"</code>
                    </div>
                    <div className="space-y-2 text-center">
                      <Button variant="outline">Outline</Button>
                      <code className="block text-xs">variant="outline"</code>
                    </div>
                    <div className="space-y-2 text-center">
                      <Button variant="ghost">Ghost</Button>
                      <code className="block text-xs">variant="ghost"</code>
                    </div>
                    <div className="space-y-2 text-center">
                      <Button variant="link">Link</Button>
                      <code className="block text-xs">variant="link"</code>
                    </div>
                    <div className="space-y-2 text-center">
                      <Button variant="destructive">Destructive</Button>
                      <code className="block text-xs">variant="destructive"</code>
                    </div>
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <h4 className="font-display uppercase tracking-wide text-sm mb-3">Sizes</h4>
                  <div className="flex flex-wrap items-end gap-3 p-4 rounded-lg bg-background border">
                    <div className="space-y-2 text-center">
                      <Button size="sm">Small</Button>
                      <code className="block text-xs">size="sm"</code>
                    </div>
                    <div className="space-y-2 text-center">
                      <Button size="default">Default</Button>
                      <code className="block text-xs">size="default"</code>
                    </div>
                    <div className="space-y-2 text-center">
                      <Button size="lg">Large</Button>
                      <code className="block text-xs">size="lg"</code>
                    </div>
                    <div className="space-y-2 text-center">
                      <Button size="icon"><Sparkles className="h-4 w-4" /></Button>
                      <code className="block text-xs">size="icon"</code>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Badges */}
          <AccordionItem value="badges" className="border rounded-xl px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <CircleDot className="h-5 w-5 text-gold" />
                <span className="font-display uppercase tracking-wide">Badges</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 pb-4">
                {/* Badge Variants */}
                <div>
                  <h4 className="font-display uppercase tracking-wide text-sm mb-3">Variants</h4>
                  <div className="flex flex-wrap gap-3 p-4 rounded-lg bg-background border">
                    <div className="space-y-2 text-center">
                      <Badge variant="default">Default</Badge>
                      <code className="block text-xs">variant="default"</code>
                    </div>
                    <div className="space-y-2 text-center">
                      <Badge variant="secondary">Secondary</Badge>
                      <code className="block text-xs">variant="secondary"</code>
                    </div>
                    <div className="space-y-2 text-center">
                      <Badge variant="outline">Outline</Badge>
                      <code className="block text-xs">variant="outline"</code>
                    </div>
                    <div className="space-y-2 text-center">
                      <Badge variant="destructive">Destructive</Badge>
                      <code className="block text-xs">variant="destructive"</code>
                    </div>
                    <div className="space-y-2 text-center">
                      <Badge variant="glass">Glass</Badge>
                      <code className="block text-xs">variant="glass"</code>
                    </div>
                    <div className="space-y-2 text-center p-2 bg-foreground rounded">
                      <Badge variant="glass-dark">Glass Dark</Badge>
                      <code className="block text-xs text-background">variant="glass-dark"</code>
                    </div>
                  </div>
                </div>

                {/* Role Colors */}
                <div>
                  <h4 className="font-display uppercase tracking-wide text-sm mb-3">Role Colors</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 p-4 rounded-lg bg-background border">
                    {ROLE_COLORS.map((color) => {
                      const classes = getRoleColorClasses(color.name);
                      return (
                        <div key={color.name} className="space-y-2 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${classes.bg} ${classes.text}`}>
                            {color.name}
                          </span>
                          <code className="block text-xs">{color.name}</code>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Border Radius */}
          <AccordionItem value="radius" className="border rounded-xl px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Square className="h-5 w-5 text-gold" />
                <span className="font-display uppercase tracking-wide">Border Radius</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 pb-4">
                {borderRadius.map((radius) => (
                  <div key={radius.class} className="text-center space-y-2">
                    <div 
                      className={`w-16 h-16 mx-auto bg-primary ${radius.class} flex items-center justify-center`}
                    >
                      <span className="text-primary-foreground text-xs">{radius.value}</span>
                    </div>
                    <code className="text-xs font-mono">{radius.class}</code>
                    <p className="text-xs text-muted-foreground">{radius.usage}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Animations */}
          <AccordionItem value="animations" className="border rounded-xl px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-gold" />
                <span className="font-display uppercase tracking-wide">Animations</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pb-4">
                {animations.map((anim) => (
                  <div key={anim.class} className="flex items-center gap-4 p-3 rounded-lg bg-background border">
                    <div className={`w-12 h-12 rounded-lg bg-primary ${anim.class}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{anim.class}</code>
                        <CopyButton text={anim.class} label={anim.class} />
                      </div>
                      <p className="text-sm text-muted-foreground">{anim.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{anim.duration}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Effect Classes */}
          <AccordionItem value="effects" className="border rounded-xl px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-gold" />
                <span className="font-display uppercase tracking-wide">Effect Utilities</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid sm:grid-cols-2 gap-4 pb-4">
                {effectClasses.map((effect) => (
                  <div key={effect.class} className="p-4 rounded-lg bg-background border">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">.{effect.class}</code>
                      <CopyButton text={effect.class} label={effect.class} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{effect.description}</p>
                    
                    {/* Live demo */}
                    <div className="p-4 rounded-lg bg-muted/50 flex items-center justify-center min-h-[80px]">
                      {effect.class === 'hover-lift' && (
                        <div className="w-20 h-20 bg-card rounded-lg shadow hover-lift cursor-pointer flex items-center justify-center text-xs">
                          Hover me
                        </div>
                      )}
                      {effect.class === 'card-glow' && (
                        <div className="w-20 h-20 bg-card rounded-lg card-glow cursor-pointer flex items-center justify-center text-xs">
                          Hover me
                        </div>
                      )}
                      {effect.class === 'shimmer' && (
                        <div className="w-full h-8 rounded shimmer" />
                      )}
                      {effect.class === 'gold-shimmer' && (
                        <div className="px-4 py-2 rounded-full gold-shimmer text-white text-sm font-display uppercase">
                          Premium
                        </div>
                      )}
                      {effect.class === 'pulse-glow' && (
                        <div className="w-12 h-12 rounded-full bg-gold pulse-glow" />
                      )}
                      {(effect.class === 'btn-hover-fill' || effect.class === 'link-underline' || effect.class === 'badge-shine') && (
                        <span className="text-xs text-muted-foreground">See CSS in index.css</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Shadows */}
          <AccordionItem value="shadows" className="border rounded-xl px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-gold" />
                <span className="font-display uppercase tracking-wide">Shadows & Depth</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-6 pb-4 p-4 rounded-lg bg-muted/30">
                <div className="space-y-2 text-center">
                  <div className="w-24 h-24 bg-card rounded-xl shadow-sm flex items-center justify-center">
                    <span className="text-xs">sm</span>
                  </div>
                  <code className="text-xs">shadow-sm</code>
                </div>
                <div className="space-y-2 text-center">
                  <div className="w-24 h-24 bg-card rounded-xl shadow flex items-center justify-center">
                    <span className="text-xs">default</span>
                  </div>
                  <code className="text-xs">shadow</code>
                </div>
                <div className="space-y-2 text-center">
                  <div className="w-24 h-24 bg-card rounded-xl shadow-md flex items-center justify-center">
                    <span className="text-xs">md</span>
                  </div>
                  <code className="text-xs">shadow-md</code>
                </div>
                <div className="space-y-2 text-center">
                  <div className="w-24 h-24 bg-card rounded-xl shadow-lg flex items-center justify-center">
                    <span className="text-xs">lg</span>
                  </div>
                  <code className="text-xs">shadow-lg</code>
                </div>
                <div className="space-y-2 text-center">
                  <div className="w-24 h-24 bg-card rounded-xl shadow-xl flex items-center justify-center">
                    <span className="text-xs">xl</span>
                  </div>
                  <code className="text-xs">shadow-xl</code>
                </div>
                <div className="space-y-2 text-center">
                  <div className="w-24 h-24 bg-card rounded-2xl shadow-2xl flex items-center justify-center">
                    <span className="text-xs">2xl</span>
                  </div>
                  <code className="text-xs">shadow-2xl</code>
                  <p className="text-xs text-muted-foreground">Premium</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Scrollbar Utilities */}
          <AccordionItem value="scrollbar" className="border rounded-xl px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-gold" />
                <span className="font-display uppercase tracking-wide">Scrollbar Utilities</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid sm:grid-cols-3 gap-4 pb-4">
                <div className="p-4 rounded-lg bg-background border">
                  <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">.scrollbar-minimal</code>
                  <p className="text-sm text-muted-foreground mt-2">4px thin scrollbar, subtle styling</p>
                  <div className="mt-3 h-24 overflow-y-auto scrollbar-minimal border rounded p-2">
                    <div className="h-48 bg-muted/30 rounded" />
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-background border">
                  <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">.scrollbar-thin</code>
                  <p className="text-sm text-muted-foreground mt-2">6px rounded scrollbar</p>
                  <div className="mt-3 h-24 overflow-y-auto scrollbar-thin border rounded p-2">
                    <div className="h-48 bg-muted/30 rounded" />
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-background border">
                  <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">.scrollbar-hide</code>
                  <p className="text-sm text-muted-foreground mt-2">Hidden scrollbar (still scrollable)</p>
                  <div className="mt-3 h-24 overflow-y-auto scrollbar-hide border rounded p-2">
                    <div className="h-48 bg-muted/30 rounded" />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </DashboardLayout>
  );
};

export default DesignSystem;
