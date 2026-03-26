'use client';

import { useState, useEffect } from 'react';
import { Agent, Task, Activity } from '@/lib/types';
import { cn, getAvatar, getAgentStatusInfo } from '@/lib/utils';
import { useThemeClasses } from '@/hooks/useTheme';
import { AgentTriggerModal } from '@/components/shared/AgentTriggerModal';
import { Users, Play, Search, RefreshCw, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface LiveAgent extends Agent {
  currentTask?: string;
  lastActivityDate?: Date;
  tasksCompleted?: number;
  tasksInProgress?: number;
  computedStatus?: string;
  statusColor?: string;
}

interface LiveAgentsViewProps {
  agents: Agent[];
  tasks: Task[];
  activities?: Activity[];
  loading?: boolean;
  theme: 'dark' | 'light';
}

export function LiveAgentsView({ agents, tasks, activities = [], loading, theme }: LiveAgentsViewProps) {
  const isDark = theme === 'dark';
  const classes = useThemeClasses(isDark);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'idle' | 'offline'>('all');
  const [triggerAgent, setTriggerAgent] = useState<Agent | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setLastRefresh(new Date()), 15000);
    return () => clearInterval(interval);
  }, []);

  const liveAgents: LiveAgent[] = agents.map(agent => {
    const agentTasks = tasks.filter(t => (t.assignees || []).some(a => a?.replace(/^@+/, '') === agent.name));
    const agentActivities = activities.filter(a => a.agent_name?.replace(/^@+/, '') === agent.name);
    
    const inProgress = agentTasks.filter(t => t.status === 'in_progress');
    const completed = agentTasks.filter(t => t.status === 'done');
    const inbox = agentTasks.filter(t => t.status === 'inbox');
    const currentTask = inProgress.sort((a, b) =>
      new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    )[0];

    // Find latest activity
    let lastDate: Date | null = null;
    if (currentTask?.updated_at) lastDate = new Date(currentTask.updated_at);
    if (agentActivities.length > 0) {
      const latestAct = new Date(agentActivities[0].created_at);
      if (!lastDate || latestAct > lastDate) lastDate = latestAct;
    }

    const statusInfo = getAgentStatusInfo(lastDate);
    const computedStatus = lastDate && (new Date().getTime() - lastDate.getTime()) < 600000 ? 'active' : lastDate && (new Date().getTime() - lastDate.getTime()) < 3600000 ? 'idle' : 'offline';

    return {
      ...agent,
      currentTask: currentTask?.title,
      lastActivityDate: lastDate || undefined,
      computedStatus,
      statusColor: statusInfo.color,
      tasksCompleted: completed.length,
      tasksInProgress: inProgress.length + inbox.length,
    };
  });

  const filtered = liveAgents.filter(a => {
    if (filterStatus !== 'all' && a.computedStatus !== filterStatus) return false;
    if (search && !(a.name || '').toLowerCase().includes(search.toLowerCase()) && !(a.role || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={cn("h-48 rounded-lg animate-pulse", classes.card)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn("text-xl font-bold flex items-center gap-2", isDark ? 'text-white' : 'text-neutral-900')}>
            <Users className="w-5 h-5 text-violet-500" />
            Live Agents
          </h1>
          <p className={cn("text-sm mt-1", classes.muted)}>Real-time agent status and quick actions</p>
        </div>
        <div className={cn("text-xs flex items-center gap-1", classes.muted)}>
          <RefreshCw className="w-3 h-3" />
          Last refresh: {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", classes.subtle)} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..."
            className={cn("w-full pl-10 pr-4 py-2 rounded-lg text-sm border", isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900')} />
        </div>
        {(['all', 'active', 'idle', 'offline'] as const).map(status => (
          <button key={status} onClick={() => setFilterStatus(status)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              filterStatus === status ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                : cn("border", isDark ? 'border-neutral-800 text-neutral-400' : 'border-neutral-200 text-neutral-500'))}>
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-1.5 opacity-60">({status === 'all' ? liveAgents.length : liveAgents.filter(a => a.computedStatus === status).length})</span>
          </button>
        ))}
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(agent => (
          <div key={agent.id} className={cn("rounded-lg border p-5 transition-all hover:border-violet-500/30 group",
            isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200')}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={getAvatar(agent.name)} alt={agent.name || 'Agent'} className="w-10 h-10 rounded-full border border-neutral-700 object-cover" />
                  <div className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2",
                    isDark ? 'border-neutral-900' : 'border-white',
                    agent.computedStatus === 'active' ? 'bg-emerald-500 animate-pulse' : agent.computedStatus === 'idle' ? 'bg-yellow-500' : 'bg-red-500')} />
                </div>
                <div>
                  <h3 className={cn("font-semibold text-sm", isDark ? 'text-white' : 'text-neutral-900')}>{agent.name || 'Unknown'}</h3>
                  <p className={cn("text-xs", isDark ? 'text-neutral-500' : 'text-neutral-400')}>{agent.role || 'No role assigned'}</p>
                </div>
              </div>
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium",
                agent.computedStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                agent.computedStatus === 'idle' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400')}>
                {agent.computedStatus || 'unknown'}
              </span>
            </div>

            <div className={cn("p-3 rounded-lg mb-3", isDark ? 'bg-neutral-800/50' : 'bg-neutral-100')}>
              {agent.currentTask ? (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3 text-yellow-400" />
                    <span className="text-[10px] font-medium text-yellow-400 uppercase tracking-wider">Working on</span>
                  </div>
                  <p className={cn("text-sm", isDark ? 'text-neutral-200' : 'text-neutral-700')}>{agent.currentTask}</p>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className={cn("text-xs", isDark ? 'text-neutral-500' : 'text-neutral-400')}>No active task</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className={cn("text-xs", isDark ? 'text-neutral-500' : 'text-neutral-400')}>{agent.tasksCompleted || 0} done</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-blue-400" />
                  <span className={cn("text-xs", isDark ? 'text-neutral-500' : 'text-neutral-400')}>{agent.tasksInProgress || 0} active</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setTriggerAgent(agent)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors">
                <Play className="w-3 h-3" /> Ping Agent
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className={cn("col-span-full p-12 text-center rounded-lg", isDark ? 'bg-neutral-900/50 border border-neutral-800' : 'bg-white border border-neutral-200')}>
            <Users className="w-8 h-8 mx-auto mb-3 text-neutral-500" />
            <p className="text-sm text-neutral-500">No agents found</p>
          </div>
        )}
      </div>

      {triggerAgent && (
        <AgentTriggerModal agentName={triggerAgent.name} isOpen={!!triggerAgent} onClose={() => setTriggerAgent(null)} theme={theme} />
      )}
    </div>
  );
}
