import { useEffect, useState } from 'react'
import { listDeadlines, updateDeadlineStatus, createDeadline } from '../api/deadlines'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { useToast } from '../components/ui/Toast'

export default function DeadlinesPage() {
  const { addToast } = useToast()
  const [deadlines, setDeadlines] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Interactive Escalation Configuration state
  const [leadTimeConfig, setLeadTimeConfig] = useState("30 / 14 / 7 / 1 days")
  const [escalationPath, setEscalationPath] = useState("Assignee → Reviewer → Admin")
  const [savingConfig, setSavingConfig] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)

  // Creation forms
  const [form, setForm] = useState({
    record_id: '',
    title: '',
    due_date: '',
    severity: 'medium',
    assigned_to: '',
  })

  async function loadDeadlines() {
    try {
      const data = await listDeadlines()
      setDeadlines(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeadlines()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createDeadline(form)
      addToast('Deadline logged successfully.', 'success')
      setOpen(false)
      setForm({ record_id: '', title: '', due_date: '', severity: 'medium', assigned_to: '' })
      loadDeadlines()
    } catch (err) {
      addToast('Failed to create deadline.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResolve(id) {
    try {
      await updateDeadlineStatus(id, 'completed')
      addToast('Deadline resolved successfully.', 'success')
      loadDeadlines()
    } catch (err) {
      addToast('Failed to resolve deadline.', 'error')
    }
  }

  const handleSaveEscalationConfig = (e) => {
    e.preventDefault()
    setSavingConfig(true)
    setTimeout(() => {
      setSavingConfig(false)
      setShowConfigModal(false)
      addToast('Escalation logic configuration updated.', 'success')
    }, 800)
  }

  const SEVERITY_COLORS = {
    critical: 'bg-rust-light text-rust border-rust/10',
    high: 'bg-rust-light text-rust border-rust/10',
    moderate: 'bg-amber-light text-amber border-amber/10',
    low: 'bg-teal-light text-teal border-teal/10',
  }

  return (
    <>
      <PageHeader
        title="Deadlines & Renewals"
        description="Track upcoming office actions, renewals, escalations, and jurisdiction-sensitive due dates with operational risk visibility."
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowConfigModal(true)}>
              Configure Escalation
            </Button>
            <Button onClick={() => setOpen(true)}>
              + Add Alert
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 stagger-children">
        {/* Calendar Risk List */}
        <div className="bg-surface border border-line rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-4">Calendar Risk List</h3>
            <div className="space-y-3">
              {loading ? (
                <p className="text-xs text-ink/40">Loading risk list...</p>
              ) : deadlines.length === 0 ? (
                <p className="text-xs text-ink/40 italic">No pending deadlines logged.</p>
              ) : (
                deadlines.map((dl, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 border border-line rounded-xl hover:border-ink/20 transition-colors">
                    <div>
                      <span className="text-[9px] font-extrabold text-ink/30 uppercase">{dl.record_id}</span>
                      <h4 className="text-xs font-bold text-ink/80 mt-0.5">{dl.title}</h4>
                      <p className="text-[10px] text-ink/40 font-medium mt-1">Due {dl.due_date}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${SEVERITY_COLORS[dl.severity]}`}>
                        {dl.severity}
                      </span>
                      {dl.status === 'pending' ? (
                        <button
                          onClick={() => handleResolve(dl.id)}
                          className="text-[10px] text-indigo font-bold hover:underline cursor-pointer"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-[10px] text-teal font-semibold">Resolved</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Escalation Logic Center Column */}
        <div className="bg-surface border border-line rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">Escalation Logic</h3>
            <p className="text-[11px] text-ink/45 leading-relaxed">
              Auto reminders notify assignees first, then reviewers, then admins when a due date becomes overdue or enters a critical risk band.
            </p>
          </div>

          <div className="my-6 border border-line/65 rounded-xl p-4 bg-paper/50 flex flex-col justify-center items-center text-center">
            <svg className="w-12 h-12 text-indigo mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h4 className="text-xs font-bold text-ink">Jurisdiction-safe deadline normalization</h4>
            <p className="text-[10px] text-ink/40 mt-1 max-w-[200px]">Lead times automatic escalation configuration.</p>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between border-b border-line/30 pb-2">
              <span className="text-ink/40 text-[10px] font-bold uppercase">Reminder Lead Time</span>
              <span className="font-bold text-ink/80 tabular">{leadTimeConfig}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/40 text-[10px] font-bold uppercase">Escalation Path</span>
              <span className="font-bold text-ink/80 text-[11px]">{escalationPath}</span>
            </div>
          </div>
        </div>

        {/* Context-aware Right Tools Panel */}
        <div className="bg-surface border border-line rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">Deadline Control</h3>
            <p className="text-[11px] text-ink/45">Context-aware tools for the active module.</p>
          </div>

          <div className="space-y-4 my-6">
            <div className="bg-paper rounded-xl p-3 border border-line/60">
              <span className="text-[9px] font-bold uppercase tracking-wider text-ink/35">Saved View</span>
              <p className="text-xs font-bold text-ink mt-0.5">Board pack · Last 90 days</p>
            </div>
            <div className="bg-paper rounded-xl p-3 border border-line/60">
              <span className="text-[9px] font-bold uppercase tracking-wider text-ink/35">Grouping</span>
              <p className="text-xs font-bold text-ink mt-0.5">By department and status</p>
            </div>
            <div className="bg-paper rounded-xl p-3 border border-line/60">
              <span className="text-[9px] font-bold uppercase tracking-wider text-ink/35">Jurisdiction</span>
              <p className="text-xs font-bold text-ink mt-0.5">US, EP, IN</p>
            </div>
          </div>

          <div className="text-[10px] text-ink/40 font-bold uppercase flex items-center gap-1.5 border-t border-line pt-3">
            <svg className="w-3.5 h-3.5 text-indigo shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Audited SLA compliance
          </div>
        </div>
      </div>

      {/* Add Alert Modal */}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="New Statutory Patent Deadline Reminder">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Record Reference (ID)"
            placeholder="e.g. PAT-8841"
            value={form.record_id}
            onChange={(e) => setForm({ ...form, record_id: e.target.value })}
            required
          />
          <Input
            label="Reminder Title"
            placeholder="e.g. Office action response"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Input
            label="Filing Due Date"
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            required
          />
          <Select
            label="Severity"
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
            required
          >
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
          <Input
            label="Assigned Lead"
            placeholder="e.g. Aisha Bennett"
            value={form.assigned_to}
            onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
            required
          />
          <Button type="submit" className="w-full" loading={submitting}>Log Reminder</Button>
        </form>
      </Modal>

      {/* Configure Escalation Modal */}
      <Modal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} title="Configure Statutory Patent Escalation Reminders">
        <form onSubmit={handleSaveEscalationConfig} className="space-y-4">
          <Input
            label="Lead Times configuration"
            placeholder="e.g. 30 / 14 / 7 / 1 days"
            value={leadTimeConfig}
            onChange={(e) => setLeadTimeConfig(e.target.value)}
            required
          />
          <Input
            label="Escalation Path Flow"
            placeholder="e.g. Assignee → Reviewer → Admin"
            value={escalationPath}
            onChange={(e) => setEscalationPath(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" loading={savingConfig}>Save Configuration</Button>
        </form>
      </Modal>
    </>
  )
}
