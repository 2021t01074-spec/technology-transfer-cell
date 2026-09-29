import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../ui/Toast'
import { listPatents } from '../../api/patents'
import { listDisclosures } from '../../api/disclosures'
import { listDeadlines } from '../../api/deadlines'
import { listLicenses } from '../../api/licenses'
import uorLogo from '../../assets/uor-logo.png'

const TABS = [
  { to: '/', label: 'Dashboard' },
  { to: '/disclosures', label: 'Patent Disclosures' },
  { to: '/patents', label: 'Patents' },
  { to: '/prosecution', label: 'Prosecution' },
  { to: '/deadlines', label: 'Deadlines' },
  { to: '/licenses', label: 'Licenses' },
  { to: '/projects', label: 'Projects' },
  { to: '/agreements', label: 'Agreements' },
  { to: '/mous', label: 'MOUs' },
  { to: '/documents', label: 'Documents' },
  { to: '/noticeboard', label: 'Noticeboard' },
  { to: '/innovation-club/applications', label: 'Innovation Club applications', roles: ['super_admin', 'ttc_staff'] },
  { to: '/ipr-violations', label: 'IPR Violations', roles: ['super_admin', 'ttc_staff'] },
  { to: '/reports', label: 'Reports' },
  { to: '/admin', label: 'Admin', roles: ['super_admin', 'ttc_staff'] },
]

import React from 'react'

const NAV_GROUPS = [
  {
    id: 'ip',
    label: 'Intellectual Property',
    items: [
      {
        to: '/disclosures', label: 'Patent Disclosures', desc: 'Patent invention submissions & drafts', icon: (
          <svg className="w-4 h-4 text-[#38BDF8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
      },
      {
        to: '/patents', label: 'Patents', desc: 'Filed and granted patents registry', icon: (
          <svg className="w-4 h-4 text-[#34D399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )
      },
      {
        to: '/prosecution', label: 'Prosecution', desc: 'Application legal filings & actions', icon: (
          <svg className="w-4 h-4 text-[#A78BFA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2z" />
          </svg>
        )
      },
      {
        to: '/deadlines', label: 'Deadlines', desc: 'Due dates & response compliance', icon: (
          <svg className="w-4 h-4 text-[#FB7185]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      {
        to: '/licenses', label: 'Licenses', desc: 'Licensing agreements & royalties', icon: (
          <svg className="w-4 h-4 text-[#FBBF24]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      }
    ]
  },
  {
    id: 'industry',
    label: 'Industry',
    items: [
      {
        to: '/projects', label: 'Projects', desc: 'Sponsored research & collaborations', icon: (
          <svg className="w-4 h-4 text-[#C084FC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )
      },
      {
        to: '/agreements', label: 'Agreements', desc: 'Tech transfer & IP contracts', icon: (
          <svg className="w-4 h-4 text-[#60A5FA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      },
      {
        to: '/mous', label: 'MOUs', desc: 'Memorandums of Understanding', icon: (
          <svg className="w-4 h-4 text-[#2DD4BF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        )
      }
    ]
  },
  {
    id: 'resources',
    label: 'Resources',
    items: [
      {
        to: '/documents', label: 'Documents', desc: 'General files, folders & attachments', icon: (
          <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        )
      },
      {
        to: '/noticeboard', label: 'Noticeboard', desc: 'Portal news & cell announcements', icon: (
          <svg className="w-4 h-4 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )
      },
      {
        to: '/innovation-club/applications', label: 'Innovation Club', desc: 'Cell student registrations', roles: ['super_admin', 'ttc_staff'], icon: (
          <svg className="w-4 h-4 text-[#34D399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
      },
      {
        to: '/ipr-violations', label: 'IPR Violations', desc: 'Case legal violations registry', roles: ['super_admin', 'ttc_staff'], icon: (
          <svg className="w-4 h-4 text-[#FB7185]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )
      }
    ]
  }
]

const WORKSPACES = [
  { id: 'central', name: 'TTC Central' },
  { id: 'civil', name: 'Civil & Environmental' },
  { id: 'electrical', name: 'Electrical & Info' },
  { id: 'marine', name: 'Marine & Naval' },
  { id: 'mechanical', name: 'Mechanical & Mfg' },
  { id: 'computer', name: 'Computer Eng.' }
]

export default function AppShell() {
  const { user, logout } = useAuth()
  const { addToast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [transitionKey, setTransitionKey] = useState(location.pathname)

  // Dropdown states & refs
  const [currentWorkspace, setCurrentWorkspace] = useState('TTC Central')
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const dropdownRef = useRef(null)

  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationsRef = useRef(null)

  const [helpOpen, setHelpOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isGroupActive = (group) => {
    return group.items.some((item) => {
      if (item.to === '/') return location.pathname === '/'
      return location.pathname === item.to || location.pathname.startsWith(item.to + '/')
    })
  }

  // Notification items list
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Respond to office action for PAT-8841 due today.', time: '1 hr ago', read: false, route: '/patents' },
    { id: 2, text: 'New disclosure DISC-1024 submitted by Dr. John Doe.', time: '2 hrs ago', read: false, route: '/disclosures' },
    { id: 3, text: 'SLA Escalation threshold alert triggered on deadlines.', time: '4 hrs ago', read: true, route: '/deadlines' }
  ])

  // Global Command Search States
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [rawItems, setRawItems] = useState([])
  const searchInputRef = useRef(null)

  useEffect(() => {
    setTransitionKey(location.pathname)
  }, [location.pathname])

  // Click outside listener for switcher dropdown & notifications
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setWorkspaceOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcut listener for global search (Cmd+K, Ctrl+K, Escape)
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setHelpOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Auto-focus search input when palette opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
      loadGlobalSearchData()
    } else {
      setSearchQuery('')
      setResults([])
      setActiveIndex(0)
    }
  }, [searchOpen])

  // Load all indexable items for global search
  async function loadGlobalSearchData() {
    try {
      const [patents, disclosures, deadlines, licenses] = await Promise.all([
        listPatents().catch(() => []),
        listDisclosures().catch(() => []),
        listDeadlines().catch(() => []),
        listLicenses().catch(() => [])
      ])

      const combined = [
        ...patents.map((p) => ({
          id: p.id,
          title: p.title,
          category: 'Patents',
          subtitle: `Attorney: ${p.attorney || '—'} · Status: ${p.status}`,
          route: '/patents'
        })),
        ...disclosures.map((d) => ({
          id: d.id,
          title: d.title,
          category: 'Disclosures',
          subtitle: `Inventor: ${d.inventor_names || '—'} · Dept: ${d.department}`,
          route: '/disclosures'
        })),
        ...deadlines.map((dl) => ({
          id: dl.id,
          title: dl.title,
          category: 'Deadlines',
          subtitle: `Due: ${dl.due_date} · Severity: ${dl.severity}`,
          route: '/deadlines'
        })),
        ...licenses.map((l) => ({
          id: l.id,
          title: l.title,
          category: 'Licenses',
          subtitle: `Licensee: ${l.licensee} · Revenue YTD: Rs. ${l.revenue_ytd?.toLocaleString() || 0}`,
          route: '/licenses'
        })),
        // Add navigation links as search items
        ...TABS.map((tab) => ({
          id: `nav-${tab.label}`,
          title: `Navigate to ${tab.label}`,
          category: 'App Navigation',
          subtitle: `Go directly to the ${tab.label} page`,
          route: tab.to
        }))
      ]

      setRawItems(combined)
    } catch (err) {
      console.error(err)
    }
  }

  // Filter items in search input
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }
    const q = searchQuery.toLowerCase()
    const filtered = rawItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    )
    setResults(filtered)
    setActiveIndex(0)
  }, [searchQuery, rawItems])

  // Keyboard navigation inside search palette
  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[activeIndex]) {
        handleSearchResultClick(results[activeIndex])
      }
    }
  }

  const handleSearchResultClick = (item) => {
    setSearchOpen(false)
    navigate(item.route)
    addToast(`Navigating to result: ${item.title}`, 'success')
  }

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'IP'

  const segments = location.pathname.split('/').filter(Boolean)
  const getBreadcrumbName = (seg) => {
    if (!isNaN(seg)) return `#${seg}`
    return seg.charAt(0).toUpperCase() + seg.slice(1)
  }

  const handleWorkspaceSelect = (name) => {
    setCurrentWorkspace(name)
    setWorkspaceOpen(false)
    addToast(`Switched active workspace to: ${name}`, 'success')
  }

  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
    addToast('All notifications marked as read', 'success')
  }

  const handleNotificationClick = (n) => {
    setNotifications(notifications.map(item => item.id === n.id ? { ...item, read: true } : item))
    setNotificationsOpen(false)
    navigate(n.route)
  }

  const hasUnread = notifications.some(n => !n.read)

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7]/40 relative overflow-x-hidden">
      {/* Dynamic Animated Ambient Mesh Glow Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-8%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-[#0071E3]/7 via-transparent to-transparent blur-[130px] animate-float" style={{ animationDuration: '18s' }} />
        <div className="absolute bottom-[-10%] right-[-8%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-[#34C759]/5 via-transparent to-transparent blur-[130px] animate-float" style={{ animationDuration: '22s', animationDelay: '3s' }} />
        <div className="absolute top-[35%] right-[18%] w-[35%] h-[35%] rounded-full bg-gradient-to-br from-[#FF9500]/3.5 via-transparent to-transparent blur-[110px] animate-float" style={{ animationDuration: '20s', animationDelay: '6s' }} />
      </div>

      {/* Decorative Shimmer Glow Line at the Top */}
      <div className="header-glow-line fixed top-0 left-0 right-0 z-55 pointer-events-none" />

      {/* Premium Apple Header Bar (Dark Slate Glass Theme) */}
      <header className="sticky top-0 z-50 bg-[#1D1D1F]/90 backdrop-blur-xl border-b border-white/10 px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4 shadow-lg select-none text-white">
        <div className="flex items-center gap-4 lg:gap-6">
          {/* Hamburger Menu Button (Mobile) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 outline-none focus:outline-none"
            aria-label="Open Navigation Menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Interactive Workspace Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
              className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 bg-white/10 hover:bg-white/15 transition-all duration-200 cursor-pointer select-none group border border-white/5 active:scale-[0.98] outline-none"
            >
              <img src={uorLogo} alt="University of Ruhuna" className="w-5 h-5 rounded object-contain shrink-0" />
              <span className="text-[13.5px] font-bold text-white tracking-tight">
                {currentWorkspace}
              </span>
              <svg
                className={`w-3 h-3 text-white/70 shrink-0 group-hover:text-white transition-all duration-200 ${workspaceOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Switcher Dropdown Menu */}
            {workspaceOpen && (
              <div className="absolute top-10 left-0 mt-1.5 w-60 bg-[#1D1D1F]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg p-1.5 z-50 animate-scale-in">
                <div className="px-2.5 py-1 text-[9px] font-bold text-white/50 uppercase tracking-wider">
                  Select Workspace Portal
                </div>
                <div className="h-px bg-white/10 my-1" />
                <div className="space-y-0.5">
                  {WORKSPACES.map((ws) => {
                    const isSelected = currentWorkspace === ws.name
                    return (
                      <div
                        key={ws.id}
                        onClick={() => handleWorkspaceSelect(ws.name)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer transition-colors ${isSelected
                          ? 'bg-white/10 text-white font-semibold'
                          : 'text-white/80 hover:bg-white/5 hover:text-white'
                          }`}
                      >
                        <span className="truncate">{ws.name}</span>
                        {isSelected && (
                          <svg className="w-3.5 h-3.5 text-[#0071E3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Premium Grouped Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Dashboard Link */}
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200 cursor-pointer ${isActive
                  ? 'bg-white/15 text-white font-bold'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              Dashboard
            </NavLink>

            {/* Dropdowns */}
            {NAV_GROUPS.map((group) => {
              const isGroupOpen = activeDropdown === group.id
              const isActive = isGroupActive(group)
              const allowedItems = group.items.filter(item => !item.roles || item.roles.includes(user?.role))
              if (allowedItems.length === 0) return null

              return (
                <div
                  key={group.id}
                  className="relative py-2"
                  onMouseEnter={() => setActiveDropdown(group.id)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200 cursor-pointer outline-none focus:outline-none ${isActive
                        ? 'bg-white/15 text-white font-bold'
                        : isGroupOpen
                          ? 'bg-white/10 text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    <span>{group.label}</span>
                    <svg
                      className={`w-3 h-3 text-current transition-transform duration-200 ${isGroupOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu Box */}
                  {isGroupOpen && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-10.5 w-80 rounded-2xl bg-[#1D1D1F]/95 backdrop-blur-xl border border-white/10 p-2 z-50 animate-dropdown-enter shadow-2xl">
                      <div className="space-y-0.5">
                        {allowedItems.map((item) => {
                          const isItemActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                          return (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              onClick={() => setActiveDropdown(null)}
                              className={`flex items-start gap-3 p-2.5 rounded-xl transition-all duration-150 ${isItemActive
                                  ? 'bg-white/15 text-white'
                                  : 'text-white/80 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                              <div className={`p-2 rounded-lg shrink-0 ${isItemActive ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                                }`}>
                                {item.icon}
                              </div>
                              <div className="min-w-0 flex-1 text-left">
                                <p className={`text-[13px] font-semibold ${isItemActive ? 'text-white font-bold' : 'text-white/90'}`}>
                                  {item.label}
                                </p>
                                <p className="text-[11px] text-white/50 leading-normal mt-0.5 font-medium">
                                  {item.desc}
                                </p>
                              </div>
                            </NavLink>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Reports Link */}
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200 cursor-pointer ${isActive
                  ? 'bg-white/15 text-white font-bold'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              Reports
            </NavLink>

            {/* Admin Link (Authorized Roles Only) */}
            {(user?.role === 'super_admin' || user?.role === 'ttc_staff') && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200 cursor-pointer ${isActive
                    ? 'bg-white/15 text-white font-bold'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                Admin
              </NavLink>
            )}
          </nav>
        </div>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-3 lg:gap-5">
          {/* Active Global Search Bar Trigger */}
          <div
            onClick={() => setSearchOpen(true)}
            className="relative max-w-[180px] w-36 hidden lg:block cursor-pointer select-none group animate-fade-in outline-none"
          >
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <div className="w-full rounded-lg bg-white/10 hover:bg-white/15 border border-transparent pl-8.5 pr-10 py-1.5 text-xs text-white/60 transition-colors shadow-3xs flex items-center justify-between">
              <span>Search...</span>
            </div>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-white/50 bg-white/10 border border-white/5 rounded-md px-1.5 py-0.5 leading-none shadow-3xs">
              ⌘K
            </span>
          </div>

          {/* Help Center Button */}
          <button
            onClick={() => setHelpOpen(true)}
            className="p-2 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-colors shrink-0 cursor-pointer active:scale-95 outline-none focus:outline-none"
            title="Help Support"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Notifications Button & Dropdown menu */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-colors shrink-0 cursor-pointer active:scale-95 outline-none focus:outline-none"
              title="Notifications"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF3B30] rounded-full border border-[#1D1D1F]" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute top-10 right-0 mt-1.5 w-80 bg-[#1D1D1F]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg p-2.5 z-50 animate-scale-in">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Alert Center</span>
                  {hasUnread && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[10px] font-bold text-[#0071E3] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="h-px bg-white/10 my-2" />
                <div className="max-h-60 overflow-y-auto space-y-1 scrollbar pr-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-2 rounded-lg cursor-pointer transition-colors relative border border-transparent ${n.read ? 'text-white/50 hover:bg-white/5' : 'bg-white/5 text-white hover:border-white/10 font-semibold'
                        }`}
                    >
                      <div className="flex items-start gap-2 pr-4">
                        {!n.read && (
                          <span className="w-1.5 h-1.5 bg-[#0071E3] rounded-full mt-1.5 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs leading-normal break-words">{n.text}</p>
                          <span className="text-[9px] text-white/40 font-bold block mt-1">{n.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-white/15 shrink-0" />

          {/* Profile Card Section */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* User Initials Avatar with smooth macOS color gradient */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0088FF] to-[#0071E3] flex items-center justify-center text-white text-xs font-bold shadow-md select-none shrink-0 border border-[#006CD7]">
              {initials}
            </div>

            {/* User Details label */}
            <div className="hidden md:block leading-none text-left shrink-0">
              <p className="text-[13.5px] font-bold text-white tracking-tight">{user?.full_name || 'User'}</p>
              <p className="text-[10px] text-white/55 font-bold uppercase tracking-wider mt-1">{user?.role?.replaceAll('_', ' ') || 'IP Manager'}</p>
            </div>

            {/* Logout Icon Button */}
            <button
              onClick={logout}
              className="hidden md:block text-white/70 hover:text-[#FF3B30] p-1.5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors active:scale-95 shrink-0 outline-none focus:outline-none"
              title="Sign Out"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Subheader & Breadcrumbs */}
      <div className="bg-[#FFFFFF]/25 backdrop-blur-md border-b border-[#E5E5E7]/55 px-6 py-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-[#86868B] select-none z-10">
        <NavLink to="/" className="hover:text-[#1D1D1F] transition-colors">Home</NavLink>
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-[#C7C7CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className={i === segments.length - 1 ? "text-[#1D1D1F] font-bold" : "hover:text-[#1D1D1F] transition-colors"}>
              {getBreadcrumbName(seg)}
            </span>
          </span>
        ))}
      </div>

      {/* Primary Page Canvas */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full z-30 relative">
        <div key={transitionKey} className="page-transition">
          <Outlet />
        </div>
      </main>

      {/* Modern Premium Footer */}
      <footer className="w-full bg-[#FFFFFF]/60 backdrop-blur-xl border-t border-[#E5E5E7]/55 py-8 px-6 mt-auto relative z-0 select-none">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <img src={uorLogo} alt="University of Ruhuna" className="w-6 h-6 rounded object-contain shrink-0" />
              <span className="text-xs font-extrabold text-[#1D1D1F] uppercase tracking-wider">TTC-MS Portal</span>
            </div>
            <p className="text-[11px] text-[#86868B] leading-relaxed">
              Technology Transfer Cell Management System. Empowering university research, innovations, intellectual property rights (IPR), and industry-sponsored collaborations.
            </p>
          </div>

          {/* Quick Links 1 */}
          <div>
            <h4 className="text-[10px] font-bold text-[#1D1D1F] uppercase tracking-wider mb-3">IP Portfolio</h4>
            <ul className="space-y-2 text-[11px] text-[#86868B] font-medium">
              <li><NavLink to="/disclosures" className="hover:text-[#0071E3] transition-colors">Invention Disclosures</NavLink></li>
              <li><NavLink to="/patents" className="hover:text-[#0071E3] transition-colors">Patents & Filings</NavLink></li>
              <li><NavLink to="/deadlines" className="hover:text-[#0071E3] transition-colors">Critical Deadlines</NavLink></li>
              <li><NavLink to="/licenses" className="hover:text-[#0071E3] transition-colors">Licensing & Revenue</NavLink></li>
            </ul>
          </div>

          {/* Quick Links 2 */}
          <div>
            <h4 className="text-[10px] font-bold text-[#1D1D1F] uppercase tracking-wider mb-3">Industry Hub</h4>
            <ul className="space-y-2 text-[11px] text-[#86868B] font-medium">
              <li><NavLink to="/projects" className="hover:text-[#0071E3] transition-colors">Industry Projects</NavLink></li>
              <li><NavLink to="/agreements" className="hover:text-[#0071E3] transition-colors">Agreements & MOUs</NavLink></li>
              <li><NavLink to="/noticeboard" className="hover:text-[#0071E3] transition-colors">Cell Noticeboard</NavLink></li>
              <li><button onClick={() => setHelpOpen(true)} className="hover:text-[#0071E3] transition-colors cursor-pointer outline-none text-left bg-transparent border-none p-0 text-inherit font-inherit">Support Desk</button></li>
            </ul>
          </div>

          {/* Contacts / Info */}
          <div className="space-y-2 text-[11px] text-[#86868B]">
            <h4 className="text-[10px] font-bold text-[#1D1D1F] uppercase tracking-wider mb-3">Contact Support</h4>
            <p>Technology Transfer Cell (TTC)</p>
            <p>University of Ruhuna, Sri Lanka</p>
            <p className="pt-1">Email: <a href="mailto:ttc-support@university.ac.lk" className="text-[#0071E3] hover:underline font-semibold">ttc-support@university.ac.lk</a></p>
            <p>Tel: +94 (11) 234-5678 (Ext 400)</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto h-px bg-[#E5E5E7]/55 my-6" />

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-[#86868B] font-semibold">
          <span>© {new Date().getFullYear()} Technology Transfer Cell, University of Ruhuna. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-[#1D1D1F] transition-colors">Security & Privacy</a>
            <a href="#" className="hover:text-[#1D1D1F] transition-colors">Terms of Portal Use</a>
            <a href="#" className="hover:text-[#1D1D1F] transition-colors">Matara, Sri Lanka</a>
          </div>
        </div>
      </footer>

      {/* Apple Spotlight Style Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-[#1D1D1F]/20 backdrop-blur-md flex items-start justify-center pt-[12vh] p-4 modal-backdrop" onClick={() => setSearchOpen(false)}>
          <div
            className="w-full max-w-xl bg-white/95 backdrop-blur-xl border border-[#E5E5E7]/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[500px] modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input Wrapper */}
            <div className="relative flex items-center border-b border-[#E5E5E7]">
              <svg className="absolute left-4 w-4.5 h-4.5 text-[#86868B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search anything... (patents, disclosures, licenses, navigation)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-11 pr-16 py-4 text-sm text-[#1D1D1F] placeholder-[#86868B] bg-transparent outline-none border-none"
              />
              <span className="absolute right-4 text-[9px] font-bold text-[#86868B] bg-[#F5F5F7] border border-[#D2D2D7]/60 rounded px-1.5 py-0.5 shadow-3xs select-none">
                ESC
              </span>
            </div>

            {/* Results Scrollbox */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar">
              {results.length > 0 ? (
                <div className="space-y-0.5">
                  {results.map((item, index) => {
                    const isFocused = index === activeIndex
                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => handleSearchResultClick(item)}
                        className={`px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${isFocused ? 'bg-[#0071E3] text-white shadow-md shadow-[#0071E3]/20' : 'hover:bg-[#F5F5F7]'
                          }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isFocused
                              ? 'bg-white/20 text-white'
                              : 'bg-[#E8E8ED] text-[#86868B]'
                              }`}>
                              {item.category}
                            </span>
                            <span className={`text-xs font-semibold truncate ${isFocused ? 'text-white' : 'text-[#1D1D1F]'
                              }`}>
                              {item.title}
                            </span>
                          </div>
                          {item.subtitle && (
                            <p className={`text-[10px] mt-0.5 truncate ${isFocused ? 'text-white/80' : 'text-[#86868B]'
                              }`}>
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                        {isFocused && (
                          <svg className="w-4 h-4 text-white shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : searchQuery.trim() ? (
                <div className="text-center py-8 text-xs text-[#86868B] font-semibold">
                  No matching search results found.
                </div>
              ) : (
                <div className="space-y-3 p-2 select-none animate-fade-in">
                  <div>
                    <h4 className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-2">Popular Searches</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Patent Spec', 'Office Action', 'Renewals', 'Licensing Agreements'].map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setSearchQuery(tag)}
                          className="text-[11px] font-medium text-[#1D1D1F] bg-[#F5F5F7] border border-[#D2D2D7]/40 hover:bg-[#E8E8ED] px-3 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-px bg-[#E5E5E7] my-3" />
                  <div>
                    <h4 className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-2">Search Tips</h4>
                    <ul className="text-[11px] text-[#86868B] space-y-1.5 list-disc list-inside">
                      <li>Use <kbd className="bg-[#F5F5F7] border border-[#D2D2D7]/60 px-1 py-0.5 rounded text-[10px] font-bold text-ink">↑</kbd> and <kbd className="bg-[#F5F5F7] border border-[#D2D2D7]/60 px-1 py-0.5 rounded text-[10px] font-bold text-ink">↓</kbd> arrows to navigate list items.</li>
                      <li>Press <kbd className="bg-[#F5F5F7] border border-[#D2D2D7]/60 px-1 py-0.5 rounded text-[10px] font-bold text-ink">Enter</kbd> to execute selection immediately.</li>
                      <li>Use search queries like <code className="bg-[#F5F5F7] px-1 py-0.5 rounded text-[10px] font-mono">filed</code> or <code className="bg-[#F5F5F7] px-1 py-0.5 rounded text-[10px] font-mono">attorney</code>.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Apple Spotlight Style Help & Support Dialog */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 bg-[#1D1D1F]/20 backdrop-blur-md flex items-center justify-center p-4 modal-backdrop" onClick={() => setHelpOpen(false)}>
          <div
            className="w-full max-w-md bg-white border border-[#E5E5E7] rounded-2xl shadow-2xl overflow-hidden flex flex-col modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#E5E5E7] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#0071E3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-bold text-[#1D1D1F]">TTC-IPMS Support Center</h3>
              </div>
              <button
                onClick={() => setHelpOpen(false)}
                className="text-[#86868B] hover:text-[#1D1D1F] text-xs font-semibold hover:bg-[#F5F5F7] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-[#1D1D1F] mb-1">How do I submit an invention disclosure?</h4>
                <p className="text-[#86868B] leading-relaxed">
                  Go to the **Disclosures** tab, click **"+ Submit Disclosure"** on the right side, choose your academic department, list all co-inventors, enter the abstract summary, and submit.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#1D1D1F] mb-1">What is the "Approve & Promote" workflow?</h4>
                <p className="text-[#86868B] leading-relaxed">
                  TTC staff can open any disclosure record under review and click the blue "Approve & Promote" button. This automatically registers it in the **Patents** registry, starting the legal drafting phase.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#1D1D1F] mb-1">Contact Technology Transfer Office</h4>
                <div className="bg-[#F5F5F7] border border-[#D2D2D7]/55 p-3 rounded-xl mt-2 space-y-1 text-[#86868B]">
                  <p className="font-semibold text-[#1D1D1F]">TTC Central Helpdesk</p>
                  <p>Email: <a href="mailto:ttc-support@university.edu" className="text-[#0071E3] hover:underline">ttc-support@university.edu</a></p>
                  <p>Phone: +94 (11) 234-5678 (Ext 400)</p>
                  <p>Hours: Mon–Fri, 9:00 AM – 5:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-100 lg:hidden" role="dialog" aria-modal="true">
          {/* Backdrop blur overlay */}
          <div
            className="fixed inset-0 bg-[#1D1D1F]/30 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sliding panel */}
          <div className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white border-l border-[#E5E5E7] p-5 flex flex-col justify-between shadow-2xl animate-drawer-slide-in z-50">
            <div>
              {/* Drawer header */}
              <div className="flex items-center justify-between border-b border-[#E5E5E7]/55 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#0088FF] to-[#0071E3] flex items-center justify-center text-white shrink-0 shadow-sm shadow-[#0071E3]/15">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-xs font-extrabold text-[#1D1D1F] tracking-tight">TTC Portal Menu</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 hover:bg-[#E8E8ED]/50 text-[#86868B] hover:text-[#1D1D1F] rounded-lg transition-colors cursor-pointer active:scale-95 outline-none focus:outline-none"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Drawer navigation links */}
              <nav className="space-y-4 overflow-y-auto max-h-[70vh] pr-1 scrollbar">
                {/* Dashboard */}
                <NavLink
                  to="/"
                  end
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive
                      ? 'bg-[#0071E3]/8 text-[#0071E3] font-bold'
                      : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                    }`
                  }
                >
                  <div className="w-5 h-5 flex items-center justify-center text-current">
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 14a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                    </svg>
                  </div>
                  <span>Dashboard</span>
                </NavLink>

                {/* Grouped sections */}
                {NAV_GROUPS.map((group) => {
                  const allowedItems = group.items.filter(item => !item.roles || item.roles.includes(user?.role))
                  if (allowedItems.length === 0) return null

                  return (
                    <div key={group.id} className="space-y-1">
                      <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
                        {group.label}
                      </p>
                      <div className="pl-2 space-y-0.5 border-l border-[#E5E5E7] ml-5">
                        {allowedItems.map((item) => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isActive
                                ? 'bg-[#0071E3]/6 text-[#0071E3] font-bold'
                                : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                              }`
                            }
                          >
                            <span className="shrink-0 text-current">{item.icon}</span>
                            <span>{item.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* Reports & Admin */}
                <div className="space-y-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#86868B]">Other Pages</p>
                  <div className="pl-2 space-y-0.5 border-l border-[#E5E5E7] ml-5">
                    <NavLink
                      to="/reports"
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isActive
                          ? 'bg-[#0071E3]/6 text-[#0071E3] font-bold'
                          : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                        }`
                      }
                    >
                      <span className="shrink-0 text-current">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </span>
                      <span>Reports</span>
                    </NavLink>

                    {(user?.role === 'super_admin' || user?.role === 'ttc_staff') && (
                      <NavLink
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isActive
                            ? 'bg-[#0071E3]/6 text-[#0071E3] font-bold'
                            : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                          }`
                        }
                      >
                        <span className="shrink-0 text-current">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                        </span>
                        <span>Admin Control</span>
                      </NavLink>
                    )}
                  </div>
                </div>
              </nav>
            </div>

            {/* Profile Drawer footer section */}
            <div className="border-t border-[#E5E5E7]/55 pt-4 mt-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0088FF] to-[#0071E3] flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0 border border-[#006CD7]">
                  {initials}
                </div>
                <div className="min-w-0 flex-1 leading-tight text-left">
                  <p className="text-xs font-bold text-[#1D1D1F] truncate">{user?.full_name || 'User'}</p>
                  <p className="text-[9px] text-[#86868B] font-bold uppercase tracking-wider mt-0.5 truncate">{user?.role?.replaceAll('_', ' ') || 'IP Manager'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  logout()
                }}
                className="w-full bg-[#FF3B30]/5 hover:bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/10 py-2.5 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-all outline-none focus:outline-none flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
