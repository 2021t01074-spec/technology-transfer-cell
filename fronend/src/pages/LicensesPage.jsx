import { useEffect, useState } from 'react'
import { listLicenses, createLicense, updateLicenseStatus } from '../api/licenses'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import StatusDot from '../components/ui/StatusDot'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { useToast } from '../components/ui/Toast'

const columns = [
  { key: 'title', label: 'License Agreement' },
  { key: 'licensee_name', label: 'Licensee Partner' },
  { key: 'royalty_rate', label: 'Royalty Rate', render: (r) => r.royalty_rate ? `${r.royalty_rate}%` : '—' },
  { key: 'revenue_ytd', label: 'YTD Revenue (Rs.)', render: (r) => r.revenue_ytd ? `Rs. ${r.revenue_ytd.toLocaleString()}` : '—' },
  { key: 'status', label: 'Status', render: (r) => <StatusDot status={r.status} /> },
  { key: 'signing_date', label: 'Signing Date', render: (r) => r.signing_date || '—' },
]

export default function LicensesPage() {
  const { addToast } = useToast()
  const [licenses, setLicenses] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Creation form
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '',
    licensee_name: '',
    royalty_rate: '',
    revenue_ytd: '',
    status: 'active',
    signing_date: '',
  })

  // Details state
  const [selectedLicense, setSelectedLicense] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  async function loadLicenses() {
    try {
      const data = await listLicenses()
      setLicenses(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLicenses()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createLicense({
        ...form,
        royalty_rate: form.royalty_rate ? parseFloat(form.royalty_rate) : null,
        revenue_ytd: form.revenue_ytd ? parseFloat(form.revenue_ytd) : 0,
        signing_date: form.signing_date || null
      })
      addToast('License agreement created successfully!', 'success')
      setOpen(false)
      setForm({ title: '', licensee_name: '', royalty_rate: '', revenue_ytd: '', status: 'active', signing_date: '' })
      loadLicenses()
    } catch (err) {
      addToast('Failed to create license contract.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStatusUpdate(newStatus) {
    if (!selectedLicense) return
    setUpdatingStatus(true)
    try {
      const updated = await updateLicenseStatus(selectedLicense.id, newStatus)
      setSelectedLicense(updated)
      addToast('License status updated.', 'success')
      loadLicenses()
    } catch (err) {
      addToast('Failed to update status.', 'error')
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Licensing & Agreements"
        description="Monitor active licenses, royalty rate parameters, and YTD royalty revenues."
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        action={<Button onClick={() => setOpen(true)}>+ New License</Button>}
      />

      <div className="bg-surface border border-line rounded-2xl p-6 shadow-xs mb-8 stagger-children">
        <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">Total Royalty Revenue (YTD)</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-indigo">
            Rs. {licenses.reduce((acc, curr) => acc + (curr.revenue_ytd || 0), 0).toLocaleString()}
          </span>
          <span className="text-xs text-ink/40 font-semibold">LKR</span>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={licenses}
        loading={loading}
        onRowClick={(row) => setSelectedLicense(row)}
        emptyLabel="No active licensing agreements recorded."
      />

      {/* License Details Modal */}
      <Modal isOpen={!!selectedLicense} onClose={() => setSelectedLicense(null)} title="Licensing Contract Details">
        {selectedLicense && (
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-ink/45 text-[10px] font-bold uppercase">License Agreement</span>
              <p className="text-sm font-bold text-ink/80 mt-1">{selectedLicense.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-ink/45 text-[10px] font-bold uppercase">Licensee Partner</span>
                <p className="font-bold text-ink/80 mt-1">{selectedLicense.licensee_name}</p>
              </div>
              <div>
                <span className="text-ink/45 text-[10px] font-bold uppercase">Royalty Rate</span>
                <p className="font-bold text-ink/80 mt-1">{selectedLicense.royalty_rate}%</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-ink/45 text-[10px] font-bold uppercase">YTD Revenue (Rs.)</span>
                <p className="font-bold text-ink/80 mt-1 tabular">Rs. {selectedLicense.revenue_ytd?.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-ink/45 text-[10px] font-bold uppercase">Signing Date</span>
                <p className="font-bold text-ink/80 mt-1 tabular">{selectedLicense.signing_date || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-t border-line pt-4 justify-between">
              <div className="flex items-center gap-2">
                <span className="text-ink/45 text-[10px] font-bold uppercase">Contract Status:</span>
                <StatusDot status={selectedLicense.status} />
              </div>
              <Select
                value={selectedLicense.status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                disabled={updatingStatus}
                className="py-1 px-2 text-xs"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
              </Select>
            </div>
          </div>
        )}
      </Modal>

      {/* Create License Modal */}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="New Patent Licensing Contract">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="License Title"
            placeholder="e.g. Edge Scheduler Tech Transfer"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Input
            label="Licensee Partner Organization"
            placeholder="e.g. Apple Inc."
            value={form.licensee_name}
            onChange={(e) => setForm({ ...form, licensee_name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Royalty Rate (%)"
              type="number"
              step="0.01"
              value={form.royalty_rate}
              onChange={(e) => setForm({ ...form, royalty_rate: e.target.value })}
              required
            />
            <Input
              label="YTD Revenue (USD)"
              type="number"
              value={form.revenue_ytd}
              onChange={(e) => setForm({ ...form, revenue_ytd: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              required
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
            </Select>
            <Input
              label="Signing Date"
              type="date"
              value={form.signing_date}
              onChange={(e) => setForm({ ...form, signing_date: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full" loading={submitting}>Log License</Button>
        </form>
      </Modal>
    </>
  )
}
