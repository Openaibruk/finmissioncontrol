'use client';

import { Task, Project } from '@/lib/types';
import { cn, timeAgo } from '@/lib/utils';
import { useThemeClasses } from '@/hooks/useTheme';
import { CheckCircle2, XCircle, AlertCircle, Clock, Shield } from 'lucide-react';
import { useState } from 'react';

interface ApprovalsViewProps {
  tasks: Task[];
  projects: Project[];
  onApprove: (id: string, title: string, approved: boolean) => Promise<void>;
  theme: 'dark' | 'light';
  activeDomain?: string;
}

export function ApprovalsView({ tasks, projects, onApprove, theme, activeDomain }: ApprovalsViewProps) {
  const isDark = theme === 'dark';
  const classes = useThemeClasses(isDark, activeDomain);
  const [processing, setProcessing] = useState<string | null>(null);

  const pendingTasks = tasks.filter(t => t.status === 'approval_needed');

  const handleDecision = async (task: Task, approved: boolean) => {
    setProcessing(task.id);
    try {
      await onApprove(task.id, task.title, approved);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto h-full relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={cn("text-2xl font-bold tracking-tight flex items-center gap-2", classes.heading)}>
            <Shield className="w-6 h-6 text-amber-500" />
            Pending Approvals
          </h2>
          <p className={cn("text-sm mt-1", classes.muted)}>
            Review and authorize actions requested by autonomous agents.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 font-semibold text-sm">
          {pendingTasks.length} {pendingTasks.length === 1 ? 'request' : 'requests'}
        </div>
      </div>

      {pendingTasks.length === 0 ? (
        <div className={cn("flex flex-col items-center justify-center p-12 rounded-xl border border-dashed", isDark ? "border-gray-700 bg-gray-900/30" : "border-gray-300 bg-gray-50")}>
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3 opacity-50" />
          <h3 className={cn("text-lg font-semibold", classes.heading)}>All Clear</h3>
          <p className={cn("text-sm mt-1 max-w-sm text-center", classes.muted)}>
            There are no pending actions requiring human authorization. Agents are running smoothly within their boundaries.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingTasks.map(task => {
            const project = projects.find(p => p.id === task.project_id);
            return (
              <div key={task.id} className={cn("p-5 rounded-xl border shadow-sm transition-all relative overflow-hidden", classes.card)}>
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn("text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md", isDark ? "bg-amber-500/10 text-amber-500" : "bg-amber-100 text-amber-700")}>
                        Approval Required
                      </span>
                      {project && (
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md", isDark ? "bg-gray-800 text-gray-400" : "bg-gray-200 text-gray-600")}>
                          {project.name}
                        </span>
                      )}
                    </div>
                    <h3 className={cn("text-base font-bold mb-2", classes.heading)}>{task.title}</h3>
                    <div className={cn("text-sm whitespace-pre-wrap rounded-lg p-3", isDark ? "bg-black/20 text-gray-300" : "bg-gray-50 text-gray-700")}>
                      {task.description || 'No description provided.'}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3">
                      {task.assignees && task.assignees.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className={cn("text-xs", classes.subtle)}>Requested by:</span>
                          <div className="flex gap-1">
                            {task.assignees.map(a => (
                              <span key={a} className={cn("text-xs font-semibold px-1.5 py-0.5 rounded", isDark ? "bg-violet-500/10 text-violet-400" : "bg-violet-100 text-violet-700")}>{a}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Clock className={cn("w-3.5 h-3.5", classes.subtle)} />
                        <span className={cn("text-xs", classes.subtle)}>Requested {timeAgo(task.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex md:flex-col gap-2 shrink-0 md:min-w-[140px] md:border-l md:pl-4 pt-4 md:pt-0 border-t md:border-t-0 mt-4 md:mt-0" style={{ borderColor: isDark ? '#333' : '#eee' }}>
                    <button
                      onClick={() => handleDecision(task, true)}
                      disabled={processing === task.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => handleDecision(task, false)}
                      disabled={processing === task.id}
                      className={cn("flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border text-sm font-semibold transition-colors disabled:opacity-50", 
                        isDark ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-red-200 text-red-600 hover:bg-red-50")}
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
