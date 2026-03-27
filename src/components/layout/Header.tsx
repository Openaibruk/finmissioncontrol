'use client';

import { Menu, Plus, Settings, FolderPlus, UserPlus, MessageSquarePlus, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeClasses } from '@/hooks/useTheme';
import { NAV_ITEMS, ViewType } from '@/lib/utils';
import { Agent, Task } from '@/lib/types';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  view: ViewType;
  activeDomain: string;
  setActiveDomain: (domain: string) => void;
  onMenuClick: () => void;
  onNewTask: () => void;
  onNewProject: () => void;
  onNewAgent: () => void;
  onOpenFeedback?: () => void;
  theme: 'dark' | 'light';
  agents: Agent[];
  tasks: Task[];
  pendingApprovals?: number;
}

export function Header({ view, activeDomain, setActiveDomain, onMenuClick, onNewTask, onNewProject, onNewAgent, onOpenFeedback, theme, agents, tasks, pendingApprovals = 0 }: HeaderProps) {
  const isDark = theme === 'dark';
  const classes = useThemeClasses(isDark);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeSessions = 1;
  const totalSessions = tasks.length;
  const activeAgents = agents.filter(a => a.status === 'active').length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowCreateMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={cn("h-14 border-b flex items-center justify-between px-4 md:px-6 shrink-0 transition-colors duration-300", 
      activeDomain === 'ChipChip' ? (isDark ? "bg-[#111111] border-[#331111]" : "bg-white border-[#ffcccc]") : "",
      classes.divider)}>
      <div className="flex items-center space-x-3">
        <button onClick={onMenuClick} className="md:hidden p-2 -ml-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center">
          <Menu className="w-4 h-4" />
        </button>
        
        {/* Domain Switcher */}
        <div className="hidden md:flex bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-md">
          {['All', 'ChipChip', 'Mission Control'].map(domain => (
            <button
              key={domain}
              onClick={() => setActiveDomain(domain)}
              className={cn(
                "px-3 py-1 text-[11px] font-medium rounded-sm transition-all duration-200",
                activeDomain === domain 
                  ? (domain === 'ChipChip' 
                      ? "bg-[#e11d48] text-white shadow-sm" 
                      : isDark ? "bg-neutral-700 text-white shadow-sm" : "bg-white text-neutral-900 shadow-sm")
                  : (isDark ? "text-neutral-400 hover:text-neutral-200" : "text-neutral-500 hover:text-neutral-700")
              )}
            >
              {domain}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className={cn("text-[11px]", classes.muted)}>
          Agents <span className={cn("font-semibold", classes.heading)}>{activeAgents}</span>/{agents.length}
        </span>
        <span className={cn("text-[11px]", classes.muted)}>
          Tasks <span className={cn("font-semibold", classes.heading)}>{tasks.filter(t => t.status !== 'done' && t.status !== 'rejected').length}</span> active
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] text-emerald-500 font-medium">Live</span>
        </div>
      </div>

      <div className="flex items-center gap-2" ref={menuRef}>
        <div className="relative">
          <button className={cn("p-2 rounded-lg transition-colors", isDark ? "hover:bg-white/5" : "hover:bg-neutral-100")}>
            <Bell className={cn("w-4 h-4", pendingApprovals > 0 ? "text-amber-400" : classes.muted)} />
            {pendingApprovals > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {pendingApprovals > 9 ? '9+' : pendingApprovals}
              </span>
            )}
          </button>
        </div>
        <button
          onClick={() => onOpenFeedback?.()}
          className={cn(
            "flex items-center space-x-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-md transition-colors border",
            isDark
              ? "border-neutral-700 hover:bg-white/5 text-neutral-300"
              : "border-neutral-300 hover:bg-neutral-50 text-neutral-600"
          )}
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span>Feedback</span>
        </button>
        <div className="relative">
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="flex items-center space-x-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-medium px-3 py-1.5 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
          {showCreateMenu && (
            <div className={cn("absolute right-0 top-full mt-1 w-48 rounded-lg shadow-xl border z-50 py-1", classes.card)}>
              <button onClick={() => { onNewTask(); setShowCreateMenu(false); }}
                className={cn("w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors", isDark ? "hover:bg-white/5" : "hover:bg-neutral-50")}>
                <Plus className="w-3.5 h-3.5 text-violet-400" /> New Task
              </button>
              <button onClick={() => { onNewProject(); setShowCreateMenu(false); }}
                className={cn("w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors", isDark ? "hover:bg-white/5" : "hover:bg-neutral-50")}>
                <FolderPlus className="w-3.5 h-3.5 text-blue-400" /> New Project
              </button>
              <button onClick={() => { onNewAgent(); setShowCreateMenu(false); }}
                className={cn("w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors", isDark ? "hover:bg-white/5" : "hover:bg-neutral-50")}>
                <UserPlus className="w-3.5 h-3.5 text-emerald-400" /> New Agent
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
