'use client';

import { Agent, Task } from '@/lib/types';
import { cn, getAvatar, getAgentStatusInfo } from '@/lib/utils';
import { useThemeClasses } from '@/hooks/useTheme';
import { useMemo, useState } from 'react';
import { Plus, UserPlus, Bell, Zap, Crown, Bot, Users, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { AgentTriggerModal } from '@/components/shared/AgentTriggerModal';

interface AgentGridProps {
  agents: Agent[];
  tasks: Task[];
  onAgentClick: (agent: Agent) => void;
  onNewAgent: () => void;
  loading?: boolean;
  theme: 'dark' | 'light';
}

const departments = [
  { name: 'Development', color: 'bg-blue-500', textColor: 'text-blue-500', borderColor: 'border-blue-500', agents: ['Henok', 'Cinder', 'Kiro', 'Onyx'] },
  { name: 'Marketing', color: 'bg-pink-500', textColor: 'text-pink-500', borderColor: 'border-pink-500', agents: ['Nahom', 'Bini', 'Lidya', 'Amen'] },
  { name: 'Strategy', color: 'bg-violet-500', textColor: 'text-violet-500', borderColor: 'border-violet-500', agents: ['Vision', 'Cipher', 'Loki'] },
  { name: 'Analytics', color: 'bg-orange-500', textColor: 'text-orange-500', borderColor: 'border-orange-500', agents: ['Orion', 'Lyra'] },
];

export function AgentGrid({ agents, tasks, onAgentClick, onNewAgent, loading, theme }: AgentGridProps) {
  const isDark = theme === 'dark';
  const classes = useThemeClasses(isDark);
  const [pingedAgents, setPingedAgents] = useState<Set<string>>(new Set());
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set(['Development', 'Marketing', 'Strategy']));
  const [triggerAgent, setTriggerAgent] = useState<string | null>(null);

  const handlePing = async (agent: Agent, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `[PING] Agent @${agent.name} has been pinged by Bruk. Wake up and check for new tasks.` }),
      }).catch(() => {});
    } catch {}
    setPingedAgents(prev => new Set(prev).add(agent.id || agent.name));
    setTimeout(() => {
      setPingedAgents(prev => { const n = new Set(prev); n.delete(agent.id || agent.name); return n; });
    }, 5000);
  };

  const agentLastActivity = useMemo(() => {
    const lastByAgent: Record<string, Date> = {};
    tasks.forEach(task => {
      task.assignees?.forEach(assignee => {
        const name = assignee.replace(/^@+/, '');
        const taskDate = new Date(task.created_at);
        if (!lastByAgent[name] || taskDate > lastByAgent[name]) lastByAgent[name] = taskDate;
      });
    });
    return lastByAgent;
  }, [tasks]);

  const getAgentStats = (name: string) => {
    const includesAgent = (t: Task) => t.assignees?.some(a => a.replace(/^@+/, '') === name);
    const done = tasks.filter(t => t.status === 'done' && includesAgent(t)).length;
    const active = tasks.filter(t => ['assigned', 'in_progress', 'review'].includes(t.status) && includesAgent(t)).length;
    return { done, active };
  };

  const toggleDept = (name: string) => {
    setExpandedDepts(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const novaAgent = agents.find(a => a.name === 'Nova');

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={cn("h-16 rounded-xl", isDark ? "bg-neutral-800" : "bg-neutral-200")} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className={cn("text-lg font-semibold", classes.heading)}>Organization Chart</h2>
        <button onClick={onNewAgent} className="flex items-center space-x-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-medium px-3 py-1.5 rounded-md transition-colors">
          <UserPlus className="w-3.5 h-3.5" /><span>Add Agent</span>
        </button>
      </div>

      {/* Bruk - Root */}
      <div className="flex flex-col items-center mb-2">
        <div className={cn(
          "flex items-center gap-3 px-5 py-3 rounded-xl border-2 border-violet-500",
          isDark ? "bg-gray-800/80" : "bg-white"
        )}>
          <Crown className="w-6 h-6 text-violet-500" />
          <div>
            <div className={cn("font-bold", isDark ? "text-white" : "text-gray-900")}>Bruk</div>
            <div className={cn("text-[10px]", isDark ? "text-gray-400" : "text-gray-500")}>Human Leader</div>
          </div>
        </div>
        {/* Vertical line */}
        <div className={cn("w-px h-6", isDark ? "bg-gray-600" : "bg-gray-300")} />
      </div>

      {/* Nova - Main Agent */}
      <div className="flex flex-col items-center mb-2">
        {novaAgent && (
          <div
            onClick={() => onAgentClick(novaAgent)}
            className={cn(
              "flex items-center gap-3 px-5 py-3 rounded-xl border-2 border-blue-500 cursor-pointer transition-all hover:scale-[1.02]",
              isDark ? "bg-gray-800/80" : "bg-white"
            )}
          >
            <div className="relative">
              <img src={getAvatar('Nova')} alt="Nova" className="w-10 h-10 rounded-full border-2 border-blue-400" />
              <Bot className="absolute -bottom-1 -right-1 w-4 h-4 text-blue-500 bg-white rounded-full" />
            </div>
            <div>
              <div className={cn("font-bold", isDark ? "text-white" : "text-gray-900")}>Nova</div>
              <div className={cn("text-[10px]", isDark ? "text-gray-400" : "text-gray-500")}>Lead AI Coordinator</div>
            </div>
            <div className="ml-4 text-right">
              <div className="text-sm font-bold text-emerald-500">{getAgentStats('Nova').done}</div>
              <div className={cn("text-[9px]", isDark ? "text-gray-500" : "text-gray-400")}>done</div>
            </div>
          </div>
        )}
        {/* Vertical line */}
        <div className={cn("w-px h-6", isDark ? "bg-gray-600" : "bg-gray-300")} />
      </div>

      {/* Departments */}
      <div className="flex flex-col md:flex-row justify-center gap-4">
        {departments.map((dept) => {
          const isExpanded = expandedDepts.has(dept.name);
          return (
            <div key={dept.name} className="flex-1 min-w-[200px] max-w-[280px]">
              {/* Department Header */}
              <button
                onClick={() => toggleDept(dept.name)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all",
                  isDark ? "bg-gray-800/60 border-gray-700 hover:bg-gray-800" : "bg-white border-gray-200 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full", dept.color)} />
                  <span className={cn("text-sm font-semibold", isDark ? "text-white" : "text-gray-900")}>{dept.name}</span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500")}>
                    {dept.agents.length}
                  </span>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {/* Department Agents */}
              {isExpanded && (
                <div className="mt-2 space-y-1.5 pl-2">
                  {dept.agents.map((agentName) => {
                    const agent = agents.find(a => a.name === agentName);
                    if (!agent) return null;
                    const stats = getAgentStats(agentName);
                    const lastActivity = agentLastActivity[agentName] || null;
                    const statusInfo = getAgentStatusInfo(lastActivity);
                    const pinged = pingedAgents.has(agent.id || agentName);

                    return (
                      <div
                        key={agentName}
                        onClick={() => onAgentClick(agent)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all hover:scale-[1.01]",
                          isDark ? "bg-gray-800/40 hover:bg-gray-800" : "bg-gray-50 hover:bg-white hover:shadow-sm"
                        )}
                      >
                        <div className="relative flex-shrink-0">
                          <img src={getAvatar(agentName)} alt={agentName} className="w-9 h-9 rounded-full" />
                          <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center",
                            isDark ? "border-gray-800" : "border-white",
                            statusInfo.color
                          )}>
                            {statusInfo.icon}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn("text-[13px] font-medium truncate", isDark ? "text-white" : "text-gray-900")}>{agentName}</div>
                          <div className={cn("text-[10px] truncate", isDark ? "text-gray-500" : "text-gray-400")}>{agent.role || 'Agent'}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {stats.done > 0 && (
                            <span className="text-[11px] font-semibold text-emerald-500">{stats.done}</span>
                          )}
                          {stats.active > 0 && (
                            <span className="text-[10px] text-amber-400">{stats.active}</span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setTriggerAgent(agentName); }}
                            className={cn(
                              "p-1.5 rounded-md transition-all",
                              isDark
                                ? "hover:bg-emerald-600/20 text-gray-500 hover:text-emerald-400"
                                : "hover:bg-emerald-50 text-gray-400 hover:text-emerald-600"
                            )}
                            title={`Run task for ${agentName}`}
                          >
                            <Play className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handlePing(agent, e)}
                            className={cn(
                              "p-1.5 rounded-md transition-all",
                              pinged
                                ? "bg-emerald-500/20 text-emerald-400"
                                : isDark
                                  ? "hover:bg-violet-600/20 text-gray-500 hover:text-violet-400"
                                  : "hover:bg-violet-50 text-gray-400 hover:text-violet-600"
                            )}
                          >
                            {pinged ? <Zap className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Agent Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={onNewAgent}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed transition-all",
            isDark
              ? "border-gray-700 hover:border-violet-500/30 hover:bg-violet-500/5 text-gray-500 hover:text-violet-400"
              : "border-gray-300 hover:border-violet-400 hover:bg-violet-50 text-gray-400 hover:text-violet-600"
          )}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Agent</span>
        </button>
      </div>

      {/* Agent Trigger Modal */}
      <AgentTriggerModal
        agentName={triggerAgent || ''}
        isOpen={!!triggerAgent}
        onClose={() => setTriggerAgent(null)}
        theme={theme}
      />
    </div>
  );
}
