import { useEffect, useState } from 'react'
import { listDisclosures, createDisclosure, updateDisclosureStatus } from '../api/disclosures'
import { createPatent } from '../api/patents'
import { useAuth } from '../auth/AuthContext'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import StatusDot from '../components/ui/StatusDot'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'

const columns = [
  { key: 'title', label: 'Disclosure Title' },
  { key: 'primary_inventor', label: 'Primary Inventor' },
  { key: 'department', label: 'Department' },
  { key: 'status', label: 'Status', render: (r) => <StatusDot status={r.status} /> },
  { key: 'due_date', label: 'Due Date', render: (r) => r.due_date || '—' },
]

export default function DisclosuresPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [disclosures, setDisclosures] = useState([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    title: '',
    department: 'Computer Engineering',
    primary_inventor: '',
    reviewer: '',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [selectedDisclosure, setSelectedDisclosure] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const isStaffOrAdmin = user && ['super_admin', 'ttc_staff'].includes(user.role)

  async function loadDisclosures() {
    try {
      const data = await listDisclosures()
      setDisclosures(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDisclosures()
  }, [])

  const handleNextStep = () => {
    if (step < 3) setStep(step + 1)
  }

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  async function handleFormSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createDisclosure({
        ...form,
        status: 'under_review',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
      addToast('Invention disclosure created successfully!', 'success')
      setStep(1)
      setForm({ title: '', department: 'Computer Engineering', primary_inventor: '', reviewer: '', description: '' })
      loadDisclosures()
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to submit disclosure.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStatusUpdate(status) {
    if (!selectedDisclosure) return
    setActionLoading(true)
    try {
      if (status === 'approved') {
        // Promote to Patent Case
        const caseNo = `PAT-${Math.floor(Math.random() * 9000 + 1000)}`
        await createPatent({
          title: selectedDisclosure.title,
          patent_number: caseNo,
          jurisdiction: 'US / PCT',
          assignee: 'Technology Transfer Cell',
          attorney: user?.full_name || 'Aisha Bennett',
          status: 'drafting',
          budget: 30000,
          claims_text: selectedDisclosure.description || 'Scheduler fairness limits and verification parameters.',
          legal_notes: `Promoted from invention disclosure. Initial review completed by ${user?.full_name}.`
        })
        await updateDisclosureStatus(selectedDisclosure.id, 'ready_for_filing')
        addToast(`Disclosure promoted. Drafting case ${caseNo} generated!`, 'success')
      } else {
        await updateDisclosureStatus(selectedDisclosure.id, status)
        addToast(`Status updated to ${status}.`, 'info')
      }
      setSelectedDisclosure(null)
      loadDisclosures()
    } catch (err) {
      addToast('Failed to update disclosure action.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Patent Disclosures & Inventions"
        description="Official patent disclosure portal: capture new patent invention filings, route through university IP review, and promote approved applications to active patent prosecution cases."
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Step-by-Step Intake Form */}
        <div className="lg:col-span-2 bg-surface border border-line rounded-2xl p-6 shadow-xs relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Submit Patent Disclosure</h3>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-light text-indigo px-2.5 py-0.5 rounded-full">
              Step {step} of 3
            </span>
          </div>

          <div className="h-1 w-full bg-paper rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-indigo transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <Input
                  label="Applicant Full Name *"
                  placeholder="e.g. Dr. Nimal Perera"
                  value={form.primary_inventor}
                  onChange={(e) => setForm({ ...form, primary_inventor: e.target.value })}
                  required
                />
                <Select
                  label="Department *"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  <option value="Civil and Environmental Engineering">Civil and Environmental Engineering</option>
                  <option value="Electrical and Information Engineering">Electrical and Information Engineering</option>
                  <option value="Marine Engineering and Naval Architecture">Marine Engineering and Naval Architecture</option>
                  <option value="Mechanical and Manufacturing Engineering">Mechanical and Manufacturing Engineering</option>
                  <option value="Computer Engineering">Computer Engineering</option>
                </Select>
                <Input
                  label="Patent Invention Title *"
                  placeholder="e.g. Adaptive edge AI scheduler for smart microgrids"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <Input
                  label="Assigned Legal Reviewer"
                  placeholder="e.g. Aisha Bennett"
                  value={form.reviewer}
                  onChange={(e) => setForm({ ...form, reviewer: e.target.value })}
                  required
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <label className="block text-sm">
                  <span className="text-ink/70 mb-1.5 block font-medium text-xs uppercase tracking-wider">Brief Description</span>
                  <textarea
                    className="w-full rounded-xl border border-line px-3.5 py-2.5 outline-none bg-surface text-ink text-xs focus-glow transition-all duration-200 shadow-xs hover:border-ink/20"
                    rows={4}
                    placeholder="Enter short abstract of the invention..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </label>
              </div>
            )}

            <div className="flex justify-between pt-4">
              {step > 1 ? (
                <Button type="button" variant="ghost" onClick={handlePrevStep}>
                  Back
                </Button>
              ) : (
                <div />
              )}
              {step < 3 ? (
                <Button type="button" onClick={handleNextStep}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" loading={submitting}>
                  Submit Application
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Workflow Guidance Card */}
        <div className="bg-surface border border-line rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">Workflow Guidance</h3>
            <p className="text-[11px] text-ink/45 mt-0.5 leading-relaxed">
              Every disclosure proceeds through intake, internal review, filing readiness, and case promotion to preserve legal traceability.
            </p>
          </div>

          <div className="space-y-4 my-6">
            {[
              { title: "Capture all inventors", active: true },
              { title: "Attach supporting files", active: true },
              { title: "Route approval with audit trail", active: true },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-light flex items-center justify-center text-indigo shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-ink/80">{step.title}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-line pt-3 text-[10px] text-ink/40 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-indigo animate-pulse-dot" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Review guidelines checklist
          </div>
        </div>
      </div>

      {/* Disclosures Table */}
      <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Submitted Invention Disclosures</h3>
      <DataTable
        columns={columns}
        rows={disclosures}
        loading={loading}
        onRowClick={(row) => setSelectedDisclosure(row)}
        emptyLabel="No disclosures submitted yet."
      />

      {/* Disclosure Details Drawer Modal */}
      <Modal open={!!selectedDisclosure} onClose={() => setSelectedDisclosure(null)} title="Disclosure Details">
        {selectedDisclosure && (
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-ink/45 text-[10px] font-bold uppercase">Disclosure Title</span>
              <p className="text-sm font-bold text-ink/80 mt-1">{selectedDisclosure.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-ink/45 text-[10px] font-bold uppercase">Primary Inventor</span>
                <p className="font-bold text-ink/80 mt-1">{selectedDisclosure.primary_inventor}</p>
              </div>
              <div>
                <span className="text-ink/45 text-[10px] font-bold uppercase">Department</span>
                <p className="font-bold text-ink/80 mt-1">{selectedDisclosure.department}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-ink/45 text-[10px] font-bold uppercase">Status</span>
                <div className="mt-1"><StatusDot status={selectedDisclosure.status} /></div>
              </div>
              <div>
                <span className="text-ink/45 text-[10px] font-bold uppercase">Due Date</span>
                <p className="font-bold text-ink/80 mt-1 tabular">{selectedDisclosure.due_date || '—'}</p>
              </div>
            </div>
            {selectedDisclosure.description && (
              <div>
                <span className="text-ink/45 text-[10px] font-bold uppercase">Abstract Summary</span>
                <p className="text-ink/70 leading-relaxed mt-1 border border-line rounded-xl p-3 bg-paper/30">{selectedDisclosure.description}</p>
              </div>
            )}

            {/* TTC Staff Admin Actions */}
            {isStaffOrAdmin && selectedDisclosure.status === 'under_review' && (
              <div className="border-t border-line pt-4 flex gap-3 justify-end">
                <Button variant="danger" disabled={actionLoading} onClick={() => handleStatusUpdate('needs_revision')}>
                  Request Revision
                </Button>
                <Button variant="success" disabled={actionLoading} onClick={() => handleStatusUpdate('approved')}>
                  Approve & Promote
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
