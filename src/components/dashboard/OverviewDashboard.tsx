'use client';

import { cn, timeAgo, getStatusColor } from '@/lib/utils';
import { useThemeClasses } from '@/hooks/useTheme';
import { DashboardStats, Task, Agent, Activity, Project } from '@/lib/types';
import {
  Wifi, Monitor, Users, Server, Cpu, AlertTriangle, Shield,
  CheckCircle2, Clock, Inbox, ArrowRight, TrendingUp, FolderOpen, Plus, Pencil,
  MoreVertical, Pause, Play, Archive
} from 'lucide-react';
import { TokenCostWidget } from './TokenCostWidget';
import { EthiopianCalendar } from './EthiopianCalendar';
import { NewsFeed } from './NewsFeed';
import { AgentCommandCenter } from './AgentCommandCenter';
import { ActivityPulse } from './ActivityPulse';
import { DomainsWidget } from './DomainsWidget';
import { useGatewayStatus } from '@/hooks/useGatewayStatus';
import { useState, useEffect } from 'react';

interface OverviewDashboardProps {
  stats: DashboardStats;
  tasks: Task[];
  agents: Agent[];
  activities: Activity[];
  projects: Project[];
  loading: boolean;
  theme: 'dark' | 'light';
  onEditProject: (project: Project) => void;
  onNewProject: () => void;
  onUpdateProjectStatus?: (projectId: string, status: string) => void;
}

function timeAgoShort(dateString: string): string {
  const mins = Math.round((Date.now() - new Date(dateString).getTime()) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
}

export function OverviewDashboard({ stats, tasks, agents, activities, projects, loading, theme, onEditProject, onNewProject, onUpdateProjectStatus }: OverviewDashboardProps) {
  const isDark = theme === 'dark';
  const [statusMenu, setStatusMenu] = useState<string | null>(null);
  const classes = useThemeClasses(isDark);
  const { data: gwStatus } = useGatewayStatus(30000);
  const activeAgents = agents.filter(agent => {
    const agentTasks = tasks.filter(t => t.assignees?.some(a => a.replace(/^@+/, '') === agent.name));
    const agentActivities = activities.filter(a => a.agent_name?.replace(/^@+/, '') === agent.name);
    
    let lastDate: Date | null = null;
    const currentTask = agentTasks.filter(t => t.status === 'in_progress').sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())[0];
    if (currentTask?.updated_at) lastDate = new Date(currentTask.updated_at);
    if (agentActivities.length > 0) {
      const latestAct = new Date(agentActivities[0].created_at);
      if (!lastDate || latestAct > lastDate) lastDate = latestAct;
    }
    
    // An agent is considered 'active' if they've had activity in the last 10 minutes
    return lastDate && (new Date().getTime() - lastDate.getTime()) < 600000;
  });
  const queueCount = tasks.filter(t => t.status === 'inbox').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const reviewCount = tasks.filter(t => t.status === 'review').length;
  const assignedCount = tasks.filter(t => t.status === 'assigned').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const stalledTasks = tasks.filter(t => {
    const age = Date.now() - new Date(t.created_at).getTime();
    return (t.status === 'in_progress' && age > 3600000) || (t.status === 'assigned' && age > 7200000);
  });

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className={cn("h-24 rounded-xl animate-pulse", isDark ? "bg-neutral-800" : "bg-neutral-200")} />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className={cn("h-20 rounded-lg animate-pulse", isDark ? "bg-neutral-800" : "bg-neutral-200")} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* ── Banner ── */}
      <div className={cn("rounded-xl p-5 relative overflow-hidden", isDark ? "bg-gradient-to-r from-[#0f1729] to-[#111827] border border-indigo-900/30" : "bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200")}>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className={cn("text-[10px] uppercase tracking-widest font-semibold mb-1", isDark ? "text-indigo-400" : "text-indigo-600")}>Overview</div>
            <h2 className={cn("text-xl font-bold", classes.heading)}>Gateway Control Plane</h2>
            <p className={cn("text-[12px] mt-1", classes.muted)}>Gateway health, session routing, queue pressure, and execution status.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'TASKS', value: String(stats.total), color: isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700' },
              { label: 'ACTIVE', value: String(stats.active), color: isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700' },
              { label: 'DONE', value: String(stats.done), color: isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700' },
              { label: 'RATE', value: `${stats.rate}%`, color: isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-700' },
            ].map((item) => (
              <div key={item.label} className={cn("px-3 py-2 rounded-lg text-center min-w-[72px]", item.color)}>
                <div className="text-[9px] font-bold uppercase tracking-wider opacity-70">{item.label}</div>
                <div className="text-[14px] font-bold mt-0.5">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Execution Summary ── */}
      <div className={cn("rounded-lg p-4", classes.card)}>
        <h3 className={cn("text-[13px] font-semibold mb-3", classes.heading)}>⚡ Execution Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Inbox', count: queueCount, icon: Inbox, color: 'text-neutral-400' },
            { label: 'Assigned', count: assignedCount, icon: ArrowRight, color: 'text-blue-400' },
            { label: 'In Progress', count: inProgressCount, icon: Clock, color: 'text-amber-400' },
            { label: 'Review', count: reviewCount, icon: TrendingUp, color: 'text-purple-400' },
            { label: 'Done', count: doneCount, icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'Stalled', count: stalledTasks.length, icon: AlertTriangle, color: stalledTasks.length > 0 ? 'text-red-400' : 'text-neutral-500' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={cn("flex items-center gap-2 px-3 py-2 rounded-md", isDark ? "bg-white/[0.03]" : "bg-neutral-50")}>
                <Icon className={cn("w-4 h-4 shrink-0", item.color)} />
                <div>
                  <div className={cn("text-[16px] font-bold", classes.heading)}>{item.count}</div>
                  <div className={cn("text-[9px]", classes.muted)}>{item.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Status Cards Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className={cn("p-4 rounded-lg border-l-4", gwStatus?.gateway?.status === 'online' ? 'border-emerald-500' : 'border-red-500', classes.card)}>
          <div className="flex items-center gap-2 mb-2"><Wifi className={cn("w-4 h-4", gwStatus?.gateway?.status === 'online' ? 'text-emerald-500' : 'text-red-500')} /><span className={cn("text-[10px] uppercase font-semibold tracking-wider", isDark ? "text-emerald-400" : "text-emerald-600")}>Gateway</span></div>
          <div className={cn("text-xl font-bold", gwStatus?.gateway?.status === 'online' ? 'text-emerald-500' : 'text-red-500')}>{gwStatus?.gateway?.status === 'online' ? 'Online' : 'Offline'}</div>
        </div>
        <div className={cn("p-4 rounded-lg border-l-4 border-cyan-500", classes.card)}>
          <div className="flex items-center gap-2 mb-2"><Monitor className="w-4 h-4 text-cyan-500" /><span className={cn("text-[10px] uppercase font-semibold tracking-wider", isDark ? "text-cyan-400" : "text-cyan-600")}>VPS</span></div>
          <div className={cn("text-xl font-bold", classes.heading)}>{gwStatus?.vps?.cpu || 0}%</div>
          <div className={cn("text-[10px]", classes.muted)}>cpu · {gwStatus?.vps?.memory?.percent || 0}% mem</div>
        </div>
        <div className={cn("p-4 rounded-lg border-l-4 border-violet-500", classes.card)}>
          <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-violet-500" /><span className={cn("text-[10px] uppercase font-semibold tracking-wider", isDark ? "text-violet-400" : "text-violet-600")}>Agents</span></div>
          <div className={cn("text-xl font-bold", classes.heading)}>{activeAgents.length}</div>
          <div className={cn("text-[10px]", classes.muted)}>{agents.length} total</div>
        </div>
        <div className={cn("p-4 rounded-lg border-l-4 border-amber-500", classes.card)}>
          <div className="flex items-center gap-2 mb-2"><Server className="w-4 h-4 text-amber-500" /><span className={cn("text-[10px] uppercase font-semibold tracking-wider", isDark ? "text-amber-400" : "text-amber-600")}>Queue</span></div>
          <div className={cn("text-xl font-bold", classes.heading)}>{queueCount}</div>
          <div className={cn("text-[10px]", classes.muted)}>{inProgressCount} running</div>
        </div>
        <div className={cn("p-4 rounded-lg border-l-4 border-blue-500", classes.card)}>
          <div className="flex items-center gap-2 mb-2"><Cpu className="w-4 h-4 text-blue-500" /><span className={cn("text-[10px] uppercase font-semibold tracking-wider", isDark ? "text-blue-400" : "text-blue-600")}>Projects</span></div>
          <div className={cn("text-xl font-bold", classes.heading)}>{projects.length}</div>
          <div className={cn("text-[10px]", classes.muted)}>{projects.filter(p => p.status === 'active').length} active</div>
        </div>
        <div className={cn("p-4 rounded-lg border-l-4 border-amber-500", classes.card)}>
          <div className="flex items-center gap-2 mb-2"><Server className="w-4 h-4 text-amber-500" /><span className={cn("text-[10px] uppercase font-semibold tracking-wider", isDark ? "text-amber-400" : "text-amber-600")}>Paperclip</span></div>
          <div className={cn("text-xl font-bold", gwStatus?.paperclip?.status === 'online' ? 'text-emerald-500' : 'text-red-500')}>{gwStatus?.paperclip?.status === 'online' ? 'Online' : 'Offline'}</div>
        </div>
      </div>

      {/* ── LIVE Widgets: Calendar + News + Command Center + Pulse ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <EthiopianCalendar />
        <NewsFeed />
        <AgentCommandCenter />
        <ActivityPulse />
      </div>

      {/* ── Context Domains ── */}
      <div className="grid grid-cols-1 gap-4">
        <DomainsWidget />
      </div>

      {/* ── Three-Column: Projects + Session Router + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Projects */}
        <div className={cn("p-5 rounded-lg", classes.card)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn("text-[13px] font-semibold", classes.heading)}>Projects</h3>
            <button onClick={onNewProject} className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1"><Plus className="w-3 h-3" /> New</button>
          </div>
          <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scroll">
            {projects.length > 0 ? projects.slice(0, 8).map(p => {
              const pct = p.total_tasks > 0 ? Math.round((p.done_tasks / p.total_tasks) * 100) : 0;
              return (
                <div key={p.id} onClick={() => onEditProject(p)} className={cn("flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors", isDark ? "hover:bg-white/5" : "hover:bg-neutral-50")}>
                  <FolderOpen className={cn("w-4 h-4 shrink-0", p.status === 'complete' ? "text-emerald-400" : "text-violet-400")} />
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-[12px] font-medium truncate", classes.heading)}>{p.name}</div>
                    <div className={cn("text-[10px]", classes.muted)}>{p.done_tasks}/{p.total_tasks} tasks · {pct}%</div>
                  </div>
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setStatusMenu(statusMenu === p.id ? null : p.id)}
                      className={cn("text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1", getStatusColor(p.status))}>
                      {p.status} <MoreVertical className="w-2.5 h-2.5" />
                    </button>
                    {statusMenu === p.id && onUpdateProjectStatus && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setStatusMenu(null)} />
                        <div className={cn("absolute right-0 top-full mt-1 w-32 rounded-lg shadow-xl border py-1 z-50", isDark ? "bg-neutral-900 border-neutral-700" : "bg-white border-gray-200")}>
                          {p.status !== 'complete' && (
                            <button onClick={() => { onUpdateProjectStatus(p.id, 'complete'); setStatusMenu(null); }}
                              className={cn("w-full flex items-center gap-2 px-3 py-1.5 text-[10px]", isDark ? "hover:bg-white/5" : "hover:bg-gray-50")}>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Complete
                            </button>
                          )}
                          {p.status === 'active' && (
                            <button onClick={() => { onUpdateProjectStatus(p.id, 'paused'); setStatusMenu(null); }}
                              className={cn("w-full flex items-center gap-2 px-3 py-1.5 text-[10px]", isDark ? "hover:bg-white/5" : "hover:bg-gray-50")}>
                              <Pause className="w-3 h-3 text-amber-400" /> Pause
                            </button>
                          )}
                          {p.status === 'paused' && (
                            <button onClick={() => { onUpdateProjectStatus(p.id, 'active'); setStatusMenu(null); }}
                              className={cn("w-full flex items-center gap-2 px-3 py-1.5 text-[10px]", isDark ? "hover:bg-white/5" : "hover:bg-gray-50")}>
                              <Play className="w-3 h-3 text-blue-400" /> Resume
                            </button>
                          )}
                          <button onClick={() => { onUpdateProjectStatus(p.id, 'archived'); setStatusMenu(null); }}
                            className={cn("w-full flex items-center gap-2 px-3 py-1.5 text-[10px]", isDark ? "hover:bg-white/5" : "hover:bg-gray-50")}>
                            <Archive className="w-3 h-3 text-neutral-400" /> Archive
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            }) : <div className={cn("text-[12px] text-center py-4", classes.muted)}>No projects</div>}
          </div>
        </div>

        {/* Session Router / Agents */}
        <div className={cn("p-5 rounded-lg", classes.card)}>
          <h3 className={cn("text-[13px] font-semibold mb-4", classes.heading)}>Agent Router</h3>
          <div className="space-y-3">
            {agents.length > 0 ? agents.slice(0, 7).map((agent) => (
              <div key={agent.id} className="flex items-start gap-3">
                <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", agent.status === 'active' ? 'bg-emerald-500' : agent.status === 'idle' ? 'bg-amber-500' : 'bg-neutral-500')} />
                <div className="flex-1 min-w-0">
                  <div className={cn("text-[12px] font-medium truncate", classes.heading)}>@{agent.name}</div>
                  <div className={cn("text-[10px]", classes.muted)}>{agent.role || 'Agent'}</div>
                </div>
                <span className={cn("text-[10px] shrink-0", classes.subtle)}>
                  {tasks.filter(t => t.assignees?.some(a => a.replace(/^@+/, '') === agent.name) && t.status === 'done').length} done
                </span>
              </div>
            )) : <div className={cn("text-[12px] text-center py-4", classes.muted)}>No agents</div>}
          </div>
        </div>

        {/* Activity Stream */}
        <div className={cn("p-5 rounded-lg", classes.card)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn("text-[13px] font-semibold", classes.heading)}>Activity Stream</h3>
            <span className={cn("text-[11px] font-medium", "text-emerald-500")}>{activities.length} events</span>
          </div>
          {activities.length > 0 ? (
            <div className="space-y-2.5 max-h-[250px] overflow-y-auto custom-scroll">
              {activities.slice(-10).reverse().map((act) => (
                <div key={act.id} className={cn("text-[11px] flex gap-2", classes.muted)}>
                  <span className="shrink-0 text-violet-400 font-medium">@{act.agent_name}</span>
                  <span className="truncate">{act.action}</span>
                  <span className={cn("shrink-0 ml-auto", classes.subtle)}>{timeAgoShort(act.created_at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertTriangle className={cn("w-8 h-8 mb-2 opacity-20", classes.muted)} />
              <p className={cn("text-[12px]", classes.muted)}>No activity yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Token Costs ── */}
      <TokenCostWidget theme={theme} />

      {/* ── Two-Column: Task Flow + Security ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={cn("p-5 rounded-lg", classes.card)}>
          <h3 className={cn("text-[13px] font-semibold mb-4", classes.heading)}>Task Flow</h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6">
            {[
              { label: 'Inbox', count: queueCount }, { label: 'Assigned', count: assignedCount },
              { label: 'In Progress', count: inProgressCount }, { label: 'Review', count: reviewCount },
              { label: 'Done', count: doneCount }, { label: 'Stalled', count: stalledTasks.length },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className={cn("text-[12px]", classes.muted)}>{item.label}</span>
                <span className={cn("text-[12px] font-medium", classes.heading)}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={cn("p-5 rounded-lg", classes.card)}>
          <h3 className={cn("text-[13px] font-semibold mb-4", classes.heading)}>Security + Audit</h3>
          <div className="space-y-3">
            {[
              { label: 'Total tasks tracked', value: String(stats.total) },
              { label: 'Agent updates (live)', value: String(activities.length) },
              { label: 'Active agents', value: String(activeAgents.length) },
              { label: 'Pending approvals', value: String(tasks.filter(t => t.status === 'approval_needed').length) },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className={cn("text-[12px]", classes.muted)}>{item.label}</span>
                <span className={cn("text-[12px] font-medium", classes.heading)}>{item.value}</span>
              </div>
            ))}
            <div className={cn("border-t pt-3 mt-1", classes.divider)}>
              <button className="flex items-center gap-1.5 text-[12px] text-violet-400 hover:text-violet-300 font-medium transition-colors">
                <Shield className="w-3.5 h-3.5" /> View Security Panel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
