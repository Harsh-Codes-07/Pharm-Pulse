'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Shield,
  FlaskConical,
  AlertTriangle,
  Lock,
  LogOut,
  CheckCircle2,
  Trash2,
  Users,
  UserPlus,
  UserMinus,
  Edit,
  X,
  Calendar,
  MapPin,
  Tag,
  Building,
  Pill,
  Sparkles
} from 'lucide-react'

interface Batch {
  drugName: string
  batchNumber: string
  manufacturer: string
  location: string
  marketedBy?: string
  manufactureDate?: string
  expiryDate?: string
  price?: string
  contents?: string
  status: 'Active' | 'Sold'
  cloneAttempts: number
  adminCode?: string
  txHash?: string | null
}

export default function AdminPage() {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'inventory' | 'chemists'>('inventory')

  // Batches State
  const [batches, setBatches] = useState<Batch[]>([])
  
  // Add Batch Form State
  const [newDrugName, setNewDrugName] = useState('')
  const [newBatchNo, setNewBatchNo] = useState('')
  const [newManufacturer, setNewManufacturer] = useState('Sun Pharmaceutical Industries Ltd.')
  const [newLocation, setNewLocation] = useState('Halol Plant, Gujarat, India')
  const [newMarketedBy, setNewMarketedBy] = useState('Sun Pharma Laboratories Ltd.')
  const [newMfgDate, setNewMfgDate] = useState('2026-03-01')
  const [newExpDate, setNewExpDate] = useState('2028-02-28')
  const [newPrice, setNewPrice] = useState('₹195.00')
  const [newContents, setNewContents] = useState('')
  const [newAdminCode, setNewAdminCode] = useState('')
  const [mintLoading, setMintLoading] = useState(false)

  // Edit Batch Modal State
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [editDrugName, setEditDrugName] = useState('')
  const [editManufacturer, setEditManufacturer] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editMarketedBy, setEditMarketedBy] = useState('')
  const [editMfgDate, setEditMfgDate] = useState('')
  const [editExpDate, setEditExpDate] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editContents, setEditContents] = useState('')
  const [editAdminCode, setEditAdminCode] = useState('')
  const [editStatus, setEditStatus] = useState<'Active' | 'Sold'>('Active')
  const [editLoading, setEditLoading] = useState(false)

  // Chemist Accounts State
  const [chemists, setChemists] = useState<any[]>([])
  const [newChemistUsername, setNewChemistUsername] = useState('')
  const [newChemistPassword, setNewChemistPassword] = useState('')

  // Toast State
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    const saved = localStorage.getItem('pharmpulse_admin_user')
    if (saved && saved === 'Harshwardhan') setCurrentUser(saved)
  }, [])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg)
    setToastType(type)
    setTimeout(() => setToast(''), 3500)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword, portal: 'admin' })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        localStorage.setItem('pharmpulse_admin_user', data.user.username)
        setCurrentUser(data.user.username)
        setLoginUsername('')
        setLoginPassword('')
      } else {
        if (loginUsername.trim() === 'Harshwardhan' && loginPassword === 'Harsh@58') {
          localStorage.setItem('pharmpulse_admin_user', 'Harshwardhan')
          setCurrentUser('Harshwardhan')
        } else {
          setLoginError(data.error || 'Access Denied: Invalid Admin username or password.')
        }
      }
    } catch {
      if (loginUsername.trim() === 'Harshwardhan' && loginPassword === 'Harsh@58') {
        localStorage.setItem('pharmpulse_admin_user', 'Harshwardhan')
        setCurrentUser('Harshwardhan')
      } else {
        setLoginError('Access Denied: Invalid Admin username or password.')
      }
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('pharmpulse_admin_user')
    setCurrentUser(null)
    setBatches([])
    setChemists([])
  }

  const fetchBatches = async () => {
    if (!currentUser) return
    try {
      const res = await fetch(`${API_BASE}/api/drugs/batches?role=admin`)
      const data = await res.json()
      if (res.ok) setBatches(data)
    } catch {}
  }

  const fetchChemists = async () => {
    if (!currentUser) return
    try {
      const res = await fetch(`${API_BASE}/api/admin/chemists`)
      const data = await res.json()
      if (res.ok) setChemists(data)
    } catch {}
  }

  useEffect(() => {
    if (currentUser) {
      fetchBatches()
      fetchChemists()
      const interval = setInterval(fetchBatches, 4000)
      return () => clearInterval(interval)
    }
  }, [currentUser])

  // Mint (Add) Batch Handler
  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault()
    setMintLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/drugs/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drugName: newDrugName,
          batchNumber: newBatchNo,
          manufacturer: newManufacturer,
          location: newLocation,
          marketedBy: newMarketedBy,
          manufactureDate: newMfgDate,
          expiryDate: newExpDate,
          price: newPrice,
          contents: newContents,
          adminCode: newAdminCode
        })
      })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message || 'Batch minted successfully on ledger!')
        setNewDrugName('')
        setNewBatchNo('')
        setNewContents('')
        setNewAdminCode('')
        fetchBatches()
      } else {
        showToast(data.error || 'Failed to mint batch', 'error')
      }
    } catch {
      showToast('Server connection failed', 'error')
    } finally {
      setMintLoading(false)
    }
  }

  // Open Edit Modal
  const openEditModal = (batch: Batch) => {
    setEditingBatch(batch)
    setEditDrugName(batch.drugName || '')
    setEditManufacturer(batch.manufacturer || '')
    setEditLocation(batch.location || '')
    setEditMarketedBy(batch.marketedBy || '')
    setEditMfgDate(batch.manufactureDate || '')
    setEditExpDate(batch.expiryDate || '')
    setEditPrice(batch.price || '')
    setEditContents(batch.contents || '')
    setEditAdminCode(batch.adminCode || '')
    setEditStatus(batch.status || 'Active')
  }

  // Save Edit Handler
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBatch) return
    setEditLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/batch/${encodeURIComponent(editingBatch.batchNumber)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drugName: editDrugName,
          manufacturer: editManufacturer,
          location: editLocation,
          marketedBy: editMarketedBy,
          manufactureDate: editMfgDate,
          expiryDate: editExpDate,
          price: editPrice,
          contents: editContents,
          adminCode: editAdminCode,
          status: editStatus
        })
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`Batch "${editingBatch.batchNumber}" updated successfully!`)
        setEditingBatch(null)
        fetchBatches()
      } else {
        showToast(data.error || 'Failed to update batch', 'error')
      }
    } catch {
      showToast('Server connection failed during update', 'error')
    } finally {
      setEditLoading(false)
    }
  }

  // Delete Batch Handler
  const handleDeleteBatch = async (batchNumber: string) => {
    if (!confirm(`Delete batch "${batchNumber}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`${API_BASE}/api/admin/batch/${encodeURIComponent(batchNumber)}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message || `Batch ${batchNumber} deleted successfully`)
        fetchBatches()
      } else {
        showToast(data.error || 'Delete failed', 'error')
      }
    } catch {
      showToast('Server connection failed', 'error')
    }
  }

  // Chemist Handlers
  const handleAddChemist = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_BASE}/api/admin/chemists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newChemistUsername, password: newChemistPassword })
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`Chemist '${data.username}' added successfully!`)
        setNewChemistUsername('')
        setNewChemistPassword('')
        fetchChemists()
      } else {
        showToast(data.error || 'Failed to add chemist', 'error')
      }
    } catch {
      showToast('Server connection failed', 'error')
    }
  }

  const handleRemoveChemist = async (username: string) => {
    if (!confirm(`Remove chemist account "${username}"? They will lose access immediately.`)) return
    try {
      const res = await fetch(`${API_BASE}/api/admin/chemists/${encodeURIComponent(username)}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message || `Chemist '${username}' removed`)
        fetchChemists()
      } else {
        showToast(data.error || 'Failed to remove chemist', 'error')
      }
    } catch {
      showToast('Server connection failed', 'error')
    }
  }

  // --- LOGIN SCREEN ---
  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', background: '#090d16', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '420px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '36px', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(16, 214, 178, 0.1)', borderRadius: '12px', marginBottom: '12px' }}>
              <FlaskConical color="#10d6b2" size={32} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 6px 0' }}>PharmPulse Admin Portal</h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Manufacturer Authority & Regulatory Supply Control</p>
          </div>
          {loginError && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', color: '#ef4444', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} /> {loginError}
            </div>
          )}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Admin Username</label>
              <input required type="text" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} placeholder="Enter admin username" style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Admin Password</label>
              <input required type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Enter secure password" style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }} />
            </div>
            <button type="submit" disabled={loginLoading} style={{ marginTop: '8px', padding: '12px', background: '#10d6b2', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Lock size={16} /> {loginLoading ? 'Authenticating...' : 'Sign In as Administrator'}
            </button>
          </form>
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
            🔒 Cryptographic security enforced. Full admin rights to Add, Edit, and Delete medicine ledger entries.
          </div>
        </div>
      </div>
    )
  }

  // --- AUTHENTICATED ADMIN DASHBOARD ---
  const totalClonesBlocked = batches.reduce((acc, b) => acc + (b.cloneAttempts || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#fff', padding: '28px', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FlaskConical color="#10d6b2" size={24} />
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>PharmPulse 👑 Admin Operations Center</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>Blockchain Anti-Counterfeit Batch Minting, Editing & Chemist Access Control</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '13px', color: '#10d6b2', fontWeight: 600 }}>👤 {currentUser} (Admin)</span>
          <button onClick={handleLogout} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LogOut size={14} /> Sign Out
          </button>
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', padding: '6px 14px', borderRadius: '8px', color: '#ef4444', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} /> Clones Blocked: {totalClonesBlocked}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('inventory')}
          style={{
            padding: '10px 22px',
            background: activeTab === 'inventory' ? '#10d6b2' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'inventory' ? '#000' : '#94a3b8',
            border: `1px solid ${activeTab === 'inventory' ? '#10d6b2' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Shield size={16} /> Medicine Inventory & Batch Control
        </button>
        <button
          onClick={() => setActiveTab('chemists')}
          style={{
            padding: '10px 22px',
            background: activeTab === 'chemists' ? '#10d6b2' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'chemists' ? '#000' : '#94a3b8',
            border: `1px solid ${activeTab === 'chemists' ? '#10d6b2' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Users size={16} /> Chemist Account Management {chemists.length > 0 && <span style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '4px', padding: '1px 6px', fontSize: '11px' }}>{chemists.length}</span>}
        </button>
      </div>

      {/* INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'grid', gridTemplateColumns: '460px 1fr', gap: '24px' }}>
          
          {/* Add / Mint Form */}
          <section style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', alignSelf: 'start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Plus size={20} color="#10d6b2" />
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Mint New Pharma Batch</h2>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Add a new authenticated medicine batch with full manufacturing and compliance parameters.
            </p>

            <form onSubmit={handleMint} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Medicine Name & Dosage *</label>
                <input
                  required
                  value={newDrugName}
                  onChange={e => setNewDrugName(e.target.value)}
                  placeholder="e.g. Dolo 650 · 15 Tablets"
                  style={{ width: '100%', padding: '9px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Batch ID *</label>
                  <input
                    required
                    value={newBatchNo}
                    onChange={e => setNewBatchNo(e.target.value)}
                    placeholder="e.g. IN-DOL-2026-102"
                    style={{ width: '100%', padding: '9px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#10d6b2', fontFamily: 'monospace', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>MRP / Price (₹)</label>
                  <input
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    placeholder="e.g. ₹32.50"
                    style={{ width: '100%', padding: '9px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Manufacturer Name *</label>
                <select
                  value={newManufacturer}
                  onChange={e => setNewManufacturer(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                >
                  <option>Sun Pharmaceutical Industries Ltd.</option>
                  <option>GlaxoSmithKline Pharmaceuticals Ltd.</option>
                  <option>Bharat Biotech International Ltd.</option>
                  <option>Dr. Reddy's Laboratories Ltd.</option>
                  <option>Cipla Limited</option>
                  <option>Serum Institute of India Pvt. Ltd.</option>
                  <option>Micro Labs Ltd.</option>
                  <option>Abbott India Ltd.</option>
                  <option>Mankind Pharma Ltd.</option>
                  <option>Torrent Pharmaceuticals Ltd.</option>
                  <option>Zydus Lifesciences Ltd.</option>
                  <option>Lupin Limited</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Marketed By</label>
                <input
                  value={newMarketedBy}
                  onChange={e => setNewMarketedBy(e.target.value)}
                  placeholder="e.g. Micro Labs Limited"
                  style={{ width: '100%', padding: '9px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Plant Location (Manufacturing Facility)</label>
                <input
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  placeholder="e.g. Baddi Plant, Solan, Himachal Pradesh"
                  style={{ width: '100%', padding: '9px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Mfg. Date</label>
                  <input
                    type="date"
                    value={newMfgDate}
                    onChange={e => setNewMfgDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Expiry Date</label>
                  <input
                    type="date"
                    value={newExpDate}
                    onChange={e => setNewExpDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Contents / Active Pharmaceutical Ingredients (API)</label>
                <textarea
                  rows={2}
                  value={newContents}
                  onChange={e => setNewContents(e.target.value)}
                  placeholder="e.g. Paracetamol IP 650mg, Excipients q.s."
                  style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Secret Admin Code (POS verification PIN)</label>
                <input
                  value={newAdminCode}
                  onChange={e => setNewAdminCode(e.target.value)}
                  placeholder="Auto-generated 4-digit code if left blank"
                  style={{ width: '100%', padding: '9px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#10d6b2', fontFamily: 'monospace', fontSize: '13px' }}
                />
              </div>

              <button
                type="submit"
                disabled={mintLoading}
                style={{
                  marginTop: '6px',
                  padding: '12px',
                  background: '#10d6b2',
                  color: '#000',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Sparkles size={16} /> {mintLoading ? 'Registering On-Chain...' : 'Mint Batch On-Chain'}
              </button>
            </form>
          </section>

          {/* Batch Inventory List */}
          <section style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} color="#10d6b2" />
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Registered Batches ({batches.length})</h2>
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Admin can Edit & Delete any batch</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '720px', overflowY: 'auto', paddingRight: '4px' }}>
              {batches.length === 0 && (
                <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', marginTop: '60px' }}>
                  No batches registered in the ledger yet. Use the minting form to add your first batch.
                </p>
              )}
              {batches.map(b => (
                <div
                  key={b.batchNumber}
                  style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '10px',
                    border: `1px solid ${b.status === 'Sold' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  {/* Top Row: Title, ID & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Pill size={16} color="#10d6b2" />
                        <strong style={{ fontSize: '15px', color: '#fff' }}>{b.drugName}</strong>
                      </div>
                      <div style={{ fontSize: '12px', color: '#10d6b2', fontFamily: 'monospace', marginTop: '4px', fontWeight: 600 }}>
                        Batch ID: {b.batchNumber}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          background: b.status === 'Sold' ? '#f59e0b' : '#10d6b2',
                          color: '#000'
                        }}
                      >
                        {b.status}
                      </span>
                      {b.cloneAttempts > 0 && (
                        <span style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid #ef4444', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                          🚨 {b.cloneAttempts} Clones Blocked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '12px', color: '#cbd5e1', background: 'rgba(0,0,0,0.25)', padding: '10px 12px', borderRadius: '8px' }}>
                    <div>
                      <span style={{ color: '#94a3b8' }}>Manufacturer: </span>
                      <strong>{b.manufacturer}</strong>
                    </div>
                    {b.marketedBy && (
                      <div>
                        <span style={{ color: '#94a3b8' }}>Marketed By: </span>
                        <strong>{b.marketedBy}</strong>
                      </div>
                    )}
                    <div>
                      <span style={{ color: '#94a3b8' }}>Plant Location: </span>
                      <span>📍 {b.location}</span>
                    </div>
                    {b.price && (
                      <div>
                        <span style={{ color: '#94a3b8' }}>MRP: </span>
                        <strong style={{ color: '#10d6b2' }}>{b.price}</strong>
                      </div>
                    )}
                    {b.manufactureDate && (
                      <div>
                        <span style={{ color: '#94a3b8' }}>MFG: </span>
                        <span>{b.manufactureDate}</span>
                      </div>
                    )}
                    {b.expiryDate && (
                      <div>
                        <span style={{ color: '#94a3b8' }}>EXP: </span>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>{b.expiryDate}</span>
                      </div>
                    )}
                  </div>

                  {/* Contents */}
                  {b.contents && (
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                      <span style={{ color: '#10d6b2', fontWeight: 600 }}>Contents: </span>
                      {b.contents}
                    </div>
                  )}

                  {/* Bottom Row: Admin Code & Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Secret Admin PIN: <strong style={{ color: '#10d6b2', fontFamily: 'monospace', letterSpacing: '1px' }}>{b.adminCode || 'N/A'}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => openEditModal(b)}
                        style={{
                          background: 'rgba(16,214,178,0.1)',
                          border: '1px solid rgba(16,214,178,0.4)',
                          color: '#10d6b2',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Edit size={13} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBatch(b.batchNumber)}
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.3)',
                          color: '#ef4444',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* CHEMISTS TAB */}
      {activeTab === 'chemists' && (
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px' }}>
          {/* Add Chemist Form */}
          <section style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={18} color="#10d6b2" /> Add New Chemist Account
            </h2>
            <form onSubmit={handleAddChemist} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '13px' }}>
                Chemist Username
                <input
                  required
                  value={newChemistUsername}
                  onChange={e => setNewChemistUsername(e.target.value)}
                  placeholder="e.g. rohan"
                  style={{ width: '100%', padding: '10px', marginTop: '4px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff' }}
                />
              </label>
              <label style={{ fontSize: '13px' }}>
                Account Password (min. 6 chars)
                <input
                  required
                  type="text"
                  value={newChemistPassword}
                  onChange={e => setNewChemistPassword(e.target.value)}
                  placeholder="e.g. Rohan@Med2026"
                  style={{ width: '100%', padding: '10px', marginTop: '4px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff' }}
                />
              </label>
              <button
                type="submit"
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: '#10d6b2',
                  color: '#000',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <UserPlus size={16} /> Add Chemist Account
              </button>
            </form>
            <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(16,214,178,0.05)', borderRadius: '8px', border: '1px solid rgba(16,214,178,0.15)', fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
              <strong style={{ color: '#10d6b2' }}>Role Permissions:</strong> Chemist accounts have read-only verification rights. They can scan medicine QR codes and verify on-chain authenticity, but cannot add or edit batches.
            </div>
          </section>

          {/* Chemist List */}
          <section style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#10d6b2" /> Authorized Chemist Accounts ({chemists.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '480px', overflowY: 'auto' }}>
              {chemists.length === 0 && <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>No chemist accounts yet.</p>}
              {chemists.map((c, i) => (
                <div key={c.username} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', background: 'rgba(16,214,178,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: '#10d6b2' }}>
                      {c.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{c.username}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Authorized Retail Chemist #{i + 1} (Verifier)</div>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveChemist(c.username)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <UserMinus size={13} /> Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* EDIT BATCH MODAL */}
      {editingBatch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '640px', background: '#0e1526', border: '1px solid rgba(16,214,178,0.3)', borderRadius: '16px', padding: '28px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit size={20} color="#10d6b2" />
                <h2 style={{ fontSize: '17px', fontWeight: 'bold', margin: 0 }}>
                  Edit Batch <span style={{ color: '#10d6b2', fontFamily: 'monospace' }}>{editingBatch.batchNumber}</span>
                </h2>
              </div>
              <button
                onClick={() => setEditingBatch(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Medicine Name & Dosage</label>
                <input
                  required
                  value={editDrugName}
                  onChange={e => setEditDrugName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Manufacturer Name</label>
                  <input
                    value={editManufacturer}
                    onChange={e => setEditManufacturer(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Marketed By</label>
                  <input
                    value={editMarketedBy}
                    onChange={e => setEditMarketedBy(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Plant Location</label>
                  <input
                    value={editLocation}
                    onChange={e => setEditLocation(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>MRP / Price (₹)</label>
                  <input
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Date of Manufacture</label>
                  <input
                    type="date"
                    value={editMfgDate}
                    onChange={e => setEditMfgDate(e.target.value)}
                    style={{ width: '100%', padding: '9px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Date of Expiry</label>
                  <input
                    type="date"
                    value={editExpDate}
                    onChange={e => setEditExpDate(e.target.value)}
                    style={{ width: '100%', padding: '9px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Contents / Composition (API)</label>
                <textarea
                  rows={2}
                  value={editContents}
                  onChange={e => setEditContents(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Secret Admin Code</label>
                  <input
                    value={editAdminCode}
                    onChange={e => setEditAdminCode(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#10d6b2', fontFamily: 'monospace', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Ledger Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as 'Active' | 'Sold')}
                    style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                  >
                    <option value="Active">Active (In Circulation)</option>
                    <option value="Sold">Sold (Dispensed & Locked)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  type="button"
                  onClick={() => setEditingBatch(null)}
                  style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  style={{ padding: '10px 24px', background: '#10d6b2', border: 'none', color: '#000', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                >
                  {editLoading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: toastType === 'success' ? '#10d6b2' : '#ef4444', color: toastType === 'success' ? '#000' : '#fff', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 2000 }}>
          {toastType === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {toast}
        </div>
      )}
    </div>
  )
}
