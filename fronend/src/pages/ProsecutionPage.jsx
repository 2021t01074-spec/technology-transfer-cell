import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listPatents, updatePatentStatus, addPatentTimelineEvent } from '../api/patents'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import StatusDot from '../components/ui/StatusDot'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'

export default function ProsecutionPage() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  
  const [patents, setPatents] = useState([])
  const [filteredPatents, setFilteredPatents] = useState([])
  const [selectedPatent, setSelectedPatent] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Office Action Response Modal State
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [responseTitle, setResponseTitle] = useState('Response to Non-Final Office Action')
  const [responseNotes, setResponseNotes] = useState('')
  const [claimsAmendments, setClaimsAmendments] = useState('')
  const [submittingResponse, setSubmittingResponse] = useState(false)

  async function loadProsecutions() {
    try {
      const data = await listPatents()
      setPatents(data)
      setFilteredPatents(data)
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
    loadProsecutions()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFilteredPatents(
      patents.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.patent_number.toLowerCase().includes(q) ||
        p.attorney.toLowerCase().includes(q) ||
        (p.status && p.status.toLowerCase().includes(q))
      )
    )
  }, [search, patents])

  const handleStatusChange = async (patentId, newStatus) => {
    try {
      const updated = await updatePatentStatus(patentId, newStatus)
      addToast(`Prosecution status updated to ${newStatus.replace('_', ' ')}`, 'success')
      loadProsecutions()
      if (selectedPatent && selectedPatent.id === patentId) {
        setSelectedPatent(updated)
      }
    } catch (err) {
      addToast('Failed to update status', 'error')
    }
  }

  const handleResponseSubmit = async (e) => {
    e.preventDefault()
    if (!selectedPatent) return
    setSubmittingResponse(true)
    try {
      await addPatentTimelineEvent(selectedPatent.id, {
        event_title: responseTitle,
        event_date: new Date().toISOString().split('T')[0],
        notes: `Notes: ${responseNotes} | Amendments: ${claimsAmendments}`
      })
      
      // Update status to filed or under_review
      await updatePatentStatus(selectedPatent.id, 'filed')
      addToast('Formal Response to Office Action submitted to Patent Office!', 'success')
      setShowResponseModal(false)
      setResponseNotes('')
      setClaimsAmendments('')
      loadProsecutions()
    } catch (err) {
      addToast('Failed to log office action response', 'error')
    } finally {
      setSubmittingResponse(false)
    }
  }

  const columns = [
    {
      key: 'patent_number',
      label: 'Serial / Case #',
      render: (r) => (
        <div>
          <span className="font-extrabold text-indigo cursor-pointer hover:underline" onClick={() => setSelectedPatent(r)}>
            {r.patent_number}
          </span>
          <span className="block text-[10px] text-ink/50">{r.patent_type || 'Utility Patent'}</span>
        </div>
      )
    },
    { key: 'title', label: 'Patent Specification Title', render: (r) => <span className="font-semibold text-ink line-clamp-1">{r.title}</span> },
    { key: 'attorney', label: 'Registered Patent Attorney', render: (r) => r.attorney || 'TTC Legal Office' },
    { key: 'jurisdiction', label: 'Patent Authority', render: (r) => `${r.jurisdiction} IP Office` },
    { key: 'status', label: 'Prosecution Stage', render: (r) => <StatusDot status={r.status} /> },
    { key: 'next_due_date', label: 'Statutory Due Date', render: (r) => r.next_due_date || '—' },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => { setSelectedPatent(r); setShowResponseModal(true); }}
            className="py-1 px-2 text-xs text-indigo font-bold"
          >
            File Office Action
          </Button>
        </div>
      )
    }
  ]

  return (
    <>
      <PageHeader
        title="Patent Prosecution & Office Action Console"
        description="Official patent prosecution registry: manage examiner office actions, file claims amendments, track 90-day statutory response windows, and oversee patent grant allowances."
        icon={
          <svg className="w-5 h-5 text-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
          </svg>
        }
      />

      {/* Prosecution Lifecycle Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface border border-line p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            Action Pending
          </span>
          <p className="text-xl font-black text-ink mt-2">
            {patents.filter(p => p.status === 'office_action' || p.status === 'under_review').length}
          </p>
          <p className="text-xs text-ink/60 mt-0.5">Active Office Actions</p>
        </div>

        <div className="bg-surface border border-line p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-indigo bg-indigo/10 px-2 py-0.5 rounded-full">
            Under Search
          </span>
          <p className="text-xl font-black text-ink mt-2">
            {patents.filter(p => p.status === 'filed').length}
          </p>
          <p className="text-xs text-ink/60 mt-0.5">Formally Filed & Pending Search</p>
        </div>

        <div className="bg-surface border border-line p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            Patents Granted
          </span>
          <p className="text-xl font-black text-ink mt-2">
            {patents.filter(p => p.status === 'granted').length}
          </p>
          <p className="text-xs text-ink/60 mt-0.5">Grant Certificates Issued</p>
        </div>

        <div className="bg-surface border border-line p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
            Drafting
          </span>
          <p className="text-xl font-black text-ink mt-2">
            {patents.filter(p => p.status === 'drafting' || p.is_draft).length}
          </p>
          <p className="text-xs text-ink/60 mt-0.5">Specifications In Preparation</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-surface border border-line rounded-2xl p-4 shadow-xs mb-6 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search by patent title, serial number, attorney, or stage..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Prosecution Cases Table */}
      <DataTable
        columns={columns}
        data={filteredPatents}
        loading={loading}
        emptyLabel="No patent prosecution cases matched your search filters."
      />

      {/* Selected Case Inspection Drawer */}
      {selectedPatent && (
        <div className="bg-surface border border-line rounded-2xl p-6 shadow-md mt-6 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-line pb-4 mb-4 gap-4">
            <div>
              <span className="text-[10px] font-black uppercase text-indigo bg-indigo/10 px-3 py-1 rounded-full">
                {selectedPatent.patent_number}
              </span>
              <h2 className="text-lg font-bold text-ink mt-2">{selectedPatent.title}</h2>
              <p className="text-xs text-ink/50 mt-0.5">
                Attorney: {selectedPatent.attorney || 'TTC Legal Office'} • Jurisdiction: {selectedPatent.jurisdiction || 'US / PCT'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Select
                value={selectedPatent.status}
                onChange={(e) => handleStatusChange(selectedPatent.id, e.target.value)}
                className="py-1 px-3 text-xs"
              >
                <option value="drafting">Drafting Specification</option>
                <option value="under_review">Under Formality Examination</option>
                <option value="office_action">Office Action Issued</option>
                <option value="filed">Formally Filed (Prior Art Search)</option>
                <option value="granted">Patent Granted (Notice of Allowance)</option>
              </Select>
              <Button onClick={() => setShowResponseModal(true)} className="py-1.5 px-4 text-xs font-bold shadow-md">
                + File Response / Amendment
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 rounded-xl bg-paper border border-line space-y-2">
              <h3 className="font-bold text-ink uppercase tracking-wider text-[10px]">Claims & Technical Scope</h3>
              <p className="text-ink/80 leading-relaxed">
                {selectedPatent.claims_text || 'Claims specification detailing independent claim elements, novelty scope, and technical mechanism.'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-paper border border-line space-y-2">
              <h3 className="font-bold text-ink uppercase tracking-wider text-[10px]">Legal Notes & Prosecution History</h3>
              <p className="text-ink/80 leading-relaxed">
                {selectedPatent.legal_notes || 'Prior art search completed. Specification aligned with patent office examination guidelines.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Office Action Response Modal */}
      <Modal isOpen={showResponseModal} onClose={() => setShowResponseModal(false)} title="File Formal Response to Office Action">
        <form onSubmit={handleResponseSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink/70 mb-1">Response Type / Action Title *</label>
            <Select
              value={responseTitle}
              onChange={(e) => setResponseTitle(e.target.value)}
            >
              <option value="Response to Non-Final Office Action">Response to Non-Final Office Action (30/90-Day Window)</option>
              <option value="Amendment under Rule 1.111">Amendment under Rule 1.111 (Claim Revisions)</option>
              <option value="Response to Restriction Requirement">Response to Restriction Requirement</option>
              <option value="Request for Continued Examination (RCE)">Request for Continued Examination (RCE)</option>
              <option value="Payment of Issue Fee & Notice of Allowance">Payment of Issue Fee & Notice of Allowance</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/70 mb-1">Claim Amendments & Distinctions *</label>
            <textarea
              rows={3}
              value={claimsAmendments}
              onChange={(e) => setClaimsAmendments(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface p-3 text-xs text-ink focus:border-indigo focus:outline-none"
              placeholder="Detail specific claim amendments, element additions, and prior art differentiation..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/70 mb-1">Legal Arguments & Remarks</label>
            <textarea
              rows={3}
              value={responseNotes}
              onChange={(e) => setResponseNotes(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface p-3 text-xs text-ink focus:border-indigo focus:outline-none"
              placeholder="Summary of legal arguments demonstrating non-obviousness and novelty over cited references..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button variant="ghost" onClick={() => setShowResponseModal(false)}>Cancel</Button>
            <Button type="submit" loading={submittingResponse}>
              Submit Formal Office Action Response →
            </Button>
          </div>
        </form>
      </Modal>

    </>
  )
}
