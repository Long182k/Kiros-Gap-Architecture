'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, History, Target, Sparkles, Cpu, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'New Gap Analysis', href: '/', icon: FileText, badge: 'AI Powered' },
  { name: 'Analysis History', href: '/history', icon: History },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col glass-panel border-r border-border/50 relative z-20">
      {/* Brand Header */}
      <div className="flex h-20 items-center gap-3 border-b border-border/40 px-6">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/25">
          <Target className="h-5 w-5 text-white" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
            GAP ARCHITECT <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">AI</span>
          </span>
          <span className="text-xs text-muted-foreground font-medium">Skill Intelligence</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-3 py-6">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Core Platform
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href === '/history' && pathname.startsWith('/history/'));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-white border border-indigo-500/30 shadow-md shadow-indigo-500/10'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn(
                  "h-4 w-4 transition-transform group-hover:scale-110",
                  isActive ? "text-indigo-400" : "text-muted-foreground group-hover:text-white"
                )} />
                <span>{item.name}</span>
              </div>
              {item.badge ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  {item.badge}
                </span>
              ) : (
                <ChevronRight className={cn(
                  "h-3.5 w-3.5 transition-transform opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5",
                  isActive && "opacity-100 text-indigo-400"
                )} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Pro Tips Footer */}
      <div className="border-t border-border/40 p-4">
        <div className="rounded-xl bg-gradient-to-br from-indigo-950/60 to-slate-900/80 p-3.5 border border-indigo-500/20 shadow-inner">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Gemini 2.5 Pro Engine</p>
              <p className="text-[10px] text-indigo-300/80 font-medium">Deep Gap Scoring</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Paste full Job Descriptions for 98%+ accurate missing skill detection.
          </p>
        </div>
      </div>
    </aside>
  );
}
