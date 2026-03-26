'use client';

import { useState, useEffect } from 'react';

const MCP_URL = 'https://earrqspffkrnreucmtvf.supabase.co/functions/v1/datahub-mcp-server';

export function AnalyticsView() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      const fmt = (d: Date) => d.toISOString().split('T')[0];
      const resp = await fetch(MCP_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mcp_gCNsJa4XoP3Tb9o143jPiR1AyoF5iN7HITnPmZwwfHdIk6aC'
        },
        body: JSON.stringify({
          jsonrpc: '2.0', method: 'tools/call',
          params: { name: 'get_margin_analysis', arguments: { startDate: fmt(start), endDate: fmt(end) } },
          id: 1,
        }),
      });
      const json = await resp.json();
      if (json.error) { setError(JSON.stringify(json.error)); return; }
      const content = json.result?.content?.[0]?.text;
      if (content) { try { setData(JSON.parse(content)); } catch { setData(null); } }
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const summary = data?.summary;
  const topProducts = data?.top_margin_products?.slice(0, 8) || [];
  const bottomProducts = data?.bottom_margin_products?.slice(0, 5) || [];
  const dailyTrends = data?.daily_trends || [];
  const categoryBreakdown = data?.category_breakdown || [];

  const fmtNum = (n: number | null | undefined) => n != null ? Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—';
  const fmtPct = (n: number | null | undefined) => n != null ? Number(n).toFixed(1) + '%' : '—';

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-neutral-400 mt-1">Margin Analysis — Last 30 Days</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium">
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="bg-red-900/20 border border-red-700 text-red-200 p-4 rounded"><pre className="text-xs">{error}</pre></div>}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total GMV', value: fmtNum(summary.total_gmv), color: 'text-white', sub: 'ETB' },
            { label: 'Total Cost', value: fmtNum(summary.total_cost), color: 'text-amber-400', sub: 'ETB' },
            { label: 'Gross Margin', value: fmtNum(summary.total_gross_margin), color: 'text-emerald-400', sub: 'ETB' },
            { label: 'Net Margin', value: fmtNum(summary.total_net_margin), color: 'text-blue-400', sub: 'ETB' },
            { label: 'Margin %', value: fmtPct(summary.avg_margin_percent), color: 'text-violet-400', sub: 'avg' },
            { label: 'Coverage', value: fmtPct(summary.coverage_percent), color: 'text-cyan-400', sub: `${summary.matched_products}/${summary.matched_products + summary.unmatched_products}` },
          ].map(card => (
            <div key={card.label} className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">{card.label}</div>
              <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
              <div className="text-[9px] text-neutral-600 mt-0.5">{card.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Daily Trends - simple bar chart */}
      {dailyTrends.length > 0 && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Daily GMV Trend</h3>
          <div className="flex items-end gap-1 h-32 overflow-x-auto">
            {dailyTrends.map((d: any, i: number) => {
              const maxGmv = Math.max(...dailyTrends.map((t: any) => t.gmv || 0));
              const h = maxGmv > 0 ? ((d.gmv || 0) / maxGmv) * 100 : 0;
              return (
                <div key={i} className="flex flex-col items-center flex-shrink-0" style={{ width: Math.max(20, 600 / dailyTrends.length) }}>
                  <div className="w-full bg-violet-500/30 rounded-t relative group" style={{ height: `${h}%`, minHeight: 2 }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-800 text-[9px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                      {fmtNum(d.gmv)} ETB
                    </div>
                  </div>
                  <div className="text-[8px] text-neutral-600 mt-1 -rotate-45 origin-top-left whitespace-nowrap">
                    {(d.date || '').slice(5)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Category Breakdown</h3>
            <div className="space-y-2">
              {categoryBreakdown.map((cat: any, i: number) => {
                const maxGmv = Math.max(...categoryBreakdown.map((c: any) => c.gmv || 0));
                const pct = maxGmv > 0 ? ((cat.gmv || 0) / maxGmv) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-neutral-300">{cat.category}</span>
                      <span className="text-neutral-500">{fmtNum(cat.gmv)} ETB · {fmtPct(cat.margin_percent)}</span>
                    </div>
                    <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500/60 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Margin Products */}
        {topProducts.length > 0 && (
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Top Margin Products</h3>
            <div className="space-y-1.5">
              {topProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-neutral-800/50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] text-neutral-600 w-4">{i + 1}</span>
                    <span className="text-xs text-neutral-300 truncate">{p.product_name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-emerald-400">{fmtPct(p.margin_percent)}</span>
                    <span className="text-[10px] text-neutral-500">{fmtNum(p.gmv)} ETB</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Margin Products */}
      {bottomProducts.length > 0 && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white mb-3">⚠️ Low Margin Products</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {bottomProducts.map((p: any, i: number) => (
              <div key={i} className="bg-red-900/10 border border-red-900/30 rounded-lg p-3">
                <div className="text-xs text-neutral-300 truncate mb-1">{p.product_name}</div>
                <div className="text-lg font-bold text-red-400">{fmtPct(p.margin_percent)}</div>
                <div className="text-[10px] text-neutral-500">GMV: {fmtNum(p.gmv)} ETB</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="text-center text-neutral-500 py-12">No data available. Click Refresh to load.</div>
      )}
    </div>
  );
}
