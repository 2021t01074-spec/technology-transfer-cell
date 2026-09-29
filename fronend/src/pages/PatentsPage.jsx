import { useEffect, useState } from 'react'
import { listPatents, getPatent, updatePatentStatus, getPatentTimeline, addPatentTimelineEvent, createPatent } from '../api/patents'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import StatusDot from '../components/ui/StatusDot'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import PatentApplicationWizard from './patents/PatentApplicationWizard'

export default function PatentsPage() {
  const { addToast } = useToast()
  
  // Navigation State
  const [viewMode, setViewMode] = useState('dashboard') // 'dashboard' | 'wizard'
  const [activeDashboardTab, setActiveDashboardTab] = useState('my_applications') // 'my_applications' | 'drafts' | 'submitted' | 'tracking' | 'messages' | 'payments' | 'documents'

  const [patents, setPatents] = useState([])
  const [selectedPatent, setSelectedPatent] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [wizardDraft, setWizardDraft] = useState(null)

  // Timeline form
  const [showTimelineForm, setShowTimelineForm] = useState(false)
  const [newEvent, setNewEvent] = useState({ event_title: '', event_date: '', notes: '' })

  // Document upload modal state
  const [showDocUploadModal, setShowDocUploadModal] = useState(false)
  const [newDocName, setNewDocName] = useState('')

  async function loadPatents() {
    try {
      const data = await listPatents()
      setPatents(data)
      if (data.length > 0 && !selectedPatent) {
        setSelectedPatent(data[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatents()
  }, [])

  useEffect(() => {
    if (selectedPatent) {
      setTimelineLoading(true)
      getPatentTimeline(selectedPatent.id)
        .then(setTimeline)
        .catch(console.error)
        .finally(() => setTimelineLoading(false))
    }
  }, [selectedPatent])

  async function handleStatusChange(newStatus) {
    if (!selectedPatent) return
    setStatusUpdating(true)
    try {
      const updated = await updatePatentStatus(selectedPatent.id, newStatus)
      setSelectedPatent(updated)
      addToast('Status updated.', 'success')
      loadPatents()
    } catch (err) {
      addToast('Failed to update status.', 'error')
    } finally {
      setStatusUpdating(false)
    }
  }

  async function handleTimelineEventSubmit(e) {
    e.preventDefault()
    if (!selectedPatent) return
    try {
      const added = await addPatentTimelineEvent(selectedPatent.id, newEvent)
      setTimeline([...timeline, added])
      setNewEvent({ event_title: '', event_date: '', notes: '' })
      setShowTimelineForm(false)
      addToast('Timeline event logged.', 'success')
    } catch (err) {
      addToast('Failed to add event.', 'error')
    }
  }

  const resumeDraft = (draft) => {
    setWizardDraft(draft)
    setViewMode('wizard')
  }

  // Filter datasets
  const draftPatents = patents.filter(p => p.is_draft || p.status === 'drafting')
  const submittedPatents = patents.filter(p => !p.is_draft && p.status !== 'drafting')

  // Table Columns
  const columns = [
    {
      key: 'patent_number',
      label: 'Application Case #',
      render: (r) => (
        <div>
          <span className="font-bold text-indigo cursor-pointer hover:underline" onClick={() => setSelectedPatent(r)}>
            {r.patent_number}
          </span>
          <span className="block text-[10px] text-ink/50 font-normal">{r.patent_type || 'Utility Patent'}</span>
        </div>
      )
    },
    {
      key: 'title',
      label: 'Title',
      render: (r) => <span className="font-semibold text-ink line-clamp-1">{r.title}</span>
    },
    { key: 'applicant_name', label: 'Applicant / Assignee', render: (r) => r.applicant_name || r.assignee || 'University of Ruhuna' },
    { key: 'filing_date', label: 'Filing Date', render: (r) => r.filing_date || '—' },
    { key: 'status', label: 'Application Status', render: (r) => <StatusDot status={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => { setSelectedPatent(r); setActiveDashboardTab('tracking'); }}
            className="py-1 px-2.5 text-xs text-indigo"
          >
            Track Status
          </Button>
          {(r.status === 'drafting' || r.is_draft) && (
            <Button
              variant="outline"
              onClick={() => resumeDraft(r)}
              className="py-1 px-2.5 text-xs"
            >
              Resume Draft
            </Button>
          )}
        </div>
      )
    }
  ]

  // If in wizard mode, render PatentApplicationWizard
  if (viewMode === 'wizard') {
    return (
      <PatentApplicationWizard
        initialData={wizardDraft}
        onComplete={() => {
          setViewMode('dashboard')
          setWizardDraft(null)
          loadPatents()
        }}
        onCancel={() => {
          setViewMode('dashboard')
          setWizardDraft(null)
        }}
      />
    )
  }

  return (
    <>
      <PageHeader
        title="Patent Filing & Application Management Portal"
        description="Comprehensive portal for filing new invention patents, tracking prosecution status, managing draft filings, and accessing payment receipts & documents."
        icon={
          <svg className="w-5 h-5 text-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        }
        action={
          <Button onClick={() => { setWizardDraft(null); setViewMode('wizard'); }} className="shadow-lg bg-indigo text-white font-bold">
            + Start Patent Application
          </Button>
        }
      />

      {/* Dashboard Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-line mb-6 overflow-x-auto pb-1 text-xs font-semibold">
        {[
          { id: 'my_applications', label: 'My Applications', count: patents.length },
          { id: 'drafts', label: 'Draft Applications', count: draftPatents.length },
          { id: 'submitted', label: 'Submitted Applications', count: submittedPatents.length },
          { id: 'tracking', label: 'Application Status & Tracking' },
          { id: 'messages', label: 'Messages & Notifications', badge: '2 New' },
          { id: 'payments', label: 'Payments & Receipts' },
          { id: 'documents', label: 'Download Documents' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveDashboardTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              activeDashboardTab === tab.id
                ? 'bg-indigo text-white font-bold shadow-xs'
                : 'text-ink/60 hover:text-ink hover:bg-paper'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeDashboardTab === tab.id ? 'bg-white/20 text-white' : 'bg-paper text-ink/70'
              }`}>
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: MY APPLICATIONS */}
      {activeDashboardTab === 'my_applications' && (
        <div className="space-y-6">
          <DataTable
            columns={columns}
            data={patents}
            loading={loading}
            searchable
            searchKeys={['title', 'patent_number', 'applicant_name', 'status']}
          />
        </div>
      )}

      {/* TAB CONTENT: DRAFT APPLICATIONS */}
      {activeDashboardTab === 'drafts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-amber-50 border border-amber-200 p-4 rounded-2xl">
            <div>
              <h3 className="font-bold text-amber-900 text-sm">Saved In-Progress Draft Applications</h3>
              <p className="text-xs text-amber-700 mt-0.5">Resume saved patent specifications anytime without losing entered details.</p>
            </div>
            <Button onClick={() => { setWizardDraft(null); setViewMode('wizard'); }} className="text-xs">
              + New Application
            </Button>
          </div>

          {draftPatents.length === 0 ? (
            <div className="p-8 text-center bg-paper rounded-2xl border border-line">
              <p className="text-xs text-ink/50">No saved draft applications found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {draftPatents.map((draft) => (
                <div key={draft.id} className="p-5 rounded-2xl border border-line bg-surface shadow-xs hover:border-indigo transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                      Incomplete Draft
                    </span>
                    <span className="text-xs text-ink/50">Last saved: {draft.filing_date || 'Today'}</span>
                  </div>
                  <h3 className="font-bold text-ink text-sm mb-1">{draft.title || 'Untitled Draft Invention'}</h3>
                  <p className="text-xs text-ink/60 line-clamp-2 mb-4">{draft.short_description || draft.claims_text || 'No description entered yet...'}</p>
                  <Button onClick={() => resumeDraft(draft)} className="w-full text-xs py-2">
                    Resume Filing Application →
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SUBMITTED APPLICATIONS */}
      {activeDashboardTab === 'submitted' && (
        <div className="space-y-6">
          <DataTable
            columns={columns}
            data={submittedPatents}
            loading={loading}
            searchable
            searchKeys={['title', 'patent_number', 'status']}
          />
        </div>
      )}

      {/* TAB CONTENT: APPLICATION STATUS & TRACKING */}
      {activeDashboardTab === 'tracking' && (
        <div className="space-y-6 animate-fade-in">
          {selectedPatent ? (
            <div className="bg-surface border border-line rounded-2xl p-6 shadow-xs">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-line pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase bg-indigo/10 text-indigo px-3 py-1 rounded-full">
                      {selectedPatent.patent_number}
                    </span>
                    <span className="text-xs font-semibold text-ink/60">
                      {selectedPatent.patent_type || 'Utility Patent'}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-ink mt-2">{selectedPatent.title}</h2>
                  <p className="text-xs text-ink/50 mt-0.5">
                    Applicant: {selectedPatent.applicant_name || selectedPatent.assignee} • Filing Date: {selectedPatent.filing_date || '2026-07-22'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={selectedPatent.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={statusUpdating}
                    className="py-1 px-3 text-xs"
                  >
                    <option value="drafting">Drafting</option>
                    <option value="under_review">Under Formality Review</option>
                    <option value="office_action">Office Action Issued</option>
                    <option value="filed">Formally Filed</option>
                    <option value="granted">Patent Granted</option>
                  </Select>
                  <Button variant="ghost" onClick={() => setShowTimelineForm(true)} className="py-1.5 px-3 text-xs">
                    + Log Event
                  </Button>
                </div>
              </div>

              {/* Status Progression Pipeline */}
              <div className="mb-8">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-4">Official Patent Examination Progress</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center">
                  {[
                    { stage: '1. Submitted', key: 'under_review', desc: 'Formality check' },
                    { stage: '2. Formality Review', key: 'under_review', desc: 'Document verification' },
                    { stage: '3. Technical Search', key: 'filed', desc: 'Prior art examination' },
                    { stage: '4. Office Action', key: 'office_action', desc: 'Legal response pending' },
                    { stage: '5. Final Grant', key: 'granted', desc: 'Certificate issued' }
                  ].map((st, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        selectedPatent.status === st.key
                          ? 'border-indigo bg-indigo/10 font-bold shadow-xs'
                          : 'border-line bg-paper text-ink/50'
                      }`}
                    >
                      <div className="font-bold text-ink">{st.stage}</div>
                      <div className="text-[10px] text-ink/60 mt-0.5">{st.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline Log */}
              <div>
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Prosecution Log & Registry History</h3>
                {timelineLoading ? (
                  <p className="text-xs text-ink/50">Loading timeline history...</p>
                ) : timeline.length === 0 ? (
                  <div className="p-4 rounded-xl bg-paper border border-line text-xs text-ink/50">
                    No timeline events logged yet. Click "+ Log Event" to add a formal office notice or action.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {timeline.map((ev, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-line bg-paper flex items-start gap-3 text-xs">
                        <span className="w-2 h-2 rounded-full bg-indigo mt-1.5 shrink-0"></span>
                        <div>
                          <span className="font-bold text-ink">{ev.event_title}</span>
                          <span className="text-[10px] text-ink/50 ml-2">({ev.event_date})</span>
                          {ev.notes && <p className="text-ink/70 mt-1">{ev.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <p className="text-xs text-ink/50">Select an application from "My Applications" tab to track status.</p>
          )}
        </div>
      )}

      {/* TAB CONTENT: MESSAGES & NOTIFICATIONS */}
      {activeDashboardTab === 'messages' && (
        <div className="space-y-4">
          <div className="bg-surface border border-line rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-sm text-ink border-b border-line pb-2">Official Patent Office Communications</h3>
            
            <div className="p-4 rounded-xl bg-indigo/5 border border-indigo/20 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-indigo">Formality Examination Completed</span>
                <span className="text-[10px] text-ink/50">Yesterday 14:30</span>
              </div>
              <p className="text-xs text-ink/70">
                Your application specification and drawings for case PAT-2026-8942 passed formality verification. Proceeded to technical search.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-paper border border-line space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-ink">Filing Fee Payment Receipt Confirmed</span>
                <span className="text-[10px] text-ink/50">2026-07-20</span>
              </div>
              <p className="text-xs text-ink/70">
                Payment receipt #PAY-9921 for USD $225.00 has been verified and posted to registry records.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PAYMENTS & RECEIPTS */}
      {activeDashboardTab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-surface border border-line rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-ink border-b border-line pb-2">Application Fee Payment History</h3>
            
            <div className="p-4 rounded-xl bg-paper border border-line flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-ink block">Filing Fee - Utility Patent Application</span>
                <span className="text-[10px] text-ink/50">Invoice #INV-2026-881 • Paid via Credit Card</span>
              </div>
              <div className="text-right">
                <span className="font-black text-emerald-600 block text-sm">$225.00 USD</span>
                <button onClick={() => addToast('Downloading Fee Receipt PDF...', 'info')} className="text-[11px] text-indigo font-bold hover:underline">
                  📥 Download Receipt PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DOWNLOAD SUBMITTED DOCUMENTS */}
      {activeDashboardTab === 'documents' && (
        <div className="space-y-4">
          <div className="bg-surface border border-line rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-ink border-b border-line pb-2">Central Application Documents Vault</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { name: 'Technical_Drawings_Complete_v1.pdf', size: '3.2 MB', date: '2026-07-22' },
                { name: 'Patent_Claims_Specification.pdf', size: '1.8 MB', date: '2026-07-22' },
                { name: 'Inventor_Declaration_Form_Signed.pdf', size: '740 KB', date: '2026-07-22' },
                { name: 'Prior_Art_Comparison_Matrix.docx', size: '1.1 MB', date: '2026-07-21' }
              ].map((doc, i) => (
                <div key={i} className="p-4 rounded-xl border border-line bg-paper flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📄</span>
                    <div>
                      <p className="font-bold text-ink">{doc.name}</p>
                      <p className="text-[10px] text-ink/50">{doc.size} • Uploaded {doc.date}</p>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => addToast(`Downloading ${doc.name}...`, 'info')} className="text-xs py-1 px-3">
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Timeline Modal */}
      <Modal isOpen={showTimelineForm} onClose={() => setShowTimelineForm(false)} title="Log Patent Prosecution Event">
        <form onSubmit={handleTimelineEventSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1">Event Title *</label>
            <Input
              value={newEvent.event_title}
              onChange={(e) => setNewEvent({ ...newEvent, event_title: e.target.value })}
              placeholder="e.g. Non-Final Office Action Received"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1">Event Date *</label>
            <Input
              type="date"
              value={newEvent.event_date}
              onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1">Notes / Description</label>
            <textarea
              value={newEvent.notes}
              onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
              className="w-full rounded-xl border border-line bg-surface p-3 text-xs text-ink focus:border-indigo focus:outline-none"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowTimelineForm(false)}>Cancel</Button>
            <Button type="submit">Log Event</Button>
          </div>
        </form>
      </Modal>

    </>
  )
}
