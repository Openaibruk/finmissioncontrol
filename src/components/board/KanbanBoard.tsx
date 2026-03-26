'use client';

import { Task, Agent } from '@/lib/types';
import { cn, getAvatar, KANBAN_COLUMNS, timeAgo, extractFilePath } from '@/lib/utils';
import { useThemeClasses } from '@/hooks/useTheme';
import { AlertTriangle, Bell, ExternalLink, Download, FileText, ChevronRight, MoveRight, Filter, X, Eye, CheckCircle2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { MarkdownPreviewModal } from '../shared/MarkdownPreviewModal';

interface KanbanBoardProps {
  tasks: Task[];
  agents: Agent[];
  onTaskClick: (task: Task) => void;
  onMoveTask: (taskId: string, newStatus: string) => void;
  onNewTask?: () => void;
  loading?: boolean;
  theme: 'dark' | 'light';
}

function isStalled(task: Task): boolean {
  const age = Date.now() - new Date(task.created_at).getTime();
  if (task.status === 'in_progress' && age > 3600000) return true;
  if (task.status === 'assigned' && age > 7200000) return true;
  return false;
}

function MoveMenu({ task, onMove, isDark }: { task: Task; onMove: (id: string, status: string) => void; isDark: boolean }) {
  const [open, setOpen] = useState(false);
  const currentIdx = KANBAN_COLUMNS.findIndex(c => c.id === task.status);
  const nextCol = KANBAN_COLUMNS[currentIdx + 1];
  const prevCol = KANBAN_COLUMNS[currentIdx - 1];
  if (!nextCol && !prevCol) return null;

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1 text-[10px] px-2 py-1 rounded-md font-medium transition-all",
          isDark ? "bg-violet-600/20 text-violet-400 hover:bg-violet-600/30" : "bg-violet-50 text-violet-600 hover:bg-violet-100"
        )}
      >
        <MoveRight className="w-3 h-3" /> Move
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={cn(
            "absolute bottom-full mb-1 right-0 z-50 rounded-lg shadow-xl border py-1 min-w-[140px]",
            isDark ? "bg-[#111113] border-neutral-700" : "bg-white border-neutral-200"
          )}>
            {prevCol && (
              <button onClick={() => { onMove(task.id, prevCol.id); setOpen(false); }}
                className={cn("w-full text-left px-3 py-2 text-[11px] transition-colors flex items-center gap-2", isDark ? "hover:bg-white/5" : "hover:bg-neutral-50")}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: prevCol.color }} />← {prevCol.title}
              </button>
            )}
            {nextCol && (
              <button onClick={() => { onMove(task.id, nextCol.id); setOpen(false); }}
                className={cn("w-full text-left px-3 py-2 text-[11px] transition-colors flex items-center gap-2", isDark ? "hover:bg-white/5" : "hover:bg-neutral-50")}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: nextCol.color }} />→ {nextCol.title}
              </button>
            )}
            {task.status !== 'done' && (
              <button onClick={() => { onMove(task.id, 'done'); setOpen(false); }}
                className={cn("w-full text-left px-3 py-2 text-[11px] transition-colors flex items-center gap-2 border-t mt-1 pt-2", isDark ? "hover:bg-white/5 border-neutral-700" : "hover:bg-neutral-50 border-neutral-100")}>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />✓ Done (skip)
              </button>
            )}
          </div>

    </>
      )}
    </div>
  );
}

export function KanbanBoard({ tasks, agents, onTaskClick, onMoveTask, onNewTask, loading, theme }: KanbanBoardProps) {
  const isDark = theme === 'dark';
  const classes = useThemeClasses(isDark);
  const [pingedTasks, setPingedTasks] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  const handlePing = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setPingedTasks(prev => new Set(prev).add(task.id));
    setTimeout(() => setPingedTasks(prev => { const n = new Set(prev); n.delete(task.id); return n; }), 3000);
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (filterAgent !== 'all') {
      result = result.filter(t => t.assignees?.includes(filterAgent));
    }

    if (filterDate !== 'all') {
      const now = Date.now();
      const ranges: Record<string, number> = {
        'today': 86400000,
        'week': 604800000,
        'month': 2592000000,
      };
      const range = ranges[filterDate];
      if (range) result = result.filter(t => now - new Date(t.created_at).getTime() < range);
    }

    if (filterActive === 'active') {
      result = result.filter(t => !['done', 'rejected'].includes(t.status));
    } else if (filterActive === 'done') {
      result = result.filter(t => t.status === 'done');
    } else if (filterActive === 'stalled') {
      result = result.filter(isStalled);
    }

    return result;
  }, [tasks, filterAgent, filterDate, filterActive]);

  const hasFilters = filterAgent !== 'all' || filterDate !== 'all' || filterActive !== 'all';
  const clearFilters = () => { setFilterAgent('all'); setFilterDate('all'); setFilterActive('all'); };

  if (loading) {
    return (
      <div className="p-4 flex h-full">
        <div className="flex gap-3 h-full w-full">
          {KANBAN_COLUMNS.map((col) => (
            <div key={col.id} className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center space-x-2 mb-3 px-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                <h3 className={cn("text-[13px] font-semibold", classes.heading)}>{col.title}</h3>
              </div>
              <div className={cn("flex-1 rounded-lg p-2 space-y-2", isDark ? "bg-white/[0.02]" : "bg-neutral-50")}>
                {[...Array(2)].map((_, i) => (
                  <div key={i} className={cn("rounded-lg p-3 animate-pulse", classes.card)}>
                    <div className={cn("h-4 w-3/4 rounded mb-2", isDark ? "bg-neutral-700" : "bg-neutral-200")} />
                    <div className={cn("h-3 w-full rounded", isDark ? "bg-neutral-700" : "bg-neutral-200")} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Board header */}
      <div className="px-4 pt-4 pb-2 flex flex-col shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className={cn("text-[14px] font-semibold", classes.heading)}>Task Board</h2>
            <span className={cn("text-[11px]", classes.muted)}>{filteredTasks.length} tasks</span>
            {tasks.some(isStalled) && (
              <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                {tasks.filter(isStalled).length} stalled
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md transition-colors border",
                showFilters || hasFilters
                  ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                  : isDark ? "border-neutral-700 text-neutral-400 hover:bg-white/5" : "border-neutral-300 text-neutral-500 hover:bg-neutral-50"
              )}
            >
              <Filter className="w-3 h-3" /> Filters
              {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
            </button>
            {onNewTask && (
              <button onClick={onNewTask} className="flex items-center space-x-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-medium px-3 py-1.5 rounded-md transition-colors">
                <ChevronRight className="w-3.5 h-3.5 rotate-0" /><span>Add Task</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className={cn("flex items-center gap-3 mt-3 p-2 rounded-lg border", isDark ? "border-white/5 bg-white/[0.02]" : "border-gray-200 bg-gray-50")}>
            {/* Agent filter */}
            <select
              value={filterAgent}
              onChange={e => setFilterAgent(e.target.value)}
              className={cn("text-[11px] px-2 py-1 rounded border outline-none", isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-gray-200")}
            >
              <option value="all">All Agents</option>
              {agents.map(a => (
                <option key={a.id} value={a.name}>{a.name}</option>
              ))}
            </select>

            {/* Date filter */}
            <select
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className={cn("text-[11px] px-2 py-1 rounded border outline-none", isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-gray-200")}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            {/* Active filter */}
            <select
              value={filterActive}
              onChange={e => setFilterActive(e.target.value)}
              className={cn("text-[11px] px-2 py-1 rounded border outline-none", isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-gray-200")}
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="done">Done</option>
              <option value="stalled">Stalled</option>
            </select>

            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Columns — fit all columns in view, no horizontal scroll */}
      <div className="flex-1 overflow-y-hidden px-4 pb-4">
        <div className="flex gap-2 h-full" style={{ minWidth: 0 }}>
          {KANBAN_COLUMNS.map((column) => {
            const columnTasks = filteredTasks.filter(t => t.status === column.id);
            const isDone = column.id === 'done';

            return (
              <div key={column.id} className="flex-1 flex flex-col h-full min-w-0">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: column.color }} />
                    <h3 className={cn("text-[12px] font-semibold truncate", classes.heading)}>{column.title}</h3>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full shrink-0", isDark ? "bg-neutral-800 text-neutral-400" : "bg-neutral-200 text-neutral-600")}>
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Task list */}
                <div className={cn("flex-1 rounded-lg p-1.5 space-y-1.5 overflow-y-auto custom-scroll", isDark ? "bg-white/[0.02]" : "bg-neutral-50/50")}>
                  {columnTasks.map((task) => {
                    const stalled = isStalled(task);
                    const pinged = pingedTasks.has(task.id);
                    return (
                      <div
                    key={task.id}
                    className={cn(
                      "group border rounded-lg p-2.5 transition-all",
                      classes.card, classes.hoverCard,
                      stalled && "border-amber-500/40 bg-amber-500/5"
                    )}
                  >
                    {stalled && (
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-1 text-[9px] text-amber-400 font-semibold">
                          <AlertTriangle className="w-2.5 h-2.5" /> STALLED
                        </span>
                        <button
                          onClick={(e) => handlePing(task, e)}
                          className={cn(
                            "flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium transition-all",
                            pinged ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                          )}
                        >
                          <Bell className="w-2 h-2" />
                          {pinged ? 'Pinged!' : 'Ping'}
                        </button>
                      </div>
                    )}

                    <div onClick={() => onTaskClick(task)} className="cursor-pointer">
                      <h4 className={cn("text-[11px] font-medium mb-0.5 line-clamp-2", classes.heading)}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className={cn("text-[9px] line-clamp-1 mb-1.5", classes.muted)}>{task.description}</p>
                      )}
                    </div>

                    {/* Output for done tasks */}
                    {isDone && (() => {
                      const filePath = extractFilePath(task.description || '');
                      if (!filePath) return null;
                      return (
                        <div onClick={e => e.stopPropagation()} className={cn("mb-1.5 p-2 rounded-md border", isDark ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50 border-emerald-200")}>
                          <div className="flex items-center gap-1 mb-1">
                            <FileText className="w-3 h-3 text-emerald-400" />
                            <span className="text-[9px] text-emerald-500 font-semibold uppercase">Output</span>
                          </div>
                          <div className={cn("text-[9px] truncate mb-1 font-mono px-1 py-0.5 rounded", isDark ? "bg-neutral-800 text-neutral-300" : "bg-neutral-100 text-neutral-600")}>
                            {filePath}
                          </div>
                          <div className="flex gap-1">
                            <button type="button" onClick={() => setPreviewFile(filePath)} className="flex-1 flex items-center justify-center gap-1 text-[8px] bg-violet-600/20 text-violet-400 border border-violet-500/20 rounded px-1.5 py-0.5">
                              <Eye className="w-2 h-2" /> Preview
                            </button>
                            <a href={`/api/files?path=${encodeURIComponent(filePath)}&action=download`}
                              className="flex-1 flex items-center justify-center gap-1 text-[8px] bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5">
                              <Download className="w-2 h-2" /> Download
                            </a>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-1.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1">
                          {task.assignees?.slice(0, 2).map((assignee, i) => (
                            <img key={i} src={getAvatar(assignee.replace(/^@+/, ''))} alt={assignee}
                              className="w-4 h-4 rounded-full border border-neutral-900" title={assignee} />
                          ))}
                        </div>
                        <span className={cn("text-[8px]", classes.subtle)}>{timeAgo(task.created_at)}</span>
                      </div>
                      {/* Only show Move button for non-done tasks */}
                      {!isDone && <MoveMenu task={task} onMove={onMoveTask} isDark={isDark} />}
                      {isDone && task.status === 'done' && (
                        <span className="text-[9px] text-emerald-400 font-medium">✓ Complete</span>
                      )}
                    </div>
                  </div>
                    );
                  })}

                  {columnTasks.length === 0 && (
                    <div className={cn("flex flex-col items-center justify-center py-6 text-center border-2 border-dashed rounded-lg", classes.divider)}>
                      <p className={cn("text-[10px]", classes.muted)}>No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    <MarkdownPreviewModal
      isOpen={!!previewFile}
      onClose={() => setPreviewFile(null)}
      filePath={previewFile || ''}
      theme={theme}
    />
    </div>
  );
}
