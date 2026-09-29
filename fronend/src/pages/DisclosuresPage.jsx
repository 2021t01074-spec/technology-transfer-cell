import { useEffect, useState } from 'react'
import { listDisclosures, createDisclosure, updateDisclosureStatus, evaluateDisclosure } from '../api/disclosures'
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

const STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  evaluation: 'Evaluation',
  needs_revision: 'Needs Revision',
  approved: 'Approved',
  ready_for_filing: 'Ready for Filing',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

const DEPARTMENTS = [
  'Civil and Environmental Engineering',
  'Electrical and Information Engineering',
  'Marine Engineering and Naval Architecture',
  'Mechanical and Manufacturing Engineering',
  'Computer Engineering',
]

const DEVELOPMENT_STAGES = [
  { value: 'Concept', label: 'Concept / Idea Stage' },
  { value: 'Prototype', label: 'Prototype Developed' },
  { value: 'Tested', label: 'Tested / Validated' },
  { value: 'Ready', label: 'Ready for Deployment' },
]

export default function DisclosuresPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [disclosures, setDisclosures] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [step, setStep] = useState(1)
  const TOTAL_STEPS = 5
  const [form, setForm] = useState({
    title: '',
    department: 'Computer Engineering',
    primary_inventor: '',
    co_inventors_json: '',
    reviewer: '',
    description: '',
    technical_field: '',
    keywords: '',
    problem_statement: '',
    novelty_description: '',
    prior_art_known: '',
    development_stage: 'Concept',
    funding_source: 'university',
    grant_contract_number: '',
    university_resources_used: true,
    prior_public_disclosure: false,
    public_disclosure_details: '',
    publication_planned: false,
    potential_applications: '',
    potential_licensees: '',
    market_size_estimate: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [selectedDisclosure, setSelectedDisclosure] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [evaluationNotes, setEvaluationNotes] = useState('')
  const [evaluationDecision, setEvaluationDecision] = useState('')

  const isStaffOrAdmin = user && ['super_admin', 'ttc_staff'].includes(user.role)

  const columns = [
    { key: 'title', label: 'Disclosure Title' },
    { key: 'primary_inventor', label: 'Primary Inventor' },
    { key: 'department', label: 'Department' },
    { key: 'technical_field', label: 'Technical Field', render: (r) => r.technical_field || '—' },
    { key: 'status', label: 'Status', render: (r) => <StatusDot status={r.status} /> },
    { key: 'development_stage', label: 'Stage', render: (r) => r.development_stage || '—' },
    { key: 'due_date', label: 'Due Date', render: (r) => r.due_date || '—' },
  ]

  async function loadDisclosures() {
    try {
      const data = await listDisclosures(statusFilter || undefined)
      setDisclosures(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDisclosures()
  }, [statusFilter])

  const handleNextStep = () => {
    // Validate current step
    if (step === 1 && (!form.primary_inventor.trim() || !form.title.trim())) {
      addToast('Please fill in the required fields.', 'error')
      return
    }
    if (step < TOTAL_STEPS) setStep(step + 1)
  }

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  async function handleFormSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.primary_inventor.trim()) {
      addToast('Invention title and primary inventor are required.', 'error')
      return
    }
    setSubmitting(true)
    try {
      await createDisclosure({
        ...form,
        status: 'submitted',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
      addToast('Invention disclosure submitted successfully!', 'success')
      setStep(1)
      setForm({
        title: '', department: 'Computer Engineering', primary_inventor: '', co_inventors_json: '',
        reviewer: '', description: '', technical_field: '', keywords: '', problem_statement: '',
        novelty_description: '', prior_art_known: '', development_stage: 'Concept',
        funding_source: 'university', grant_contract_number: '', university_resources_used: true,
        prior_public_disclosure: false, public_disclosure_details: '', publication_planned: false,
        potential_applications: '', potential_licensees: '', market_size_estimate: '',
      })
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
        const caseNo = `PAT-${Math.floor(Math.random() * 9000 + 1000)}`
        await createPatent({
          title: selectedDisclosure.title,
          patent_number: caseNo,
          jurisdiction: 'US / PCT',
          assignee: 'Technology Transfer Cell',
          attorney: user?.full_name || 'TTC Legal Office',
          status: 'drafting',
          budget: 30000,
          claims_text: selectedDisclosure.novelty_description || selectedDisclosure.description || '',
          legal_notes: `Promoted from invention disclosure #${selectedDisclosure.id}. Evaluated by ${user?.full_name}.`,
          short_description: selectedDisclosure.problem_statement,
          detailed_description: selectedDisclosure.description,
        })
        await updateDisclosureStatus(selectedDisclosure.id, 'ready_for_filing', evaluationNotes)
        addToast(`Disclosure approved. Patent drafting case ${caseNo} created!`, 'success')
      } else {
        await updateDisclosureStatus(selectedDisclosure.id, status, evaluationNotes)
        addToast(`Status updated to ${STATUS_LABELS[status] || status}.`, 'info')
      }
      setSelectedDisclosure(null)
      setEvaluationNotes('')
      loadDisclosures()
    } catch (err) {
      addToast('Failed to update disclosure action.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleEvaluation() {
    if (!selectedDisclosure || !evaluationDecision) return
    setActionLoading(true)
    try {
      await evaluateDisclosure(selectedDisclosure.id, {
        evaluation_decision: evaluationDecision,
        evaluation_notes: evaluationNotes,
        evaluation_date: new Date().toISOString().split('T')[0],
      })
      addToast('Evaluation recorded successfully.', 'success')
      setSelectedDisclosure(null)
      setEvaluationNotes('')
      setEvaluationDecision('')
      loadDisclosures()
    } catch (err) {
      addToast('Failed to record evaluation.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const stepLabels = ['Inventor Info', 'Invention Details', 'Prior Art & Novelty', 'Funding & Disclosure', 'Commercial Potential']

  return (
    <>
      <PageHeader
        title="Invention Disclosure Management"
        description="Submit and manage invention disclosures through the university IP evaluation lifecycle. Faculty members disclose inventions; TTC staff evaluates, reviews, and promotes approved disclosures to patent applications."
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
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Submit Invention Disclosure</h3>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-light text-indigo px-2.5 py-0.5 rounded-full">
              Step {step} of {TOTAL_STEPS}
            </span>
          </div>

          {/* Step Progress Bar */}
          <div className="h-1 w-full bg-paper rounded-full mb-2 overflow-hidden">
            <div
              className="h-full bg-indigo transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mb-6">
            {stepLabels.map((label, i) => (
              <span key={i} className={`text-[9px] font-bold uppercase tracking-wider ${i + 1 <= step ? 'text-indigo' : 'text-ink/25'}`}>
                {label}
              </span>
            ))}
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Step 1: Inventor Info */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <Input
                  label="Primary Inventor Full Name *"
                  placeholder="e.g. Dr. Nimal Perera"
                  value={form.primary_inventor}
                  onChange={(e) => setForm({ ...form, primary_inventor: e.target.value })}
                  required
                />
                <Input
                  label="Co-Inventors (comma-separated)"
                  placeholder="e.g. Dr. Kamal Silva, Ms. Tanya Fernando"
                  value={form.co_inventors_json}
                  onChange={(e) => setForm({ ...form, co_inventors_json: e.target.value })}
                />
                <Select
                  label="Department *"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
                <Input
                  label="Invention Title *"
                  placeholder="e.g. Adaptive edge AI scheduler for smart microgrids"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
            )}

            {/* Step 2: Invention Details */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <Input
                  label="Technical Field"
                  placeholder="e.g. Machine Learning, Biomedical Engineering"
                  value={form.technical_field}
                  onChange={(e) => setForm({ ...form, technical_field: e.target.value })}
                />
                <Input
                  label="Keywords (comma-separated)"
                  placeholder="e.g. edge computing, AI scheduling, energy optimization"
                  value={form.keywords}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                />
                <label className="block text-sm">
                  <span className="text-ink/70 mb-1.5 block font-medium text-xs uppercase tracking-wider">Problem Statement</span>
                  <textarea
                    className="w-full rounded-xl border border-line px-3.5 py-2.5 outline-none bg-surface text-ink text-xs focus-glow transition-all duration-200 shadow-xs hover:border-ink/20"
                    rows={3}
                    placeholder="What problem does this invention address?"
                    value={form.problem_statement}
                    onChange={(e) => setForm({ ...form, problem_statement: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ink/70 mb-1.5 block font-medium text-xs uppercase tracking-wider">Brief Description / Abstract</span>
                  <textarea
                    className="w-full rounded-xl border border-line px-3.5 py-2.5 outline-none bg-surface text-ink text-xs focus-glow transition-all duration-200 shadow-xs hover:border-ink/20"
                    rows={3}
                    placeholder="Describe the invention in sufficient technical detail..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </label>
                <Select
                  label="Development Stage"
                  value={form.development_stage}
                  onChange={(e) => setForm({ ...form, development_stage: e.target.value })}
                >
                  {DEVELOPMENT_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
              </div>
            )}

            {/* Step 3: Prior Art & Novelty */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <label className="block text-sm">
                  <span className="text-ink/70 mb-1.5 block font-medium text-xs uppercase tracking-wider">What is Novel / Different?</span>
                  <textarea
                    className="w-full rounded-xl border border-line px-3.5 py-2.5 outline-none bg-surface text-ink text-xs focus-glow transition-all duration-200 shadow-xs hover:border-ink/20"
                    rows={3}
                    placeholder="Describe what is new compared to existing solutions..."
                    value={form.novelty_description}
                    onChange={(e) => setForm({ ...form, novelty_description: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ink/70 mb-1.5 block font-medium text-xs uppercase tracking-wider">Known Prior Art References</span>
                  <textarea
                    className="w-full rounded-xl border border-line px-3.5 py-2.5 outline-none bg-surface text-ink text-xs focus-glow transition-all duration-200 shadow-xs hover:border-ink/20"
                    rows={3}
                    placeholder="List any known patents, papers, or products that are similar..."
                    value={form.prior_art_known}
                    onChange={(e) => setForm({ ...form, prior_art_known: e.target.value })}
                  />
                </label>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <h4 className="text-xs font-bold text-amber-900 mb-2">⚠ Public Disclosure Warning</h4>
                  <p className="text-[11px] text-amber-800 leading-relaxed mb-3">
                    Public disclosure (conference presentations, journal publications, preprints) before filing a patent can jeopardize patent rights in most jurisdictions. Please disclose any prior public sharing below.
                  </p>
                  <div className="flex items-center gap-3 mb-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.prior_public_disclosure}
                        onChange={(e) => setForm({ ...form, prior_public_disclosure: e.target.checked })}
                        className="rounded"
                      />
                      This invention has been publicly disclosed
                    </label>
                  </div>
                  {form.prior_public_disclosure && (
                    <Input
                      label="Details of Public Disclosure"
                      placeholder="e.g. Presented at IEEE conference on 2026-03-15, paper submitted to Nature..."
                      value={form.public_disclosure_details}
                      onChange={(e) => setForm({ ...form, public_disclosure_details: e.target.value })}
                    />
                  )}
                  <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer mt-3">
                    <input
                      type="checkbox"
                      checked={form.publication_planned}
                      onChange={(e) => setForm({ ...form, publication_planned: e.target.checked })}
                      className="rounded"
                    />
                    Publication is planned / in preparation
                  </label>
                </div>
              </div>
            )}

            {/* Step 4: Funding & Resource Usage */}
            {step === 4 && (
              <div className="space-y-4 animate-fade-in">
                <Select
                  label="Funding Source"
                  value={form.funding_source}
                  onChange={(e) => setForm({ ...form, funding_source: e.target.value })}
                >
                  <option value="university">University Internal Funds</option>
                  <option value="government_grant">Government Grant</option>
                  <option value="industry_sponsored">Industry Sponsored</option>
                  <option value="self_funded">Self Funded</option>
                  <option value="mixed">Mixed Funding</option>
                </Select>
                {(form.funding_source === 'government_grant' || form.funding_source === 'industry_sponsored') && (
                  <Input
                    label="Grant / Contract Reference Number"
                    placeholder="e.g. NRC-2025-AI-042"
                    value={form.grant_contract_number}
                    onChange={(e) => setForm({ ...form, grant_contract_number: e.target.value })}
                  />
                )}
                <div className="p-4 rounded-xl bg-paper border border-line">
                  <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.university_resources_used}
                      onChange={(e) => setForm({ ...form, university_resources_used: e.target.checked })}
                      className="rounded"
                    />
                    University facilities, equipment, or resources were used in developing this invention
                  </label>
                  <p className="text-[10px] text-ink/40 mt-2 leading-relaxed">
                    This affects IP ownership determination under university policy. If university resources were used, the university may have ownership rights per the institutional IP policy.
                  </p>
                </div>
                <Input
                  label="Assigned TTC Reviewer (optional)"
                  placeholder="e.g. Aisha Bennett"
                  value={form.reviewer}
                  onChange={(e) => setForm({ ...form, reviewer: e.target.value })}
                />
              </div>
            )}

            {/* Step 5: Commercial Potential */}
            {step === 5 && (
              <div className="space-y-4 animate-fade-in">
                <label className="block text-sm">
                  <span className="text-ink/70 mb-1.5 block font-medium text-xs uppercase tracking-wider">Potential Applications & Markets</span>
                  <textarea
                    className="w-full rounded-xl border border-line px-3.5 py-2.5 outline-none bg-surface text-ink text-xs focus-glow transition-all duration-200 shadow-xs hover:border-ink/20"
                    rows={3}
                    placeholder="Describe potential real-world applications and target markets..."
                    value={form.potential_applications}
                    onChange={(e) => setForm({ ...form, potential_applications: e.target.value })}
                  />
                </label>
                <Input
                  label="Potential Licensees / Industry Partners"
                  placeholder="e.g. Medtronic, Apple, WSO2"
                  value={form.potential_licensees}
                  onChange={(e) => setForm({ ...form, potential_licensees: e.target.value })}
                />
                <Input
                  label="Estimated Market Size (optional)"
                  placeholder="e.g. USD 2.1B (AI Security market by 2028)"
                  value={form.market_size_estimate}
                  onChange={(e) => setForm({ ...form, market_size_estimate: e.target.value })}
                />
                <div className="p-4 rounded-xl bg-indigo/5 border border-indigo/10">
                  <p className="text-[11px] text-ink/60 leading-relaxed">
                    <strong className="text-ink/80">Disclosure Agreement:</strong> By submitting this disclosure, I confirm that the information provided is accurate and complete to the best of my knowledge. I understand that the Technology Transfer Cell will evaluate this disclosure for potential IP protection and commercialization opportunities, and that this submission does not constitute a patent filing.
                  </p>
                </div>
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
              {step < TOTAL_STEPS ? (
                <Button type="button" onClick={handleNextStep}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" loading={submitting}>
                  Submit Disclosure
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Workflow Guidance Card */}
        <div className="bg-surface border border-line rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">IP Lifecycle Guidance</h3>
            <p className="text-[11px] text-ink/45 mt-0.5 leading-relaxed">
              Every disclosure proceeds through a structured evaluation to determine patentability, commercial viability, and IP protection strategy.
            </p>
          </div>

          <div className="space-y-3 my-6">
            {[
              { title: "1. Submit Disclosure", desc: "Capture invention details, inventors, and novelty" },
              { title: "2. TTC Review", desc: "Completeness check and technical assessment" },
              { title: "3. IP Evaluation", desc: "Patentability & commercial potential analysis" },
              { title: "4. Protection Decision", desc: "File patent, seek more info, or defer" },
              { title: "5. Patent Drafting", desc: "Promote to patent application if approved" },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-light flex items-center justify-center text-indigo shrink-0 mt-0.5">
                  <span className="text-[9px] font-black">{i + 1}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-ink/80 block">{step.title}</span>
                  <span className="text-[10px] text-ink/40">{step.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-line pt-3 text-[10px] text-ink/40 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Disclose inventions BEFORE any public disclosure
          </div>
        </div>
      </div>

      {/* Status Filter & Disclosures Table */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Submitted Invention Disclosures</h3>
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setLoading(true) }}
          className="py-1 px-2 text-xs w-44"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
      </div>
      <DataTable
        columns={columns}
        rows={disclosures}
        loading={loading}
        onRowClick={(row) => { setSelectedDisclosure(row); setEvaluationNotes(''); setEvaluationDecision('') }}
        emptyLabel="No disclosures submitted yet."
      />

      {/* Disclosure Details / Evaluation Modal */}
      <Modal open={!!selectedDisclosure} onClose={() => setSelectedDisclosure(null)} title="Disclosure Details & Evaluation">
        {selectedDisclosure && (
          <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
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
                <span className="text-ink/45 text-[10px] font-bold uppercase">Technical Field</span>
                <p className="font-bold text-ink/80 mt-1">{selectedDisclosure.technical_field || '—'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-ink/45 text-[10px] font-bold uppercase">Development Stage</span>
                <p className="font-bold text-ink/80 mt-1">{selectedDisclosure.development_stage || '—'}</p>
              </div>
              <div>
                <span className="text-ink/45 text-[10px] font-bold uppercase">Funding Source</span>
                <p className="font-bold text-ink/80 mt-1 capitalize">{selectedDisclosure.funding_source?.replace('_', ' ') || '—'}</p>
              </div>
            </div>
            
            {selectedDisclosure.problem_statement && (
              <div>
                <span className="text-ink/45 text-[10px] font-bold uppercase">Problem Statement</span>
                <p className="text-ink/70 leading-relaxed mt-1 border border-line rounded-xl p-3 bg-paper/30">{selectedDisclosure.problem_statement}</p>
              </div>
            )}
            {selectedDisclosure.novelty_description && (
              <div>
                <span className="text-ink/45 text-[10px] font-bold uppercase">Novelty / What's New</span>
                <p className="text-ink/70 leading-relaxed mt-1 border border-line rounded-xl p-3 bg-paper/30">{selectedDisclosure.novelty_description}</p>
              </div>
            )}
            {selectedDisclosure.prior_art_known && (
              <div>
                <span className="text-ink/45 text-[10px] font-bold uppercase">Known Prior Art</span>
                <p className="text-ink/70 leading-relaxed mt-1 border border-line rounded-xl p-3 bg-paper/30">{selectedDisclosure.prior_art_known}</p>
              </div>
            )}
            {selectedDisclosure.description && (
              <div>
                <span className="text-ink/45 text-[10px] font-bold uppercase">Abstract / Description</span>
                <p className="text-ink/70 leading-relaxed mt-1 border border-line rounded-xl p-3 bg-paper/30">{selectedDisclosure.description}</p>
              </div>
            )}

            {selectedDisclosure.prior_public_disclosure && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] font-bold text-amber-900 uppercase">⚠ Prior Public Disclosure Flagged</span>
                <p className="text-[11px] text-amber-800 mt-1">{selectedDisclosure.public_disclosure_details || 'Details not provided'}</p>
              </div>
            )}

            {(selectedDisclosure.potential_applications || selectedDisclosure.potential_licensees) && (
              <div className="grid grid-cols-2 gap-4">
                {selectedDisclosure.potential_applications && (
                  <div>
                    <span className="text-ink/45 text-[10px] font-bold uppercase">Applications</span>
                    <p className="font-bold text-ink/80 mt-1">{selectedDisclosure.potential_applications}</p>
                  </div>
                )}
                {selectedDisclosure.potential_licensees && (
                  <div>
                    <span className="text-ink/45 text-[10px] font-bold uppercase">Potential Licensees</span>
                    <p className="font-bold text-ink/80 mt-1">{selectedDisclosure.potential_licensees}</p>
                  </div>
                )}
              </div>
            )}

            {/* Evaluation section */}
            {selectedDisclosure.evaluation_decision && (
              <div className="p-3 rounded-xl bg-teal/5 border border-teal/10">
                <span className="text-[10px] font-bold text-teal uppercase">Evaluation Recorded</span>
                <p className="text-xs text-ink/70 mt-1">
                  <strong>Decision:</strong> {selectedDisclosure.evaluation_decision?.replace(/_/g, ' ')} ·{' '}
                  <strong>By:</strong> {selectedDisclosure.evaluated_by || 'TTC'} ·{' '}
                  <strong>Date:</strong> {selectedDisclosure.evaluation_date || '—'}
                </p>
                {selectedDisclosure.evaluation_notes && (
                  <p className="text-xs text-ink/60 mt-1">{selectedDisclosure.evaluation_notes}</p>
                )}
              </div>
            )}

            {/* TTC Staff Admin Actions */}
            {isStaffOrAdmin && ['submitted', 'under_review', 'evaluation'].includes(selectedDisclosure.status) && (
              <div className="border-t border-line pt-4 space-y-3">
                <h4 className="text-[10px] font-bold text-ink uppercase tracking-wider">TTC Review Actions</h4>
                
                <label className="block text-sm">
                  <span className="text-ink/70 mb-1.5 block font-medium text-xs uppercase tracking-wider">Review / Evaluation Notes</span>
                  <textarea
                    className="w-full rounded-xl border border-line px-3.5 py-2.5 outline-none bg-surface text-ink text-xs focus-glow transition-all duration-200 shadow-xs hover:border-ink/20"
                    rows={2}
                    placeholder="Enter review notes, feedback, or evaluation rationale..."
                    value={evaluationNotes}
                    onChange={(e) => setEvaluationNotes(e.target.value)}
                  />
                </label>

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Select
                      label="Evaluation Decision"
                      value={evaluationDecision}
                      onChange={(e) => setEvaluationDecision(e.target.value)}
                    >
                      <option value="">Select decision...</option>
                      <option value="proceed_to_patent">Proceed to Patent Filing</option>
                      <option value="seek_more_info">Seek More Information</option>
                      <option value="defer">Defer Decision</option>
                      <option value="decline">Decline Protection</option>
                      <option value="license_only">License Without Patent</option>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    disabled={actionLoading || !evaluationDecision}
                    onClick={handleEvaluation}
                    className="h-[38px]"
                  >
                    Record Evaluation
                  </Button>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="danger" disabled={actionLoading} onClick={() => handleStatusUpdate('needs_revision')}>
                    Request Revision
                  </Button>
                  <Button variant="ghost" disabled={actionLoading} onClick={() => handleStatusUpdate('rejected')}>
                    Reject
                  </Button>
                  <Button variant="success" disabled={actionLoading} onClick={() => handleStatusUpdate('approved')}>
                    Approve & Create Patent Case
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
