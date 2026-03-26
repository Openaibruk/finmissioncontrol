// Utility functions for Mission Control

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TaskStatus, AgentStatus } from './types';

// Merge tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Avatar mapping
const AVATARS: Record<string, string> = {
  // Human
  'Bruk': '/bruk.jpg',
  // Core AI Agents
  'Nova': '/nova.jpg',
  'Cinder': '/cinder.svg',
  'Kiro': '/kiro.svg',
  'Onyx': '/onyx.svg',
  // Renamed Agents (display names)
  'Henok': '/henok.jpg',
  'Yonas': '/yonas.jpg',
  'Nahom': '/nahom.jpg',
  'Lidya': '/lidya.jpg',
  'Bini': '/bini.jpg',
  'Amen': '/amen.png',
  // Legacy names (fallback)
  'Forge': '/forge.jpg',
  'Shuri': '/shuri.jpg',
  'Cipher': '/cipher.jpg',
  'Maven': '/maven.jpg',
  'Pixel': '/pixel.jpg',
  'Echo': '/echo.jpg',
  'Pulse': '/pulse.png',
  'Loki': '/loki.png',
  'Vision': '/vision.png',
};

export function getAvatar(name: string | null | undefined): string {
  if (!name) return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=unknown&backgroundColor=6366f1`;
  const cleanName = name.replace(/^@+/, '');
  return AVATARS[cleanName] || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${cleanName}&backgroundColor=6366f1`;
}

// Time ago formatting
export function timeAgo(dateString: string | null | undefined): string {
  if (!dateString) return 'unknown';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'unknown';
  const now = new Date();
  const mins = Math.round((now.getTime() - date.getTime()) / 60000);
  
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

// Status color helpers
export function getStatusColor(status: string): string {
  switch (status) {
    case 'done':
    case 'complete':
      return 'bg-emerald-500/15 text-emerald-500';
    case 'in_progress':
    case 'active':
      return 'bg-amber-500/15 text-amber-500';
    case 'review':
      return 'bg-purple-500/15 text-purple-500';
    case 'assigned':
      return 'bg-blue-500/15 text-blue-500';
    case 'inbox':
      return 'bg-neutral-500/15 text-neutral-400';
    default:
      return 'bg-neutral-500/15 text-neutral-400';
  }
}

export function getStatusBorderColor(status: string): string {
  switch (status) {
    case 'done':
    case 'complete':
      return 'border-emerald-500';
    case 'in_progress':
    case 'active':
      return 'border-amber-500';
    case 'review':
      return 'border-purple-500';
    case 'assigned':
      return 'border-blue-500';
    case 'inbox':
      return 'border-neutral-500';
    default:
      return 'border-neutral-500';
  }
}

export function getAgentStatusInfo(lastActivity: Date | null): { 
  color: string; 
  glow: string; 
  label: string; 
  icon: React.ReactNode 
} {
  const now = new Date();
  const minsAgo = lastActivity ? Math.round((now.getTime() - lastActivity.getTime()) / 60000) : Infinity;
  
  if (minsAgo < 2) {
    return { 
      color: 'bg-emerald-500', 
      glow: 'shadow-emerald-500/50', 
      label: 'Working', 
      icon: <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
    };
  }
  if (minsAgo < 10) {
    return { 
      color: 'bg-amber-500', 
      glow: 'shadow-amber-500/50', 
      label: 'Idle', 
      icon: <span className="w-2 h-2 bg-white rounded-full" />
    };
  }
  if (minsAgo < 30) {
    return { 
      color: 'bg-blue-400', 
      glow: 'shadow-blue-400/50', 
      label: 'Sleeping', 
      icon: <span className="w-2 h-2 bg-white/50 rounded-full" />
    };
  }
  return { 
    color: 'bg-neutral-500', 
    glow: '', 
    label: 'Offline', 
    icon: <span className="w-2 h-2 bg-white/30 rounded-full" />
  };
}

// Department color mapping
export function getDepartmentColor(department?: string): string {
  const deptColors: Record<string, string> = {
    'Development': 'bg-blue-500/10 text-blue-500',
    'Strategy': 'bg-purple-500/10 text-purple-500',
    'Cross-dept': 'bg-cyan-500/10 text-cyan-500',
    'Research': 'bg-amber-500/10 text-amber-500',
    'Marketing': 'bg-pink-500/10 text-pink-500',
  };
  return deptColors[department || ''] || 'bg-neutral-500/10 text-neutral-500';
}

// All task statuses
export const ALL_STATUSES: TaskStatus[] = [
  'inbox', 
  'assigned', 
  'in_progress', 
  'review', 
  'done', 
  'approval_needed', 
  'rejected'
];

// Kanban columns
export const KANBAN_COLUMNS = [
  { id: 'inbox', title: 'To Do', color: '#6b7280' },
  { id: 'assigned', title: 'Assigned', color: '#3b82f6' },
  { id: 'in_progress', title: 'In Progress', color: '#f59e0b' },
  { id: 'review', title: 'Review', color: '#a855f7' },
  { id: 'done', title: 'Done', color: '#10b981' },
];

// Navigation items
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: 'LayoutDashboard' },
  { id: 'board', label: 'Board', icon: 'Columns3' },
  { id: 'projects', label: 'Projects', icon: 'FolderOpen' },
  { id: 'agents', label: 'Agents', icon: 'UserCircle' },
  { id: 'live-agents', label: 'Live Agents', icon: 'Users' },
  { id: 'approvals', label: 'Approvals', icon: 'AlertCircle' },
  { id: 'skills', label: 'Skills', icon: 'Wrench' },
  { id: 'insights', label: 'Analytics', icon: 'TrendingUp' },
  { id: 'virtual', label: 'Virtual Office', icon: 'Building2' },
  { id: 'activity', label: 'Activity', icon: 'Activity' },
  { id: 'settings', label: 'Settings', icon: 'Settings' },
  { id: 'feedback', label: 'Feedback', icon: 'MessageSquarePlus' },
  { id: 'graph', label: 'Graph', icon: 'GitBranch' },
  { id: 'hyperlearn', label: 'HyperLearn', icon: 'GraduationCap' },
] as const;

export type ViewType = typeof NAV_ITEMS[number]['id'];

// Extract file path from description
export function extractFilePath(desc: string | undefined | null): string | null {
  if (!desc) return null;
  const match = desc.match(/(?:write to |output to |file: |path: )?([a-zA-Z0-9_\-./]+\.(?:md|txt|json|js|ts|tsx|py|html|css))/i) 
    || desc.match(/^([a-zA-Z0-9_\-./]+\.(?:md|txt|json|js|ts|tsx|py|html|css))$/i);
  return match ? match[1] : null;
}
