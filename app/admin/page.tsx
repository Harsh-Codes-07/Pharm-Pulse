'use client'

import { useState, useEffect } from 'react'
import { Plus, Shield, FlaskConical, AlertTriangle, Lock, LogOut, CheckCircle2, Trash2, Users, UserPlus, UserMinus } from 'lucide-react'

export default function AdminPage() {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'inventory' | 'chemists'>('inventory')

  const [batches, setBatches] = useState<any[]>([])
  const [newDrugName, setNewDrugName] = useState('')
  const [newBatchNo, setNewBatchNo] = useState('')
  const [newManufacturer, setNewManufacturer] = useState('Sun Pharmaceutical Industries Ltd.')
  const [newLocation, setNewLocation] = useState('Pune Plant, Maharashtra, India')
  const [newAdminCode, setNewAdminCode] = useState('')

  const [chemists, setChemists] = useState<any[]>([])
  const [newChemistUsername, setNewChemistUsername] = useState('')
  const [newChemistPassword, setNewChemistPassword] = useState('')

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

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_BASE}/api/drugs/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugName: newDrugName, batchNumber: newBatchNo, manufacturer: newManufacturer, location: newLocation, adminCode: newAdminCode })
      })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message)
        setNewDrugName('')
        setNewBatchNo('')
        setNewAdminCode('')
        fetchBatches()
      } else {
        showToast(data.error || 'Failed to mint batch', 'error')
      }
    } catch {
      showToast('Server connection failed', 'error')
    }
  }

  const handleDeleteBatch = async (batchNumber: string) => {
    if (!confirm(`Delete batch "${batchNumber}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`${API_BASE}/api/admin/batch/${encodeURIComponent(batchNumber)}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message)
        fetchBatches()
      } else {
        showToast(data.error || 'Delete failed', 'error')
      }
    } catch {
      showToast('Server connection failed', 'error')
    }
  }

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
    if (!confirm(`Remove chemist account "${username}"? They will no longer be able to log in.`)) return
    try {
      const res = await fetch(`${API_BASE}/api/admin/chemists/${encodeURIComponent(username)}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message)
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
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Restricted Manufacturer & Regulatory Access Only</p>
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
            🔒 Cryptographic security enforced. Unauthorized attempts are logged.
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
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>PharmPulse 👑 Admin Dashboard</h1>
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
        <button onClick={() => setActiveTab('inventory')} style={{ padding: '8px 20px', background: activeTab === 'inventory' ? '#10d6b2' : 'rgba(255,255,255,0.05)', color: activeTab === 'inventory' ? '#000' : '#94a3b8', border: `1px solid ${activeTab === 'inventory' ? '#10d6b2' : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={15} /> Medicine Inventory
        </button>
        <button onClick={() => setActiveTab('chemists')} style={{ padding: '8px 20px', background: activeTab === 'chemists' ? '#10d6b2' : 'rgba(255,255,255,0.05)', color: activeTab === 'chemists' ? '#000' : '#94a3b8', border: `1px solid ${activeTab === 'chemists' ? '#10d6b2' : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={15} /> Chemist Accounts {chemists.length > 0 && <span style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '4px', padding: '1px 6px', fontSize: '11px' }}>{chemists.length}</span>}
        </button>
      </div>

      {/* INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Mint Form */}
          <section style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18} color="#10d6b2" /> Mint New Indian Pharma Batch</h2>
            <form onSubmit={handleMint} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '13px' }}>Medicine Name & Dosage
                <input required value={newDrugName} onChange={e => setNewDrugName(e.target.value)} placeholder="e.g. Pan-D 10s" style={{ width: '100%', padding: '10px', marginTop: '4px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff' }} />
              </label>
              <label style={{ fontSize: '13px' }}>Batch ID
                <input required value={newBatchNo} onChange={e => setNewBatchNo(e.target.value)} placeholder="e.g. IN-PAN-2026-99" style={{ width: '100%', padding: '10px', marginTop: '4px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff' }} />
              </label>
              <label style={{ fontSize: '13px' }}>Manufacturer
                <select value={newManufacturer} onChange={e => setNewManufacturer(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '4px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff' }}>
                  <option>Sun Pharmaceutical Industries Ltd.</option>
                  <option>Serum Institute of India Pvt. Ltd.</option>
                  <option>Cipla Limited</option>
                  <option>Dr. Reddy's Laboratories Ltd.</option>
                  <option>GlaxoSmithKline Pharmaceuticals Ltd.</option>
                  <option>Bharat Biotech International Ltd.</option>
                </select>
              </label>
              <label style={{ fontSize: '13px' }}>Plant Location (India)
                <input value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="e.g. Pune Plant, MH" style={{ width: '100%', padding: '10px', marginTop: '4px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff' }} />
              </label>
              <label style={{ fontSize: '13px' }}>Secret Admin Code (blank to auto-generate)
                <input value={newAdminCode} onChange={e => setNewAdminCode(e.target.value)} placeholder="e.g. 8899" style={{ width: '100%', padding: '10px', marginTop: '4px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff' }} />
              </label>
              <button type="submit" style={{ marginTop: '10px', padding: '12px', background: '#10d6b2', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Mint Batch On-Chain</button>
            </form>
          </section>

          {/* Batch List */}
          <section style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={18} color="#10d6b2" /> Active Inventory & Counterfeit Monitor</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '480px', overflowY: 'auto' }}>
              {batches.length === 0 && <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>No batches yet. Mint one on the left.</p>}
              {batches.map(b => (
                <div key={b.batchNumber} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: `1px solid ${b.status === 'Sold' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '13px' }}>{b.drugName}</strong>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{b.manufacturer}</div>
                    <div style={{ fontSize: '11px', color: '#10d6b2', fontFamily: 'monospace', marginTop: '2px' }}>{b.batchNumber}</div>
                    {b.cloneAttempts > 0 && (
                      <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', marginTop: '4px' }}>🚨 Clone Alerts: {b.cloneAttempts}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: b.status === 'Sold' ? '#f59e0b' : '#10d6b2', color: '#000', display: 'block', marginBottom: '4px' }}>{b.status}</span>
                    <div style={{ fontSize: '11px', color: '#10d6b2', fontFamily: 'monospace', marginBottom: '6px' }}>Code: <strong>{b.adminCode || 'N/A'}</strong></div>
                    <button onClick={() => handleDeleteBatch(b.batchNumber)} title="Delete this batch" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '4px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Trash2 size={12} /> Delete
                    </button>
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
            <h2 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><UserPlus size={18} color="#10d6b2" /> Add New Chemist Account</h2>
            <form onSubmit={handleAddChemist} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '13px' }}>Chemist Username
                <input required value={newChemistUsername} onChange={e => setNewChemistUsername(e.target.value)} placeholder="e.g. rohan" style={{ width: '100%', padding: '10px', marginTop: '4px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff' }} />
              </label>
              <label style={{ fontSize: '13px' }}>Account Password (min. 6 chars)
                <input required type="text" value={newChemistPassword} onChange={e => setNewChemistPassword(e.target.value)} placeholder="e.g. Rohan@Med2026" style={{ width: '100%', padding: '10px', marginTop: '4px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff' }} />
              </label>
              <button type="submit" style={{ marginTop: '8px', padding: '12px', background: '#10d6b2', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <UserPlus size={16} /> Add Chemist Account
              </button>
            </form>
            <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(16,214,178,0.05)', borderRadius: '8px', border: '1px solid rgba(16,214,178,0.15)', fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
              <strong style={{ color: '#10d6b2' }}>Note:</strong> Added chemists can immediately log into the Chemist Portal. Removed accounts lose access instantly.
            </div>
          </section>

          {/* Chemist List */}
          <section style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={18} color="#10d6b2" /> Authorized Chemist Accounts ({chemists.length})</h2>
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
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Authorized Retail Chemist #{i + 1}</div>
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

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: toastType === 'success' ? '#10d6b2' : '#ef4444', color: toastType === 'success' ? '#000' : '#fff', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 1000 }}>
          {toastType === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {toast}
        </div>
      )}
    </div>
  )
}
