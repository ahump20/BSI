'use client';

import { useState } from 'react';

const phases = [
  {
        id: 1,
        title: 'Data Foundation',
        weeks: '1-4',
        status: 'in-progress',
        items: [
          { task: 'D1 Database Schema', status: 'done', detail: 'bsi-portal-db created' },
          { task: 'KV Cache Namespace', status: 'done', detail: 'BSI_PORTAL_CACHE created' },
          { task: 'Twitter/X Monitoring', status: 'pending', detail: 'API access needed' },
          { task: 'NCAA Stats Scraper', status: 'pending', detail: 'baseballr integration' },
          { task: 'Public Tracker MVP', status: 'pending', detail: 'Basic search/filter' },
              ],
        metrics: ['Track 100% D1 entries', '<5% false positive rate', 'Enrich 80%+ with stats'],
  },
  {
        id: 2,
        title: 'Alert System',
        weeks: '5-8',
        status: 'upcoming',
        items: [
          { task: 'Push Notifications', status: 'pending', detail: 'OneSignal integration' },
          { task: 'Email Sequences', status: 'pending', detail: 'Entry/commitment/digest' },
          { task: 'Subscription Management', status: 'pending', detail: 'Watchlists + filters' },
          { task: 'Queue Processing', status: 'pending', detail: 'Cloudflare Queues' },
              ],
        metrics: ['1,000+ email subs', '<1 min latency', '50%+ open rate'],
  },
  {
        id: 3,
        title: 'Content Automation',
        weeks: '9-12',
        status: 'upcoming',
        items: [
          { task: 'Player Profile Gen', status: 'pending', detail: 'GPT-4o integration' },
          { task: 'Destination Predictions', status: 'pending', detail: 'Historical patterns' },
          { task: 'Social Content Pipeline', status: 'pending', detail: 'Auto-post to X' },
          { task: 'SEO Landing Pages', status: 'pending', detail: 'Per-player pages' },
              ],
        metrics: ['<$0.05/entry cost', '100% profile coverage', '3+ posts/day'],
  },
  {
        id: 4,
        title: 'B2B Scaling',
        weeks: 'Q2 2026',
        status: 'future',
        items: [
          { task: 'API Licensing', status: 'pending', detail: 'Betting operators' },
          { task: 'Coach Subscriptions', status: 'pending', detail: '300 D1 programs' },
          { task: 'Data Syndication', status: 'pending', detail: 'Media licensing' },
          { task: 'D2/JUCO Expansion', status: 'pending', detail: 'Coverage depth' },
              ],
        metrics: ['$50K+ ARR', '2+ B2B deals', '75% retention'],
  },
  ];

const infrastructure = {
    created: [
      { name: 'bsi-portal-db', type: 'D1', id: 'd48fd89c-f2de-415b-935b-429f5e1fd60e' },
      { name: 'BSI_PORTAL_CACHE', type: 'KV', id: 'edab31e13ebf4e12902f8e8bb5f74f07' },
        ],
    existing: [
      { name: 'bsi-home', type: 'Worker' },
      { name: 'bsi-historical-db', type: 'D1' },
      { name: 'blaze-data', type: 'R2' },
        ],
};

const economics = {
    market: { portalSize: '6,249', successRate: '39%' },
    revenue: {
          free: { price: '$0', features: 'Basic tracker, delayed alerts' },
          pro: { price: '$9.99/mo', features: 'Real-time, full database' },
          enterprise: { price: '$199/mo', features: 'API, exports, white-label' },
    },
};

export default function PortalTrackerPage() {
    const [activePhase, setActivePhase] = useState(1);

  return (
        <div className="min-h-screen bg-[#0d0d12]">
              <section className="pt-32 pb-16 px-6 text-center bg-gradient-to-b from-[#0d0d12] to-[#161620]">
                      <div className="max-w-4xl mx-auto">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#bf5700]/10 border border-[#bf5700]/30 mb-6">
                                            <span className="w-2 h-2 rounded-full bg-[#ff6b35] animate-pulse"></span>span>
                                            <span className="text-[#bf5700] text-sm font-semibold uppercase tracking-wider">Implementation Blueprint</span>span>
                                </div>div>
                                <h1 className="text-4xl md:text-6xl font-extrabold uppercase tracking-tight mb-4">
                                            <span className="text-[#bf5700]">Transfer Portal</span>span> Tracker
                                </h1>h1>
                                <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
                                            Automation-powered college baseball portal dominance • Target: June 2, 2026
                                </p>p>
                                <div className="flex flex-wrap justify-center gap-4">
                                            <a href="/college-baseball/portal/tracker" className="px-8 py-3 bg-[#bf5700] text-white font-semibold rounded-xl hover:bg-[#bf5700]/90 transition-all">View Tracker</a>a>
                                            <a href="/college-baseball" className="px-8 py-3 border-2 border-[#bf5700] text-[#bf5700] font-semibold rounded-xl hover:bg-[#bf5700]/10 transition-all">College Baseball</a>a>
                                </div>div>
                      </div>div>
              </section>section>
        
              <section className="py-16 px-6 bg-[#161620]">
                      <h2 className="text-center text-sm font-semibold text-[#bf5700] uppercase tracking-widest mb-8">Market Opportunity</h2>h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                        {[
          { value: economics.market.portalSize, label: 'D1 Players in 2025 Portal', highlight: true },
          { value: economics.market.successRate, label: 'Found New Homes' },
          { value: '400x', label: 'Cost Advantage vs Manual' },
          { value: '$0', label: 'Dominant Tracker Exists', highlight: true },
                    ].map((stat, i) => (
                                  <div key={i} className={`text-center p-6 rounded-2xl border ${stat.highlight ? 'bg-[#bf5700]/10 border-[#bf5700]/40' : 'bg-[#1f1f2e] border-[#bf5700]/20'}`}>
                                                <div className={`text-3xl md:text-4xl font-extrabold mb-2 ${stat.highlight ? 'text-[#bf5700]' : 'text-white'}`}>{stat.value}</div>div>
                                                <div className="text-xs text-gray-400 uppercase tracking-wider">{stat.label}</div>div>
                                  </div>div>
                                ))}
                      </div>div>
              </section>section>
        
              <section className="py-8 px-6 bg-[#0d0d12]">
                      <div className="flex flex-wrap justify-center gap-2 max-w-5xl mx-auto">
                        {phases.map((phase) => (
                      <button key={phase.id} onClick={() => setActivePhase(phase.id)}
                                      className={`px-5 py-3 rounded-xl font-semibold text-sm uppercase tracking-wide transition-all ${activePhase === phase.id ? 'bg-[#bf5700] text-white' : 'bg-[#1f1f2e] text-gray-400 border border-[#bf5700]/20 hover:text-white hover:border-[#bf5700]/50'}`}>
                                    Phase {phase.id}: {phase.title}<span className="ml-2 text-xs opacity-70">{phase.weeks}</span>span>
                      </button>button>
                    ))}
                      </div>div>
              </section>section>
        
              <section className="py-8 px-6 max-w-5xl mx-auto">
                {phases.filter(p => p.id === activePhase).map((phase) => (
                    <div key={phase.id} className="bg-[#1f1f2e] rounded-3xl p-6 md:p-8 border border-[#bf5700]/20">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                                              <div>
                                                              <h3 className="text-2xl font-bold uppercase"><span className="text-[#bf5700]">Phase {phase.id}:</span>span> {phase.title}</h3>h3>
                                                              <p className="text-gray-400 text-sm mt-1">Weeks {phase.weeks}</p>p>
                                              </div>div>
                                              <span className={`mt-4 md:mt-0 inline-flex px-4 py-1.5 rounded-lg text-xs font-bold uppercase ${phase.status === 'in-progress' ? 'bg-[#ff6b35]/20 text-[#ff6b35]' : 'bg-gray-500/20 text-gray-400'}`}>{phase.status}</span>span>
                                </div>div>
                                <div className="grid md:grid-cols-3 gap-8">
                                              <div className="md:col-span-2">
                                                              <h4 className="text-xs text-gray-400 uppercase tracking-widest mb-4">Deliverables</h4>h4>
                                                              <div className="space-y-3">
                                                                {phase.items.map((item, i) => (
                                          <div key={i} className={`flex items-center gap-4 p-4 bg-[#0d0d12] rounded-xl border-l-4 ${item.status === 'done' ? 'border-green-500' : 'border-gray-600'}`}>
                                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${item.status === 'done' ? 'bg-green-500 text-white' : 'border-2 border-gray-600'}`}>{item.status === 'done' && '✓'}</span>span>
                                                                <div className="flex-1">
                                                                                        <div className="font-medium">{item.task}</div>div>
                                                                                        <div className="text-gray-400 text-sm">{item.detail}</div>div>
                                                                </div>div>
                                          </div>div>
                                        ))}
                                                              </div>div>
                                              </div>div>
                                              <div>
                                                              <h4 className="text-xs text-gray-400 uppercase tracking-widest mb-4">Success Metrics</h4>h4>
                                                              <div className="bg-[#0d0d12] rounded-xl p-4 space-y-3">
                                                                {phase.metrics.map((metric, i) => (
                                          <div key={i} className={`flex items-center gap-3 py-2 ${i < phase.metrics.length - 1 ? 'border-b border-[#bf5700]/10' : ''}`}>
                                                                <span className="text-[#bf5700]">→</span>span>
                                                                <span className="text-sm">{metric}</span>span>
                                          </div>div>
                                        ))}
                                                              </div>div>
                                              </div>div>
                                </div>div>
                    </div>div>
                  ))}
              </section>section>
        
              <section className="py-16 px-6 bg-[#0d0d12]">
                      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                                <div className="bg-[#1f1f2e] rounded-2xl p-6 border border-[#bf5700]/20">
                                            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#bf5700] mb-4 flex items-center gap-2"><span className="text-green-500">✓</span>span> Infrastructure Created</h3>h3>
                                            <div className="space-y-3">
                                              {infrastructure.created.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-[#0d0d12] rounded-lg">
                                            <div><div className="font-mono font-medium">{item.name}</div>div><div className="font-mono text-xs text-gray-500">{item.id}</div>div></div>div>
                                            <span className="px-2 py-1 rounded text-xs bg-[#bf5700]/20 text-[#bf5700]">{item.type}</span>span>
                          </div>div>
                        ))}
                                            </div>div>
                                </div>div>
                                <div className="bg-[#1f1f2e] rounded-2xl p-6 border border-[#bf5700]/20">
                                            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Existing Resources to Leverage</h3>h3>
                                            <div className="space-y-3">
                                              {infrastructure.existing.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-[#0d0d12] rounded-lg">
                                            <div className="font-mono">{item.name}</div>div>
                                            <span className="px-2 py-1 rounded text-xs bg-gray-500/20 text-gray-400">{item.type}</span>span>
                          </div>div>
                        ))}
                                            </div>div>
                                </div>div>
                      </div>div>
              </section>section>
        
              <section className="py-16 px-6 bg-gradient-to-b from-[#161620] to-[#0d0d12]">
                      <h2 className="text-center text-sm font-semibold text-[#bf5700] uppercase tracking-widest mb-8">Revenue Model</h2>h2>
                      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {Object.entries(economics.revenue).map(([tier, data]) => (
                      <div key={tier} className={`text-center p-6 rounded-2xl relative ${tier === 'pro' ? 'bg-[#1f1f2e] border-2 border-[#bf5700]' : 'bg-[#1f1f2e] border border-[#bf5700]/20'}`}>
                        {tier === 'pro' && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#bf5700] text-white text-xs font-bold rounded">Most Popular</span>span>}
                                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">{tier}</div>div>
                                    <div className={`text-4xl font-extrabold mb-4 ${tier === 'pro' ? 'text-[#bf5700]' : 'text-white'}`}>{data.price}</div>div>
                                    <div className="text-sm text-gray-400">{data.features}</div>div>
                      </div>div>
                    ))}
                      </div>div>
              </section>section>
        
              <section className="py-16 px-6 text-center border-t border-[#bf5700]/10">
                      <p className="text-gray-500 text-sm">Blaze Sports Intel • Born to Blaze the Path Less Beaten</p>p>
              </section>section>
        </div>div>
      );
}</div>
