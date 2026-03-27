'use client';

import { cn } from '@/lib/utils';
import { useThemeClasses } from '@/hooks/useTheme';
import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, ExternalLink, Wrench, Globe, Bot, ChevronDown, ChevronUp, Package, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Agent } from '@/lib/types';

interface SkillsViewProps {
  theme: 'dark' | 'light';
  agents: Agent[];
  onUpdateAgent: (agent: Partial<Agent> & { id: string }) => Promise<void>;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  path: string;
  scope: 'global' | 'agent';
  source: 'workspace' | 'npm';
}

export function SkillsView({ theme, agents, onUpdateAgent }: SkillsViewProps) {
  const isDark = theme === 'dark';
  const classes = useThemeClasses(isDark);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Assignment Modal State
  const [assigningSkill, setAssigningSkill] = useState<Skill | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/skills');
      const data = await res.json();
      if (data.skills) {
        setSkills(data.skills.map((s: any) => ({
          ...s,
          scope: s.category === 'Core' || s.category === 'Utilities' ? 'global' : 'agent',
          source: 'workspace'
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(skills.map(s => s.category));
    return ['All', ...Array.from(cats)].sort();
  }, [skills]);

  const filtered = useMemo(() => {
    return skills.filter(s => {
      if (selectedCategory !== 'All' && s.category !== selectedCategory) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [skills, search, selectedCategory]);

  const stats = {
    total: skills.length,
    global: skills.filter(s => s.scope === 'global').length,
    agent: skills.filter(s => s.scope === 'agent').length,
  };

  const handleToggleSkill = async (agent: Agent, skillName: string) => {
    setUpdating(true);
    try {
      const currentPrompt = agent.prompt || '';
      let newPrompt = currentPrompt;
      
      const skillTag = `[Skill: ${skillName}]`;
      const hasSkill = currentPrompt.includes(skillTag);
      
      if (hasSkill) {
        newPrompt = currentPrompt.replace(skillTag, '').trim();
      } else {
        newPrompt = currentPrompt + `\n${skillTag}`;
      }
      
      await onUpdateAgent({ id: agent.id, prompt: newPrompt.trim() });
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto relative h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={cn("text-2xl font-bold tracking-tight", classes.heading)}>Workspace Skills</h2>
          <p className={cn("text-sm mt-1", isDark ? "text-gray-400" : "text-gray-600")}>
            {loading ? 'Loading skills...' : `${stats.total} skills active in the workspace`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSkills}
            className="flex items-center justify-center p-2 rounded-lg border transition-colors bg-white/5 border-gray-700 hover:bg-white/10"
            title="Refresh Skills"
          >
            <RefreshCw className={cn("w-4 h-4", loading ? "animate-spin" : "")} />
          </button>
          <a
            href="https://clawhub.com"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[12px] font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>ClawhHub</span>
          </a>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className={cn("flex items-center gap-2 px-3 py-2.5 rounded-lg border flex-1 shadow-sm", isDark ? "bg-gray-800/80 border-gray-700" : "bg-white border-gray-200")}>
          <Search className={cn("w-4 h-4", isDark ? "text-gray-500" : "text-gray-400")} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for a skill or capability..."
            className={cn("bg-transparent text-sm outline-none flex-1 font-medium", isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400")}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "text-[12px] px-4 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all duration-200",
              selectedCategory === cat
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                : isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700/50" : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200/50"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
             <div key={i} className={cn("h-24 rounded-xl animate-pulse", isDark ? "bg-gray-800/50" : "bg-gray-200/50")} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={cn("text-center py-16 rounded-xl border border-dashed", isDark ? "border-gray-700 text-gray-500" : "border-gray-300 text-gray-400")}>
          <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No skills found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
          {filtered.map(skill => (
            <div
              key={skill.name}
              className={cn(
                "group flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 hover:shadow-lg",
                isDark ? "bg-gray-800/40 border-gray-700/60 hover:border-violet-500/40 hover:bg-gray-800/80" : "bg-white border-gray-200 hover:border-violet-400 hover:bg-gray-50"
              )}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm",
                    skill.scope === 'global' ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
                  )}>
                    {skill.scope === 'global' ? <Globe className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider",
                    isDark ? "bg-gray-900/50 text-gray-400" : "bg-gray-100 text-gray-500"
                  )}>
                    {skill.category}
                  </span>
                </div>
                <h3 className={cn("text-[14px] font-bold mb-1 truncate", isDark ? "text-gray-100" : "text-gray-900")} title={skill.name}>
                  {skill.name}
                </h3>
                <p className={cn("text-[12px] leading-relaxed line-clamp-2", isDark ? "text-gray-400" : "text-gray-500")} title={skill.description}>
                  {skill.description}
                </p>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-700/30">
                 <button
                   onClick={() => setAssigningSkill(skill)}
                   className="w-full py-2 rounded-lg text-xs font-semibold bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors"
                 >
                   Assign to Agents
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      {assigningSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={cn(
            "w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden",
            isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
          )}>
            <div className={cn("p-5 border-b", isDark ? "border-gray-800" : "border-gray-100")}>
              <h3 className={cn("text-lg font-bold flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
                <Wrench className="w-5 h-5 text-violet-500" />
                Assign {assigningSkill.name}
              </h3>
              <p className={cn("text-xs mt-1", isDark ? "text-gray-400" : "text-gray-500")}>Select which agents should have access to this skill.</p>
            </div>
            
            <div className="p-3 max-h-[60vh] overflow-y-auto space-y-2">
              {agents.map(agent => {
                const hasSkill = (agent.prompt || '').includes(`[Skill: ${assigningSkill.name}]`);
                return (
                  <div
                    key={agent.id}
                    onClick={() => !updating && handleToggleSkill(agent, assigningSkill.name)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
                      hasSkill 
                        ? (isDark ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200") 
                        : (isDark ? "bg-gray-800/40 border-transparent hover:border-gray-700 hover:bg-gray-800" : "bg-gray-50 border-transparent hover:border-gray-200"),
                      updating && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${agent.name.replace('@','')}&backgroundColor=6366f1`} alt={agent.name} className="w-10 h-10 rounded-full bg-gray-800" />
                      </div>
                      <div>
                        <div className={cn("font-bold text-sm", isDark ? "text-gray-200" : "text-gray-900")}>{agent.name}</div>
                        <div className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>{agent.role || 'No role'}</div>
                      </div>
                    </div>
                    <div>
                      {hasSkill ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/20 text-emerald-500 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Assigned
                        </div>
                      ) : (
                        <div className={cn("px-3 py-1.5 rounded-md text-xs font-semibold", isDark ? "bg-gray-800 text-gray-400" : "bg-gray-200 text-gray-600")}>
                          Assign
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className={cn("p-4 border-t flex justify-end", isDark ? "border-gray-800 bg-gray-900/50" : "border-gray-100 bg-gray-50")}>
               <button
                 onClick={() => setAssigningSkill(null)}
                 className={cn("px-5 py-2 rounded-lg text-sm font-semibold transition-colors", isDark ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-900")}
               >
                 Done
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
