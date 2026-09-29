import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../components/ui/Toast'
import { createPatent } from '../../api/patents'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'

const STEPS = [
  { id: 1, title: 'Welcome', desc: 'Patent Filing Info' },
  { id: 2, title: 'Account', desc: 'Verification' },
  { id: 3, title: 'Applicant', desc: 'Personal Info' },
  { id: 4, title: 'Patent Type', desc: 'Classification' },
  { id: 5, title: 'Invention', desc: 'Details & Specs' },
  { id: 6, title: 'Documents', desc: 'Drawings & Files' },
  { id: 7, title: 'Inventors', desc: 'Rights & Co-Inventors' },
  { id: 8, title: 'Declaration', desc: 'Legal Terms' },
  { id: 9, title: 'Review', desc: 'Verify Submission' },
  { id: 10, title: 'Payment', desc: 'Filing Fees' },
  { id: 11, title: 'Submit', desc: 'Final Filing' },
  { id: 12, title: 'Confirmation', desc: 'Application Status' },
]

export default function PatentApplicationWizard({ onComplete, onCancel, initialData }) {
  const { user } = useAuth()
  const { addToast } = useToast()

  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submittedCase, setSubmittedCase] = useState(null)

  // Application State
  const [formData, setFormData] = useState({
    patent_type: 'Utility Patent',
    applicant_name: user?.full_name || '',
    applicant_email: user?.email || '',
    department: 'Electrical and Information Engineering',
    applicant_phone: '+94 77 123 4567',
    address: 'Faculty of Engineering, University of Ruhuna, Hapugala, Galle',
    nationality: 'Sri Lankan',
    
    title: '',
    short_description: '',
    detailed_description: '',
    problem_solved: '',
    benefits: '',

    inventors: [
      { name: user?.full_name || 'Primary Inventor', email: user?.email || '', role: 'Lead Researcher', share: 100 }
    ],

    documents: [
      { name: 'Technical_Drawings_v1.pdf', type: 'Drawings', size: '3.2 MB' },
      { name: 'Invention_Specification_Claims.pdf', type: 'PDF Specification', size: '1.8 MB' }
    ],

    declaration_accepted: false,
    digital_signature: user?.full_name || '',
    
    payment_method: 'credit_card',
    card_number: '•••• •••• •••• 4242',
    grant_code: '',

    ...initialData
  })

  // Autofill user details when step 2 or 3 is loaded
  useEffect(() => {
    if (user && !formData.applicant_name) {
      setFormData(prev => ({
        ...prev,
        applicant_name: user.full_name || '',
        applicant_email: user.email || ''
      }))
    }
  }, [user])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Inventor Handlers
  const addInventor = () => {
    setFormData(prev => ({
      ...prev,
      inventors: [...prev.inventors, { name: '', email: '', role: 'Co-Inventor', share: 0 }]
    }))
  }

  const updateInventor = (index, field, value) => {
    const updated = [...formData.inventors]
    updated[index][field] = value
    setFormData(prev => ({ ...prev, inventors: updated }))
  }

  const removeInventor = (index) => {
    if (formData.inventors.length === 1) return
    setFormData(prev => ({
      ...prev,
      inventors: prev.inventors.filter((_, i) => i !== index)
    }))
  }

  // Document Handlers
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const newDocs = files.map(f => ({
      name: f.name,
      type: f.type.includes('image') ? 'Images' : 'PDF Specification',
      size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`
    }))
    setFormData(prev => ({ ...prev, documents: [...prev.documents, ...newDocs] }))
    addToast(`${files.length} file(s) added successfully`, 'success')
  }

  const removeDoc = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }))
  }

  // Calculate Fee
  const getFilingFee = () => {
    switch (formData.patent_type) {
      case 'Utility Patent': return 150
      case 'Design Patent': return 100
      case 'Plant Patent': return 120
      default: return 150
    }
  }

  const feeBreakdown = {
    base: getFilingFee(),
    examination: 50,
    processing: 25,
    total: getFilingFee() + 50 + 25
  }

  // Validation per step
  const canProceed = () => {
    switch (currentStep) {
      case 1: return true
      case 2: return true
      case 3: return formData.applicant_name && formData.applicant_email && formData.applicant_phone
      case 4: return formData.patent_type
      case 5: return formData.title && formData.short_description && formData.detailed_description
      case 6: return formData.documents.length > 0
      case 7: 
        const totalShare = formData.inventors.reduce((acc, curr) => acc + (parseFloat(curr.share) || 0), 0)
        return totalShare === 100 && formData.inventors.every(i => i.name)
      case 8: return formData.declaration_accepted && formData.digital_signature
      case 9: return true
      case 10: return true
      case 11: return true
      case 12: return true
      default: return true
    }
  }

  // Handle Final Submission
  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = {
        title: formData.title,
        jurisdiction: 'US / PCT',
        assignee: 'University of Ruhuna - Technology Transfer Cell',
        attorney: 'TTC IP Legal Bureau',
        filing_date: new Date().toISOString().split('T')[0],
        next_due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days
        status: 'under_review',
        budget: feeBreakdown.total,
        claims_text: formData.detailed_description,
        legal_notes: `Problem Solved: ${formData.problem_solved} | Benefits: ${formData.benefits}`,
        
        patent_type: formData.patent_type,
        applicant_name: formData.applicant_name,
        applicant_email: formData.applicant_email,
        applicant_phone: formData.applicant_phone,
        address: formData.address,
        nationality: formData.nationality,
        short_description: formData.short_description,
        detailed_description: formData.detailed_description,
        problem_solved: formData.problem_solved,
        benefits: formData.benefits,
        inventors_json: JSON.stringify(formData.inventors),
        documents_json: JSON.stringify(formData.documents),
        payment_status: 'paid',
        payment_amount: feeBreakdown.total,
        declaration_accepted: formData.declaration_accepted,
        is_draft: false
      }

      const created = await createPatent(payload)
      setSubmittedCase(created)
      addToast(`Patent application ${created.patent_number || 'submitted'} submitted successfully!`, 'success')
      setCurrentStep(12)
    } catch (err) {
      console.error(err)
      addToast('Failed to submit application. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-surface border border-line rounded-3xl p-6 md:p-8 shadow-xl max-w-5xl mx-auto my-4 animate-fade-in">
      
      {/* Top Header & Cancel */}
      <div className="flex items-center justify-between border-b border-line pb-5 mb-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo bg-indigo-light px-3 py-1 rounded-full">
            Patent Application Portal
          </span>
          <h1 className="text-xl md:text-2xl font-black text-ink mt-2">
            Online Patent Application Wizard
          </h1>
          <p className="text-xs text-ink/60 mt-0.5">
            Step {currentStep} of 12: <span className="font-semibold text-ink">{STEPS[currentStep - 1].title}</span> — {STEPS[currentStep - 1].desc}
          </p>
        </div>
        <Button variant="ghost" onClick={onCancel} className="text-xs text-ink/50 hover:text-ink">
          ✕ Cancel Filing
        </Button>
      </div>

      {/* Wizard Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-[11px] font-bold text-ink/50 mb-2 overflow-x-auto gap-1 pb-1">
          {STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => s.id < currentStep && setCurrentStep(s.id)}
              disabled={s.id > currentStep}
              className={`shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                s.id === currentStep
                  ? 'bg-indigo text-white shadow-xs font-bold'
                  : s.id < currentStep
                  ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 font-semibold cursor-pointer'
                  : 'text-ink/30 cursor-not-allowed'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                {s.id < currentStep ? '✓' : s.id}
              </span>
              <span className="hidden md:inline">{s.title}</span>
            </button>
          ))}
        </div>
        <div className="w-full h-2 bg-paper rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo via-indigo-dark to-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 12) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content Renderers */}
      <div className="min-h-[380px]">
        
        {/* STEP 1: WELCOME */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-br from-indigo/5 via-purple-500/5 to-transparent p-6 md:p-8 rounded-2xl border border-indigo/10">
              <h2 className="text-2xl font-bold text-ink mb-3">Welcome to the Official Patent Application Portal</h2>
              <p className="text-sm text-ink/70 leading-relaxed mb-6">
                A patent grants you exclusive legal rights to your invention, preventing unauthorized commercial exploitation.
                Our streamlined 12-step online filing portal guides you step-by-step through submitting your patent specification, technical drawings, applicant details, and fee payment.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-surface p-4 rounded-xl border border-line shadow-xs hover:border-indigo transition-all">
                  <div className="w-9 h-9 rounded-lg bg-indigo/10 text-indigo flex items-center justify-center font-bold mb-2">⚡</div>
                  <h3 className="font-bold text-sm text-ink">Utility Patent</h3>
                  <p className="text-xs text-ink/60 mt-1">Protects new technical processes, machines, software, and physical compositions.</p>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-line shadow-xs hover:border-indigo transition-all">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold mb-2">🎨</div>
                  <h3 className="font-bold text-sm text-ink">Design Patent</h3>
                  <p className="text-xs text-ink/60 mt-1">Protects original, ornamental visual design and aesthetic appearance of functional objects.</p>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-line shadow-xs hover:border-indigo transition-all">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold mb-2">🌱</div>
                  <h3 className="font-bold text-sm text-ink">Plant Patent</h3>
                  <p className="text-xs text-ink/60 mt-1">Protects distinct, newly invented or discovered asexually reproduced plant varieties.</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-surface p-4 rounded-xl border border-line">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-semibold text-ink">System Status: Online Patent Office Ready</span>
                </div>
                <Button onClick={() => setCurrentStep(2)} className="px-6 py-2.5 shadow-md">
                  Start Application →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CREATE / LOGIN ACCOUNT */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-lg font-bold text-ink border-b border-line pb-2">2. Account Verification & Authentication</h2>
            
            {user ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-lg">
                    {user.full_name?.[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-ink">{user.full_name}</h3>
                    <p className="text-xs text-ink/60">{user.email} • Role: {user.role?.replaceAll('_', ' ')}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                      ✓ Verified Account Active
                    </span>
                  </div>
                </div>
                <Button onClick={() => setCurrentStep(3)} className="py-2">
                  Continue as {user.full_name.split(' ')[0]} →
                </Button>
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-3">
                <h3 className="font-bold text-ink">Guest Session Detected</h3>
                <p className="text-xs text-ink/70">
                  You can proceed as a Guest applicant, or log in to automatically link your submission to your University of Ruhuna portal account.
                </p>
                <div className="flex gap-3 pt-2">
                  <Button onClick={() => setCurrentStep(3)}>Proceed as Guest</Button>
                  <Button variant="ghost" onClick={() => window.location.href = '/login'}>Login Account</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: APPLICANT INFORMATION */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-ink border-b border-line pb-2">3. Applicant Details (Name & Department)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">Full Legal Name *</label>
                <Input
                  value={formData.applicant_name}
                  onChange={(e) => handleInputChange('applicant_name', e.target.value)}
                  placeholder="e.g. Dr. Nimal Perera"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">Department *</label>
                <Select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                >
                  <option value="Civil and Environmental Engineering">Civil and Environmental Engineering</option>
                  <option value="Electrical and Information Engineering">Electrical and Information Engineering</option>
                  <option value="Marine Engineering and Naval Architecture">Marine Engineering and Naval Architecture</option>
                  <option value="Mechanical and Manufacturing Engineering">Mechanical and Manufacturing Engineering</option>
                  <option value="Computer Engineering">Computer Engineering</option>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">Email Address *</label>
                <Input
                  type="email"
                  value={formData.applicant_email}
                  onChange={(e) => handleInputChange('applicant_email', e.target.value)}
                  placeholder="e.g. nimal@eng.ruh.ac.lk"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">Phone Number *</label>
                <Input
                  value={formData.applicant_phone}
                  onChange={(e) => handleInputChange('applicant_phone', e.target.value)}
                  placeholder="+94 77 123 4567"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">Nationality *</label>
                <Input
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  placeholder="Sri Lankan"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-ink/70 mb-1">Residential / Official Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Department of Electrical & Information Engineering, University of Ruhuna"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PATENT TYPE */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-ink border-b border-line pb-2">4. Select Patent Classification</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { type: 'Utility Patent', fee: '$150', icon: '⚡', desc: 'Inventions, technological mechanisms, systems, software algorithms, and functional compositions.' },
                { type: 'Design Patent', fee: '$100', icon: '🎨', desc: 'Novel visual appearances, industrial shapes, ergonomic forms, and surface ornamental designs.' },
                { type: 'Plant Patent', fee: '$120', icon: '🌱', desc: 'Distinct, newly discovered or developed asexually reproduced botanical plant varieties.' },
              ].map((p) => (
                <div
                  key={p.type}
                  onClick={() => handleInputChange('patent_type', p.type)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    formData.patent_type === p.type
                      ? 'border-indigo bg-indigo/5 shadow-md scale-[1.02]'
                      : 'border-line bg-surface hover:border-indigo/50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-2xl">{p.icon}</span>
                    <span className="text-xs font-bold bg-paper px-2.5 py-1 rounded-full text-indigo">{p.fee} Base Fee</span>
                  </div>
                  <h3 className="font-bold text-ink text-base mb-1">{p.type}</h3>
                  <p className="text-xs text-ink/60 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: INVENTION DETAILS */}
        {currentStep === 5 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-ink border-b border-line pb-2">5. Invention Technical Specification</h2>
            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1">Invention Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g. High-Efficiency Solar Thermal Heat Exchanger with Graphene Coating"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1">Short Description / Abstract *</label>
              <textarea
                rows={2}
                value={formData.short_description}
                onChange={(e) => handleInputChange('short_description', e.target.value)}
                className="w-full rounded-xl border border-line bg-surface p-3 text-xs text-ink focus:border-indigo focus:outline-none"
                placeholder="Brief summary highlighting the technical field and core novelty (max 200 words)..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1">Detailed Technical Description & Claims *</label>
              <textarea
                rows={4}
                value={formData.detailed_description}
                onChange={(e) => handleInputChange('detailed_description', e.target.value)}
                className="w-full rounded-xl border border-line bg-surface p-3 text-xs text-ink focus:border-indigo focus:outline-none"
                placeholder="Comprehensive technical breakdown, claims scope, and mechanism of operation..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">Problem Solved</label>
                <Input
                  value={formData.problem_solved}
                  onChange={(e) => handleInputChange('problem_solved', e.target.value)}
                  placeholder="e.g. Overcoming high thermal energy loss in conventional exchangers."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">Key Commercial Benefits</label>
                <Input
                  value={formData.benefits}
                  onChange={(e) => handleInputChange('benefits', e.target.value)}
                  placeholder="e.g. 40% reduction in thermal resistance, lower production cost."
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: UPLOAD DOCUMENTS */}
        {currentStep === 6 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-ink border-b border-line pb-2">6. Upload Drawings & Supporting Specs</h2>
            
            <div className="border-2 border-dashed border-indigo/30 rounded-2xl p-6 text-center bg-indigo/5 hover:bg-indigo/10 transition-all cursor-pointer relative">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-12 h-12 rounded-full bg-indigo/10 text-indigo flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                📁
              </div>
              <p className="text-sm font-bold text-ink">Click or drag & drop files here to upload</p>
              <p className="text-xs text-ink/50 mt-1">Accepts PDF, DWG, PNG, JPG, and DOCX (Max 25MB per file)</p>
            </div>

            <div className="space-y-2 mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink/60">Attached Files ({formData.documents.length})</h3>
              {formData.documents.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-paper border border-line">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📄</span>
                    <div>
                      <p className="text-xs font-bold text-ink">{doc.name}</p>
                      <p className="text-[10px] text-ink/50">{doc.type} • {doc.size}</p>
                    </div>
                  </div>
                  <button onClick={() => removeDoc(idx)} className="text-xs text-rose-500 hover:underline">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 7: INVENTOR DETAILS & RIGHTS */}
        {currentStep === 7 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h2 className="text-lg font-bold text-ink">7. Inventor(s) & Ownership Allocation</h2>
              <Button onClick={addInventor} variant="ghost" className="text-xs py-1 px-3">
                + Add Co-Inventor
              </Button>
            </div>

            <div className="space-y-3">
              {formData.inventors.map((inv, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-line bg-surface space-y-3 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold uppercase text-indigo">
                      {idx === 0 ? 'Primary Inventor / Lead' : `Co-Inventor #${idx}`}
                    </span>
                    {formData.inventors.length > 1 && (
                      <button onClick={() => removeInventor(idx)} className="text-xs text-rose-500 hover:underline">
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-medium text-ink/70">Full Name</label>
                      <Input
                        value={inv.name}
                        onChange={(e) => updateInventor(idx, 'name', e.target.value)}
                        placeholder="Inventor Name"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-ink/70">Email Address</label>
                      <Input
                        value={inv.email}
                        onChange={(e) => updateInventor(idx, 'email', e.target.value)}
                        placeholder="Email"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-ink/70">Rights Share (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={inv.share}
                        onChange={(e) => updateInventor(idx, 'share', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-paper flex items-center justify-between text-xs">
              <span className="font-bold text-ink">Total Allocation:</span>
              <span className={`font-bold px-3 py-1 rounded-full ${
                formData.inventors.reduce((acc, c) => acc + (parseFloat(c.share) || 0), 0) === 100
                  ? 'bg-emerald-500/20 text-emerald-600'
                  : 'bg-rose-500/20 text-rose-600'
              }`}>
                {formData.inventors.reduce((acc, c) => acc + (parseFloat(c.share) || 0), 0)}% / 100%
              </span>
            </div>
          </div>
        )}

        {/* STEP 8: DECLARATION */}
        {currentStep === 8 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-ink border-b border-line pb-2">8. Inventor Legal Declaration</h2>
            <div className="p-5 rounded-2xl bg-paper border border-line text-xs text-ink/80 leading-relaxed space-y-3">
              <p>
                I hereby declare that I am the original inventor (or authorized legal representative) of the invention described in this patent application. I confirm that to the best of my knowledge, the specification details are true, original, and do not infringe existing active patents.
              </p>
              <label className="flex items-start gap-3 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={formData.declaration_accepted}
                  onChange={(e) => handleInputChange('declaration_accepted', e.target.checked)}
                  className="mt-0.5 rounded text-indigo focus:ring-indigo"
                />
                <span className="font-bold text-ink">
                  I accept all legal filing conditions and terms of the Technology Transfer Cell, University of Ruhuna.
                </span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1">Digital Signature (Type Full Legal Name) *</label>
              <Input
                value={formData.digital_signature}
                onChange={(e) => handleInputChange('digital_signature', e.target.value)}
                placeholder="Full Legal Name Signature"
              />
            </div>
          </div>
        )}

        {/* STEP 9: REVIEW */}
        {currentStep === 9 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-ink border-b border-line pb-2">9. Review Application Data</h2>
            <div className="space-y-3 text-xs">
              
              <div className="p-4 rounded-xl border border-line bg-surface flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-indigo uppercase tracking-wider text-[10px]">Classification & Title</h3>
                  <p className="text-sm font-bold text-ink mt-1">{formData.title || 'Untitled Invention'}</p>
                  <p className="text-ink/60">{formData.patent_type} • Jurisdiction: US / PCT</p>
                </div>
                <button onClick={() => setCurrentStep(5)} className="text-xs text-indigo font-bold hover:underline">Edit</button>
              </div>

              <div className="p-4 rounded-xl border border-line bg-surface flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-indigo uppercase tracking-wider text-[10px]">Applicant Info</h3>
                  <p className="text-ink font-semibold mt-1">{formData.applicant_name} ({formData.applicant_email})</p>
                  <p className="text-ink/60">{formData.applicant_phone} • {formData.nationality}</p>
                </div>
                <button onClick={() => setCurrentStep(3)} className="text-xs text-indigo font-bold hover:underline">Edit</button>
              </div>

              <div className="p-4 rounded-xl border border-line bg-surface flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-indigo uppercase tracking-wider text-[10px]">Inventors & Documents</h3>
                  <p className="text-ink font-semibold mt-1">{formData.inventors.length} Inventor(s) • {formData.documents.length} Document File(s) Attached</p>
                </div>
                <button onClick={() => setCurrentStep(7)} className="text-xs text-indigo font-bold hover:underline">Edit</button>
              </div>

            </div>
          </div>
        )}

        {/* STEP 10: PAYMENT */}
        {currentStep === 10 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-ink border-b border-line pb-2">10. Official Patent Filing Fee Payment</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-paper border border-line space-y-3">
                <h3 className="font-bold text-sm text-ink">Itemized Fee Summary</h3>
                <div className="space-y-2 text-xs border-b border-line pb-3">
                  <div className="flex justify-between">
                    <span className="text-ink/60">{formData.patent_type} Application Fee:</span>
                    <span className="font-bold text-ink">${feeBreakdown.base}.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/60">Formality Examination Fee:</span>
                    <span className="font-bold text-ink">${feeBreakdown.examination}.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/60">Registry Processing & Archival:</span>
                    <span className="font-bold text-ink">${feeBreakdown.processing}.00</span>
                  </div>
                </div>
                <div className="flex justify-between text-base font-black text-ink">
                  <span>Total Filing Fee:</span>
                  <span className="text-indigo">${feeBreakdown.total}.00 USD</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-ink/70">Payment Method</label>
                <Select
                  value={formData.payment_method}
                  onChange={(e) => handleInputChange('payment_method', e.target.value)}
                >
                  <option value="credit_card">Credit / Debit Card</option>
                  <option value="bank_transfer">Direct Bank Transfer</option>
                  <option value="university_grant">University Research Grant Code</option>
                </Select>

                {formData.payment_method === 'credit_card' && (
                  <div>
                    <label className="block text-[11px] font-medium text-ink/70 mb-1">Card Number</label>
                    <Input
                      value={formData.card_number}
                      onChange={(e) => handleInputChange('card_number', e.target.value)}
                    />
                  </div>
                )}

                {formData.payment_method === 'university_grant' && (
                  <div>
                    <label className="block text-[11px] font-medium text-ink/70 mb-1">Grant Allocation Code</label>
                    <Input
                      value={formData.grant_code}
                      onChange={(e) => handleInputChange('grant_code', e.target.value)}
                      placeholder="e.g. UOR-GRANT-2026-88"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 11: SUBMIT */}
        {currentStep === 11 && (
          <div className="space-y-6 text-center py-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-indigo/10 text-indigo flex items-center justify-center mx-auto text-3xl font-bold">
              🚀
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink">Ready to Submit Patent Application</h2>
              <p className="text-xs text-ink/60 max-w-md mx-auto mt-1">
                Upon clicking "Confirm & Submit Filing", your application specification, attached technical drawings, and fee transaction will be submitted to the Technology Transfer Cell.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-3 text-sm shadow-xl bg-gradient-to-r from-indigo to-indigo-dark text-white"
            >
              {submitting ? 'Submitting Application...' : 'Confirm & Submit Filing →'}
            </Button>
          </div>
        )}

        {/* STEP 12: CONFIRMATION & TRACKING */}
        {currentStep === 12 && (
          <div className="space-y-6 text-center py-6 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto text-4xl font-bold animate-bounce">
              ✓
            </div>
            <div>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-wider">
                Filing Successful
              </span>
              <h2 className="text-2xl font-black text-ink mt-2">
                Application Number: {submittedCase?.patent_number || 'PAT-2026-8942'}
              </h2>
              <p className="text-xs text-ink/60 max-w-md mx-auto mt-1">
                Your patent application has been logged. A formal confirmation email has been dispatched to {formData.applicant_email}.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-paper border border-line max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-ink/60">Status:</span>
                <span className="font-bold text-indigo">Under Formality Examination</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Filing Date:</span>
                <span className="font-semibold text-ink">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Filing Fee Paid:</span>
                <span className="font-semibold text-emerald-600">${feeBreakdown.total}.00 USD (Paid)</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <Button onClick={onComplete} className="px-6">
                Go to Patent Dashboard →
              </Button>
              <Button variant="ghost" onClick={() => addToast('Downloading Application Summary PDF...', 'info')}>
                📥 Download Summary PDF
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* Wizard Bottom Navigation Buttons */}
      {currentStep < 11 && (
        <div className="flex items-center justify-between border-t border-line pt-5 mt-6">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="text-xs"
          >
            ← Previous
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentStep(prev => Math.min(11, prev + 1))}
              disabled={!canProceed()}
              className="text-xs px-6"
            >
              Next Step →
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}
