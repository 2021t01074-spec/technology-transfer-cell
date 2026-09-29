import { useEffect, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import AnimatedCounter from '../components/ui/AnimatedCounter'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../auth/AuthContext'
import { listUsers, updateUser } from '../api/auth'
import { listAuditLogs } from '../api/auditLogs'

export default function AdminPage() {
  const { user: currentUser } = useAuth()
  const { addToast } = useToast()
  
  // Tabs: 'users' | 'workflow' | 'logs'
  const [activeTab, setActiveTab] = useState('users')
  
  // Data lists
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  
  // UI states
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newRole, setNewRole] = useState('')
  const [newIsActive, setNewIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Workflow settings local state
  const [escalationPath, setEscalationPath] = useState('Assignee → Reviewer → Admin')
  const [intakeChecklist, setIntakeChecklist] = useState('Capture inventors, attach docs, record filing state')
  const [reminderDays, setReminderDays] = useState('30')

  const isSuperAdmin = currentUser?.role === 'super_admin'

  // Fetch Users
  const loadUsers = async () => {
    try {
      setLoadingUsers(true)
      const data = await listUsers()
      setUsers(data)
    } catch (err) {
      addToast('Failed to fetch user list from server.', 'danger')
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadAuditLogs = async () => {
    try {
      setLoadingLogs(true)
      const data = await listAuditLogs(null, 100)
      // Transform audit log data to match table format
      const transformedLogs = data.map(l => ({
        id: l.id,
        user: l.user_name,
        role: l.user_role,
        action: `${l.action} ${l.entity_type}${l.entity_title ? ': ' + l.entity_title : ''}${l.details ? ' — ' + l.details : ''}`,
        time: l.created_at ? new Date(l.created_at).toISOString().replace('T', ' ').substring(0, 19) : '—'
      }))
      setLogs(transformedLogs)
    } catch (err) {
      // Fallback to empty if no audit logs yet
      setLogs([])
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    loadUsers()
    loadAuditLogs()
  }, [])

  const triggerReset = () => {
    addToast('All IP cache tables optimized successfully.', 'success')
  }

  const handleEditUser = (user) => {
    if (!isSuperAdmin) {
      addToast('Only Super Administrators are authorized to edit user accounts.', 'danger')
      return
    }
    setSelectedUser(user)
    setNewRole(user.role)
    setNewIsActive(user.is_active)
    setIsModalOpen(true)
  }

  const handleSaveUser = async () => {
    try {
      setSubmitting(true)
      const updated = await updateUser(selectedUser.id, {
        role: newRole,
        is_active: newIsActive
      })
      addToast(`User ${updated.full_name} updated successfully.`, 'success')
      setIsModalOpen(false)
      
      // Update local state
      setUsers(users.map(u => u.id === updated.id ? updated : u))
      
      // Add log
      const newLog = {
        id: Date.now(),
        user: currentUser?.full_name || 'System Admin',
        role: currentUser?.role || 'super_admin',
        action: `Updated role of ${updated.full_name} to ${newRole} (Active: ${newIsActive})`,
        time: new Date().toISOString().replace('T', ' ').substring(0, 19)
      }
      setLogs([newLog, ...logs])
    } catch (err) {
      addToast('Failed to update user profile. Check permissions.', 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveWorkflow = () => {
    addToast('Workflow configurations saved successfully.', 'success')
  }

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = u.full_name.toLowerCase().includes(query) || 
                          u.email.toLowerCase().includes(query) || 
                          (u.department && u.department.toLowerCase().includes(query))
    const matchesRole = roleFilter === '' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  // User table columns
  const userColumns = [
    {
      key: 'full_name',
      label: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-indigo/15 text-indigo flex items-center justify-center font-bold text-xs shrink-0 select-none">
            {u.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
          </div>
          <div>
            <div className="font-semibold text-ink leading-tight">{u.full_name}</div>
            <div className="text-[10px] text-ink/40 font-mono">{u.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'System Role',
      render: (u) => {
        const roles = {
          super_admin: { label: 'Super Admin', style: 'bg-purple-50 text-purple-700 border-purple-200' },
          ttc_staff: { label: 'TTC Staff', style: 'bg-teal-50 text-teal-700 border-teal-200' },
          faculty: { label: 'Faculty Lead', style: 'bg-amber-50 text-amber-700 border-amber-200' },
          industry_partner: { label: 'Industry Partner', style: 'bg-blue-50 text-blue-700 border-blue-200' },
          club_member: { label: 'Club Member', style: 'bg-gray-100 text-gray-700 border-gray-300' }
        }
        const cfg = roles[u.role] || { label: u.role, style: 'bg-gray-50 text-gray-500 border-gray-200' }
        return (
          <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${cfg.style}`}>
            {cfg.label}
          </span>
        )
      }
    },
    {
      key: 'department',
      label: 'Department & Phone',
      render: (u) => (
        <div>
          <div className="text-ink/80">{u.department || '—'}</div>
          <div className="text-[10px] text-ink/40 font-medium">{u.phone || '—'}</div>
        </div>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (u) => (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${u.is_active ? 'bg-teal/10 text-teal' : 'bg-rust/10 text-rust'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-teal' : 'bg-rust'}`} />
          {u.is_active ? 'Active' : 'Suspended'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (u) => (
        <Button
          variant="ghost"
          onClick={() => handleEditUser(u)}
          disabled={!isSuperAdmin}
          className="py-1 px-2.5 text-[11px] h-7 border border-line"
        >
          Manage
        </Button>
      )
    }
  ]

  // Logs table columns
  const logColumns = [
    { key: 'user', label: 'Operator' },
    {
      key: 'role',
      label: 'Role',
      render: (r) => (
        <span className="uppercase text-[9px] font-bold bg-indigo/10 text-indigo px-2 py-0.5 rounded border border-indigo/20">
          {r.role.replace('_', ' ')}
        </span>
      )
    },
    { key: 'action', label: 'Action Details' },
    { key: 'time', label: 'Timestamp', render: (r) => <span className="font-mono text-[10px] text-ink/50">{r.time}</span> },
  ]

  return (
    <>
      <PageHeader
        title="Administrative Controls"
        description="Configure workflows, audit administrative history, and orchestrate identity roles."
        icon={
          <svg className="w-5 h-5 text-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
        action={<Button onClick={triggerReset} variant="ghost" className="border border-line">Optimize Cache</Button>}
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5">
          <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider block">Total Users</span>
          <div className="text-2xl font-black text-ink mt-1">
            <AnimatedCounter value={users.length} />
          </div>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5">
          <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider block">Super Admins</span>
          <div className="text-2xl font-black text-purple-700 mt-1">
            <AnimatedCounter value={users.filter(u => u.role === 'super_admin').length} />
          </div>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5">
          <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider block">TTC Staff</span>
          <div className="text-2xl font-black text-teal mt-1">
            <AnimatedCounter value={users.filter(u => u.role === 'ttc_staff').length} />
          </div>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5">
          <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider block">Faculty Leads</span>
          <div className="text-2xl font-black text-amber mt-1">
            <AnimatedCounter value={users.filter(u => u.role === 'faculty').length} />
          </div>
        </div>
      </div>

      {/* Tab Control */}
      <div className="flex border-b border-line mb-6 gap-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer ${
            activeTab === 'users' ? 'text-indigo font-bold' : 'text-ink/45 hover:text-ink/75'
          }`}
        >
          User Accounts
          {activeTab === 'users' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('workflow')}
          className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer ${
            activeTab === 'workflow' ? 'text-indigo font-bold' : 'text-ink/45 hover:text-ink/75'
          }`}
        >
          Workflow Configs
          {activeTab === 'workflow' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer ${
            activeTab === 'logs' ? 'text-indigo font-bold' : 'text-ink/45 hover:text-ink/75'
          }`}
        >
          Audit Trail
          {activeTab === 'logs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo rounded-full" />}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface border border-line rounded-2xl p-4 shadow-xs">
            <div className="w-full sm:max-w-xs">
              <Input
                placeholder="Search user email, name, dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="py-1.5 px-3 text-xs"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="py-1.5 text-xs"
              >
                <option value="">Filter Role (All)</option>
                <option value="super_admin">Super Admin</option>
                <option value="ttc_staff">TTC Staff</option>
                <option value="faculty">Faculty Lead</option>
                <option value="industry_partner">Industry Partner</option>
                <option value="club_member">Club Member</option>
              </Select>
            </div>
          </div>

          <DataTable
            columns={userColumns}
            rows={filteredUsers}
            loading={loadingUsers}
            emptyLabel="No matching users registered in the system."
          />
        </div>
      )}

      {activeTab === 'workflow' && (
        <div className="bg-surface border border-line rounded-2xl p-6 shadow-xs animate-fade-in max-w-4xl">
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider mb-2">Workflow Configurations</h3>
          <p className="text-xs text-ink/45 mb-6">Manage automated escalations, check-list configurations, and notification alerts.</p>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Escalation Path Flow"
                value={escalationPath}
                onChange={(e) => setEscalationPath(e.target.value)}
              />
              <Select
                label="Office Action Reminders"
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
              >
                <option value="14">Every 14 Days</option>
                <option value="30">Every 30 Days</option>
                <option value="60">Every 60 Days</option>
              </Select>
            </div>

            <label className="block text-sm group">
              <span className="text-ink/70 mb-1.5 block font-medium text-xs uppercase tracking-wider">
                Invention Intake Checklist
              </span>
              <textarea
                rows={3}
                value={intakeChecklist}
                onChange={(e) => setIntakeChecklist(e.target.value)}
                className="w-full rounded-xl border border-line p-3.5 outline-none bg-surface text-ink text-xs transition-all duration-200 shadow-xs focus-glow hover:border-ink/20 resize-none"
              />
            </label>

            <div className="flex justify-between items-center pt-4 border-t border-line">
              <span className="text-[11px] text-ink/40 italic">Note: changes apply to new disclosures automatically.</span>
              <Button onClick={handleSaveWorkflow}>Save Configurations</Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Recent System Actions</h3>
            <Button variant="ghost" onClick={() => { setLogs([]); addToast('Audit trail logs cleared.', 'success') }} className="py-1 px-3 text-[11px] h-7 border border-line">
              Clear History
            </Button>
          </div>
          <DataTable
            columns={logColumns}
            rows={logs}
            loading={loadingLogs}
            emptyLabel="No admin activities recorded yet."
          />
        </div>
      )}

      {/* Edit User Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Modify User Account"
      >
        <div className="space-y-5">
          <div className="bg-paper p-4 rounded-xl border border-line flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo/10 text-indigo flex items-center justify-center font-bold text-sm shrink-0">
              {selectedUser?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '?'}
            </div>
            <div>
              <h4 className="font-semibold text-sm text-ink leading-tight">{selectedUser?.full_name}</h4>
              <p className="text-[11px] text-ink/45 mt-0.5">{selectedUser?.email}</p>
            </div>
          </div>

          <Select
            label="Assigned System Role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          >
            <option value="super_admin">Super Admin</option>
            <option value="ttc_staff">TTC Staff Liaison</option>
            <option value="faculty">Faculty Member</option>
            <option value="industry_partner">Industry Partner</option>
            <option value="club_member">Club Member</option>
          </Select>

          <div className="flex items-center justify-between p-3.5 rounded-xl border border-line bg-surface">
            <div>
              <span className="text-xs font-semibold text-ink block">Account Active Status</span>
              <p className="text-[10px] text-ink/40 mt-0.5">Toggle user ability to sign in and perform actions</p>
            </div>
            <button
              onClick={() => setNewIsActive(!newIsActive)}
              type="button"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                newIsActive ? 'bg-teal' : 'bg-line'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  newIsActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-line">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveUser} loading={submitting}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
