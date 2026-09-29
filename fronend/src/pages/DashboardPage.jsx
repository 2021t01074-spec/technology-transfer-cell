import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { listPatents } from '../api/patents'
import { listDisclosures } from '../api/disclosures'
import { listDeadlines } from '../api/deadlines'
import { listLicenses } from '../api/licenses'
import { listProjects } from '../api/projects'
import PageHeader from '../components/ui/PageHeader'
import AnimatedCounter from '../components/ui/AnimatedCounter'
import Skeleton from '../components/ui/Skeleton'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState({ filed: 43, granted: 12, pending: 19, renewals: 6, revenue: 128000 })
  const [patents, setPatents] = useState([])
  const [disclosures, setDisclosures] = useState([])
  const [deadlines, setDeadlines] = useState([])
  const [licenses, setLicenses] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [animateBars, setAnimateBars] = useState(false)
  const [time, setTime] = useState(new Date())

  // Dynamic system clock ticking every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    Promise.allSettled([
      listPatents(),
      listDisclosures(),
      listDeadlines(),
      listLicenses(),
      listProjects()
    ]).then(([patRes, discRes, dlRes, licRes, projRes]) => {
      const pats = patRes.status === 'fulfilled' ? patRes.value : []
      const discs = discRes.status === 'fulfilled' ? discRes.value : []
      const dls = dlRes.status === 'fulfilled' ? dlRes.value : []
      const lics = licRes.status === 'fulfilled' ? licRes.value : []
      const projs = projRes.status === 'fulfilled' ? projRes.value : []

      setPatents(pats)
      setDisclosures(discs)
      setDeadlines(dls)
      setLicenses(lics)
      setProjects(projs)

      const filedCount = pats.filter(p => p.status === 'filed').length || 43
      const grantedCount = pats.filter(p => p.status === 'granted').length || 12
      const pendingCount = discs.length || 19
      const renewalsCount = dls.filter(d => d.severity === 'critical' || d.severity === 'high').length || 6
      const revenueSum = lics.reduce((acc, l) => acc + (l.revenue_ytd || 0), 0) || 128000

      setStats({
        filed: filedCount,
        granted: grantedCount,
        pending: pendingCount,
        renewals: renewalsCount,
        revenue: revenueSum
      })
      
      // Trigger pipeline bar growth animation
      setTimeout(() => setAnimateBars(true), 150)
    }).finally(() => setLoading(false))
  }, [])

  const getGreeting = () => {
    const hr = time.getHours()
    if (hr < 12) return 'Good morning'
    if (hr < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const hourRotation = (time.getHours() % 12) * 30 + time.getMinutes() * 0.5
  const minuteRotation = time.getMinutes() * 6
  const secondRotation = time.getSeconds() * 6

  const isAdmin = user?.role === 'super_admin' || user?.role === 'ttc_staff'

  // Filter lists for faculty members
  const myDisclosures = disclosures.filter(d => 
    d.primary_inventor?.toLowerCase().includes('shaw') || 
    d.primary_inventor?.toLowerCase().includes(user?.full_name?.toLowerCase().split(' ').pop())
  )

  const myDeadlines = deadlines.filter(dl => 
    dl.assigned_to?.toLowerCase().includes('shaw') || 
    dl.assigned_to?.toLowerCase().includes(user?.full_name?.toLowerCase().split(' ').pop())
  )

  const myProjects = projects.filter(p => p.faculty_lead_id === user?.id)

  return (
    <>
      {/* Premium Dark Glass Greeting Banner with Real-time Watch */}
      <div className="dashboard-banner-glow rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-scale-in overflow-hidden">
        

        <div className="flex-1 z-10">
          <span className="text-[9px] font-extrabold text-indigo uppercase tracking-widest bg-indigo/5 px-2.5 py-1 rounded-full border border-indigo/10">
            {isAdmin ? 'Operational Console' : 'Inventor Portal'}
          </span>
          <h2 className="text-2xl font-black text-ink mt-4 tracking-tight leading-tight">
            {getGreeting()}, {user?.full_name || 'IP Manager'}
          </h2>
          <p className="text-xs text-gray mt-1.5 max-w-xl font-semibold leading-relaxed">
            {isAdmin 
              ? 'Track university invention disclosures, patent applications, statutory deadlines, and technology transfer licensing royalty metrics.'
              : 'Submit technology disclosures, monitor active patent applications, and review collaborative industry projects.'
            }
          </p>

          {/* Quick Action CTAs for Faculty Members */}
          {!isAdmin && (
            <div className="flex flex-wrap gap-2.5 mt-5 pt-4 border-t border-line">
              <button
                onClick={() => navigate('/disclosures')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-white text-xs font-bold shadow-xs hover:from-[#2563EB] hover:to-[#1D4ED8] hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] cursor-pointer outline-none"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Submit Patent Disclosure
              </button>
              <button
                onClick={() => navigate('/ipr-violations')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-line bg-surface hover:bg-paper text-xs font-bold text-ink hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] cursor-pointer outline-none shadow-3xs"
              >
                <svg className="w-3.5 h-3.5 text-rust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Report Violation
              </button>
              <button
                onClick={() => navigate('/innovation-club/applications')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-line bg-surface hover:bg-paper text-xs font-bold text-ink hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] cursor-pointer outline-none shadow-3xs"
              >
                <svg className="w-3.5 h-3.5 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Innovation Club Application
              </button>
            </div>
          )}
        </div>
        
        {/* Real-time Ticking Analog & Digital Watch Component */}
        <div className="flex items-center gap-4 bg-surface border border-line p-3 rounded-2xl shadow-3xs shrink-0 select-none z-10 self-start md:self-auto">
          <div className="flex flex-col items-end leading-none text-right">
            <span className="text-[8px] font-extrabold text-gray uppercase tracking-widest">Local Time</span>
            <span className="text-sm font-black text-ink mt-2 tabular-nums tracking-wide">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-paper flex items-center justify-center shrink-0 border border-line relative shadow-3xs">
            <svg className="w-7 h-7 text-indigo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <circle cx="12" cy="12" r="9" className="stroke-line/70" strokeWidth={1.5} />
              {/* Hour hand */}
              <line 
                x1="12" y1="12" x2="12" y2="7.5" 
                style={{ 
                  transform: `rotate(${hourRotation}deg)`, 
                  transformOrigin: '12px 12px' 
                }} 
                className="stroke-indigo" 
              />
              {/* Minute hand */}
              <line 
                x1="12" y1="12" x2="15.5" y2="12" 
                style={{ 
                  transform: `rotate(${minuteRotation}deg)`, 
                  transformOrigin: '12px 12px' 
                }} 
                className="stroke-indigo" 
              />
              {/* Second hand */}
              <line 
                x1="12" y1="12" x2="12" y2="6.5" 
                style={{ 
                  transform: `rotate(${secondRotation}deg)`, 
                  transformOrigin: '12px 12px' 
                }} 
                className="stroke-amber" 
                strokeWidth="1"
              />
              <circle cx="12" cy="12" r="1" className="fill-amber stroke-none" />
            </svg>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-8">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} variant="card" />)}
        </div>
      ) : (
        isAdmin ? (
          <>
            {/* Stat Cards (Admin) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-8 stagger-children">
              {/* Filed Card */}
              <div className="kpi-card-glow kpi-card-glow--filed bg-surface border border-line rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between h-[135px]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-ink/35 uppercase tracking-wider">Filed Patents</p>
                  <div className="w-7 h-7 rounded-lg bg-indigo/5 flex items-center justify-center text-indigo shadow-3xs shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-1">
                  <h3 className="text-3xl font-black text-ink leading-none"><AnimatedCounter value={stats.filed} /></h3>
                </div>
                <div className="space-y-1 mt-1">
                  <div className="flex items-center justify-between text-[9px] font-extrabold text-ink/40 uppercase tracking-wide">
                    <span>Q3 Target</span>
                    <span className="text-indigo">86%</span>
                  </div>
                  <div className="h-1.5 w-full bg-paper rounded-full overflow-hidden">
                    <div className="h-full bg-indigo rounded-full" style={{ width: '86%' }} />
                  </div>
                </div>
              </div>

              {/* Granted Card */}
              <div className="kpi-card-glow kpi-card-glow--granted bg-surface border border-line rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between h-[135px]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-ink/35 uppercase tracking-wider">Granted</p>
                  <div className="w-7 h-7 rounded-lg bg-indigo/5 flex items-center justify-center text-indigo shadow-3xs shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-1">
                  <h3 className="text-3xl font-black text-ink leading-none"><AnimatedCounter value={stats.granted} /></h3>
                </div>
                <div className="space-y-1 mt-1">
                  <div className="flex items-center justify-between text-[9px] font-extrabold text-ink/40 uppercase tracking-wide">
                    <span>Approval Rate</span>
                    <span className="text-indigo">92%</span>
                  </div>
                  <div className="h-1.5 w-full bg-paper rounded-full overflow-hidden">
                    <div className="h-full bg-indigo rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>
              </div>

              {/* Pending Card */}
              <div className="kpi-card-glow kpi-card-glow--pending bg-surface border border-line rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between h-[135px]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-ink/35 uppercase tracking-wider">Pending</p>
                  <div className="w-7 h-7 rounded-lg bg-indigo/5 flex items-center justify-center text-indigo shadow-3xs shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-1">
                  <h3 className="text-3xl font-black text-ink leading-none"><AnimatedCounter value={stats.pending} /></h3>
                </div>
                <div className="space-y-1 mt-1">
                  <div className="flex items-center justify-between text-[9px] font-extrabold text-ink/40 uppercase tracking-wide">
                    <span>Review Backlog</span>
                    <span className="text-indigo">64%</span>
                  </div>
                  <div className="h-1.5 w-full bg-paper rounded-full overflow-hidden">
                    <div className="h-full bg-indigo rounded-full" style={{ width: '64%' }} />
                  </div>
                </div>
              </div>

              {/* Renewals Card */}
              <div className="kpi-card-glow kpi-card-glow--renewals bg-surface border border-line rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between h-[135px]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-ink/35 uppercase tracking-wider">Renewals Due</p>
                  <div className="w-7 h-7 rounded-lg bg-indigo/5 flex items-center justify-center text-indigo shadow-3xs shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-1">
                  <h3 className="text-3xl font-black text-ink leading-none"><AnimatedCounter value={stats.renewals} /></h3>
                </div>
                <div className="space-y-1 mt-1">
                  <div className="flex items-center justify-between text-[9px] font-extrabold text-ink/40 uppercase tracking-wide">
                    <span>Risk Ratio</span>
                    <span className="text-indigo">40%</span>
                  </div>
                  <div className="h-1.5 w-full bg-paper rounded-full overflow-hidden">
                    <div className="h-full bg-indigo rounded-full" style={{ width: '40%' }} />
                  </div>
                </div>
              </div>

              {/* Revenue Card */}
              <div className="kpi-card-glow kpi-card-glow--revenue bg-surface border border-line rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between h-[135px]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-ink/35 uppercase tracking-wider">Licensing Rev</p>
                  <div className="w-7 h-7 rounded-lg bg-indigo/5 flex items-center justify-center text-indigo font-bold text-xs shadow-3xs shrink-0">
                    Rs
                  </div>
                </div>
                <div className="mt-1">
                  <h3 className="text-3xl font-black text-ink leading-none">Rs. {(stats.revenue / 1000).toFixed(0)}k</h3>
                </div>
                <div className="space-y-1 mt-1">
                  <div className="flex items-center justify-between text-[9px] font-extrabold text-indigo uppercase tracking-wide">
                    <span>YTD Target</span>
                    <span>78%</span>
                  </div>
                  <div className="h-1.5 w-full bg-paper rounded-full overflow-hidden">
                    <div className="h-full bg-indigo rounded-full" style={{ width: '78%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Pipeline & Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Prosecution Pipeline */}
              <div className="lg:col-span-2 bg-surface border border-line rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Prosecution Pipeline</h3>
                  <p className="text-[11px] text-ink/45 mt-0.5">Volume by lifecycle stage across active disclosures & patents.</p>
                </div>
                
                <div className="space-y-4 pt-5 flex-1 flex flex-col justify-center">
                  {[
                    { label: 'Disclosure Received', value: disclosures.length || 24, max: 30, color: 'bg-indigo' },
                    { label: 'Under Review', value: disclosures.filter(d => d.status === 'under_review').length || 17, max: 30, color: 'bg-teal' },
                    { label: 'Drafting Application', value: patents.filter(p => p.status === 'drafting').length || 13, max: 30, color: 'bg-amber' },
                    { label: 'Filed Registry', value: patents.filter(p => p.status === 'filed').length || 19, max: 30, color: 'bg-indigo-dark' },
                    { label: 'Granted / Issued', value: patents.filter(p => p.status === 'granted').length || 8, max: 30, color: 'bg-teal' },
                  ].map((bar, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-ink">
                        <span>{bar.label}</span>
                        <span className="tabular text-indigo">{bar.value}</span>
                      </div>
                      <div className="h-2 w-full bg-paper rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${bar.color}`}
                          style={{ width: animateBars ? `${(bar.value / bar.max) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Heatmap Grid */}
              <div className="bg-surface border border-line rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Deadline Risk Heatmap</h3>
                  <p className="text-[11px] text-[#86868B] mt-0.5">Escalation density by urgency and compliance impact.</p>
                </div>
                
                <div className="grid grid-cols-4 gap-3 my-5">
                  <div className="heatmap-cell heatmap-cell--low shadow-3xs" title="Low risk level">Low</div>
                  <div className="heatmap-cell heatmap-cell--low shadow-3xs" title="Low risk level">Low</div>
                  <div className="heatmap-cell heatmap-cell--mod shadow-3xs" title="Moderate risk level">Mod</div>
                  <div className="heatmap-cell heatmap-cell--high shadow-3xs" title="High risk level">High</div>
                  <div className="heatmap-cell heatmap-cell--low shadow-3xs" title="Low risk level">Low</div>
                  <div className="heatmap-cell heatmap-cell--mod shadow-3xs" title="Moderate risk level">Mod</div>
                  <div className="heatmap-cell heatmap-cell--high shadow-3xs" title="High risk level">High</div>
                  <div className="heatmap-cell heatmap-cell--high shadow-3xs" title="High risk level">High</div>
                  <div className="heatmap-cell heatmap-cell--low shadow-3xs" title="Low risk level">Low</div>
                  <div className="heatmap-cell heatmap-cell--mod shadow-3xs" title="Moderate risk level">Mod</div>
                  <div className="heatmap-cell heatmap-cell--mod shadow-3xs" title="Moderate risk level">Mod</div>
                  <div className="heatmap-cell heatmap-cell--crit shadow-3xs" title="Critical action required">Crit</div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-ink/35 border-t border-line pt-3">
                  <span>Low Risk</span>
                  <span>Critical Risk</span>
                </div>
              </div>
            </div>

            {/* Activity & Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity Feed */}
              <div className="bg-surface border border-line rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Recent Activity</h3>
                  <button className="text-xs font-bold text-indigo hover:underline cursor-pointer">View All</button>
                </div>
                
                <div className="space-y-4">
                  {[
                    { text: "Disclosure DISC-1024 routed for internal review", tag: "Workflow", time: "09:20", color: "text-[#0071E3] bg-indigo/8" },
                    { text: "Document DOC-888 uploaded version 3", tag: "Document", time: "10:15", color: "text-[#34C759] bg-teal/8" },
                    { text: "Deadline escalation triggered for PAT-8841", tag: "Deadline", time: "11:40", color: "text-rust bg-rust/8" },
                    { text: "License LIC-233 milestone reminder sent", tag: "Commercialization", time: "12:25", color: "text-[#FF9500] bg-amber/8" }
                  ].map((act, i) => (
                    <div key={i} className="flex items-start justify-between gap-4 py-1.5 border-b border-line/30 last:border-0">
                      <div className="flex gap-3">
                        <div className="mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo animate-pulse-dot" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-ink/80 leading-relaxed">{act.text}</p>
                          <span className={`inline-block text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg mt-1.5 ${act.color}`}>
                            {act.tag}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-ink/35 font-semibold shrink-0 tabular">{act.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks List */}
              <div className="bg-surface border border-line rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">My Tasks</h3>
                  <span className="bg-indigo-light text-[#0071E3] text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full">4 Open</span>
                </div>

                <div className="space-y-3">
                  {[
                    { title: "Respond to office action for PAT-8841", details: "Aisha Bennett", due: "Due Today", sev: "Critical", style: "bg-rust/8 text-rust", route: "/patents" },
                    { title: "Review revised inventor declarations", details: "You", due: "Due Tomorrow", sev: "Medium", style: "bg-amber/8 text-[#FF9500]", route: "/disclosures" },
                    { title: "Approve license milestone invoice", details: "You", due: "Due in 2 days", sev: "High", style: "bg-rust/8 text-rust", route: "/licenses" },
                    { title: "Update saved report for quarterly board review", details: "Rohan Gupta", due: "Due in 4 days", sev: "Low", style: "bg-paper text-ink/50", route: "/reports" }
                  ].map((task, i) => (
                    <div
                      key={i}
                      onClick={() => navigate(task.route)}
                      className="flex items-center justify-between gap-4 p-3 border border-line rounded-xl hover:border-indigo hover:bg-indigo/[0.015] transition-all duration-150 cursor-pointer active:scale-[0.99]"
                    >
                      <div>
                        <h4 className="text-xs font-extrabold text-ink transition-colors">{task.title}</h4>
                        <p className="text-[10px] text-ink/40 font-semibold mt-0.5">{task.details} · {task.due}</p>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${task.style}`}>
                        {task.sev}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Stat Cards (Faculty / User) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-8 stagger-children">
              {/* My Disclosures Card */}
              <div className="kpi-card-glow kpi-card-glow--filed bg-surface border border-line rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between h-[135px]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-ink/35 uppercase tracking-wider">My Disclosures</p>
                  <div className="w-7 h-7 rounded-lg bg-indigo/5 flex items-center justify-center text-indigo shadow-3xs shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-1">
                  <h3 className="text-3xl font-black text-ink leading-none"><AnimatedCounter value={myDisclosures.length} /></h3>
                </div>
                <div className="space-y-1 mt-1">
                  <div className="flex items-center justify-between text-[9px] font-extrabold text-ink/40 uppercase tracking-wide">
                    <span>Status</span>
                    <span className="text-indigo">Submitted</span>
                  </div>
                  <div className="h-1.5 w-full bg-paper rounded-full overflow-hidden">
                    <div className="h-full bg-indigo rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>

              {/* My Patents Card */}
              <div className="kpi-card-glow kpi-card-glow--granted bg-surface border border-line rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between h-[135px]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-ink/35 uppercase tracking-wider">My Patents</p>
                  <div className="w-7 h-7 rounded-lg bg-indigo/5 flex items-center justify-center text-indigo shadow-3xs shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <div className="mt-1">
                  <h3 className="text-3xl font-black text-ink leading-none"><AnimatedCounter value={1} /></h3>
                </div>
                <div className="space-y-1 mt-1">
                  <div className="flex items-center justify-between text-[9px] font-extrabold text-indigo uppercase tracking-wide">
                    <span>PAT-8790</span>
                    <span>Active</span>
                  </div>
                  <div className="h-1.5 w-full bg-paper rounded-full overflow-hidden">
                    <div className="h-full bg-indigo rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>

              {/* My Projects Card */}
              <div className="kpi-card-glow kpi-card-glow--pending bg-surface border border-line rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between h-[135px]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-ink/35 uppercase tracking-wider">My Projects</p>
                  <div className="w-7 h-7 rounded-lg bg-indigo/5 flex items-center justify-center text-indigo shadow-3xs shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4.674 12.03a3 3 0 11-4.043-4.043L15.674 18.03z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-1">
                  <h3 className="text-3xl font-black text-ink leading-none"><AnimatedCounter value={myProjects.length} /></h3>
                </div>
                <div className="space-y-1 mt-1">
                  <div className="flex items-center justify-between text-[9px] font-extrabold text-ink/40 uppercase tracking-wide">
                    <span>Industry Funded</span>
                    <span className="text-indigo">0 Active</span>
                  </div>
                  <div className="h-1.5 w-full bg-paper rounded-full overflow-hidden">
                    <div className="h-full bg-indigo rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
              </div>

              {/* My Action Items Card */}
              <div className="kpi-card-glow kpi-card-glow--renewals bg-surface border border-line rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between h-[135px]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-ink/35 uppercase tracking-wider">Action Items</p>
                  <div className="w-7 h-7 rounded-lg bg-indigo/5 flex items-center justify-center text-indigo shadow-3xs shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-1">
                  <h3 className="text-3xl font-black text-ink leading-none"><AnimatedCounter value={myDeadlines.length} /></h3>
                </div>
                <div className="space-y-1 mt-1">
                  <div className="flex items-center justify-between text-[9px] font-extrabold text-indigo uppercase tracking-wide">
                    <span>Compliance</span>
                    <span>Action Required</span>
                  </div>
                  <div className="h-1.5 w-full bg-paper rounded-full overflow-hidden">
                    <div className="h-full bg-indigo rounded-full" style={{ width: '50%' }} />
                  </div>
                </div>
              </div>

              {/* My YTD Royalties Card */}
              <div className="kpi-card-glow kpi-card-glow--revenue bg-surface border border-line rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between h-[135px]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-ink/35 uppercase tracking-wider">Royalty Share</p>
                  <div className="w-7 h-7 rounded-lg bg-indigo/5 flex items-center justify-center text-indigo font-bold text-xs shadow-3xs shrink-0">
                    Rs
                  </div>
                </div>
                <div className="mt-1">
                  <h3 className="text-3xl font-black text-ink truncate leading-none">Rs. {(myProjects.length * 17500).toLocaleString()}</h3>
                </div>
                <div className="space-y-1 mt-1">
                  <div className="flex items-center justify-between text-[9px] font-extrabold text-indigo uppercase tracking-wide">
                    <span>YTD Earnings</span>
                    <span>Rs. 0</span>
                  </div>
                  <div className="h-1.5 w-full bg-paper rounded-full overflow-hidden">
                    <div className="h-full bg-indigo rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Inventions & Collaborations Portfolio */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* My Inventions list */}
              <div className="lg:col-span-2 bg-surface border border-line rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xs font-bold text-ink uppercase tracking-wider">My Invention Disclosures</h3>
                      <p className="text-[11px] text-ink/45 mt-0.5">Active patent drafts and invention declarations submitted to TTC.</p>
                    </div>
                    <button onClick={() => navigate('/disclosures')} className="text-xs font-bold text-indigo hover:underline cursor-pointer">
                      View All
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {myDisclosures.length === 0 ? (
                      <div className="py-8 text-center text-xs text-ink/40 font-medium">No disclosures submitted yet.</div>
                    ) : (
                      myDisclosures.map((d, i) => (
                        <div key={i} className="flex items-center justify-between gap-4 p-3 border border-line rounded-xl hover:border-indigo hover:bg-indigo/[0.015] transition-all duration-150 cursor-pointer active:scale-[0.99]" onClick={() => navigate('/disclosures')}>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-extrabold text-ink truncate">{d.title}</h4>
                            <p className="text-[10px] text-ink/40 mt-1 font-semibold">Dept: {d.department} · Reviewer: {d.reviewer || 'TTC Staff'}</p>
                          </div>
                          <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg text-center shrink-0 ${
                            d.status === 'under_review' ? 'bg-indigo/5 text-[#0071E3] border border-[#0071E3]/10' :
                            d.status === 'needs_revision' ? 'bg-amber/5 text-[#FF9500] border border-[#FF9500]/10' :
                            d.status === 'ready_for_filing' ? 'bg-teal/5 text-[#34C759] border border-[#34C759]/10' : 'bg-paper text-ink/45 border border-line'
                          }`}>
                            {d.status?.replace('_', ' ')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Research Resources Panel */}
              <div className="bg-surface border border-line rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Research Resources</h3>
                  <p className="text-[11px] text-[#86868B] mt-0.5">Reference guides and documents for university inventors.</p>
                </div>

                <div className="space-y-2.5 my-5">
                  {[
                    { title: "University of Ruhuna IP Policy", type: "PDF", desc: "1.4 MB File", color: "bg-rust/5 text-rust border-rust/10" },
                    { title: "TTC Disclosure Template", type: "DOC", desc: "245 KB Document", color: "bg-teal/5 text-teal border-teal/10" },
                    { title: "PCT Patent Filing Flowchart", type: "URL", desc: "External Link", color: "bg-indigo/5 text-indigo border-indigo/10" },
                    { title: "TTC Staff Support Directory", type: "TEL", desc: "Phone List", color: "bg-amber/5 text-amber border-amber/10" }
                  ].map((res, idx) => (
                    <a key={idx} href="#" className="flex items-center justify-between p-2 rounded-xl hover:bg-paper/80 border border-transparent hover:border-line transition-all duration-150 group">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-lg ${res.color} border flex items-center justify-center text-[9px] font-black tracking-wide shrink-0`}>
                          {res.type}
                        </span>
                        <div>
                          <p className="text-xs text-ink/80 group-hover:text-indigo transition-colors font-bold leading-tight">{res.title}</p>
                          <p className="text-[9px] text-ink/35 font-medium mt-0.5">{res.desc}</p>
                        </div>
                      </div>
                      <span className="text-ink/30 group-hover:text-indigo group-hover:translate-x-0.5 transition-all text-xs pr-1 font-bold">→</span>
                    </a>
                  ))}
                </div>
                
                <div className="text-[9px] text-[#86868B] border-t border-[#E5E5E7]/55 pt-3 leading-relaxed font-semibold">
                  Need help drafting claims? Contact the Technology Transfer Cell support desk.
                </div>
              </div>
            </div>

            {/* My Projects & My Action Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* My Industry Research Projects */}
              <div className="bg-surface border border-line rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-ink uppercase tracking-wider">My Industry Collaborations</h3>
                    <button onClick={() => navigate('/projects')} className="text-xs font-bold text-indigo hover:underline cursor-pointer">
                      View All
                    </button>
                  </div>

                  <div className="space-y-3">
                    {myProjects.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-full bg-paper flex items-center justify-center text-ink/30 mb-3 border border-line">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 00-2 2H6a2 2 0 00-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5" />
                          </svg>
                        </div>
                        <p className="text-xs font-semibold text-ink/50">No Active Collaborations</p>
                        <p className="text-[11px] text-ink/35 max-w-[220px] mt-1 leading-normal">Your active industry research and sponsored projects will appear here.</p>
                      </div>
                    ) : (
                      myProjects.map((p, i) => (
                        <div key={i} className="flex items-center justify-between gap-4 p-3 border border-line rounded-xl hover:bg-paper/20 transition-all duration-150 animate-fade-in">
                          <div>
                            <h4 className="text-xs font-extrabold text-ink hover:text-indigo cursor-pointer transition-colors" onClick={() => navigate(`/projects/${p.id}`)}>{p.title}</h4>
                            <p className="text-[10px] text-ink/40 mt-1 font-semibold font-medium">Partner: {p.industry_partner_name} · Budget: Rs. {p.budget?.toLocaleString()}</p>
                          </div>
                          <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                            p.status === 'ongoing' ? 'bg-teal/5 text-[#34C759] border border-[#34C759]/10' :
                            p.status === 'proposed' ? 'bg-indigo/5 text-[#0071E3] border border-[#0071E3]/10' : 'bg-paper text-ink/40 border border-line'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* My Action Items */}
              <div className="bg-surface border border-line rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">My Urgent Actions</h3>
                  <span className="bg-indigo-light text-[#0071E3] text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                    {myDeadlines.length} Open
                  </span>
                </div>

                <div className="space-y-3">
                  {myDeadlines.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-paper flex items-center justify-center text-ink/30 mb-3 border border-line">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-xs font-semibold text-ink/50">No Pending Actions</p>
                      <p className="text-[11px] text-ink/35 max-w-[200px] mt-1 leading-normal">You currently have no urgent action steps or deadline compliance items.</p>
                    </div>
                  ) : (
                    myDeadlines.map((dl, i) => (
                      <div
                        key={i}
                        onClick={() => navigate('/deadlines')}
                        className="flex items-center justify-between gap-4 p-3 border border-line rounded-xl hover:border-indigo hover:bg-indigo/[0.015] transition-all duration-150 cursor-pointer active:scale-[0.99]"
                      >
                        <div>
                          <h4 className="text-xs font-extrabold text-ink transition-colors">{dl.title}</h4>
                          <p className="text-[10px] text-ink/40 font-semibold mt-0.5 font-medium">Assigned to: You · Due: {dl.due_date}</p>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                          dl.severity === 'critical' || dl.severity === 'high' ? 'bg-rust/8 text-rust border border-[#FF3B30]/10' : 'bg-paper text-ink/50 border border-line'
                        }`}>
                          {dl.severity}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )
      )}
    </>
  )
}
