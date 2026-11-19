'use client'

import { useState, useEffect } from 'react'
import { ScanLine, ShieldCheck, AlertTriangle, FlaskConical, CheckCircle2, Lock, LogOut } from 'lucide-react'

export default function VerifyPage() {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [query, setQuery] = useState('IN-COV-2026-889')
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [adminCodeInput, setAdminCodeInput] = useState('')
  const [batches, setBatches] = useState<any[]>([])
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)

  // Check saved chemist session
  useEffect(() => {
    const saved = localStorage.getItem('pharmpulse_chemist_user')
    if (saved) {
      setCurrentUser(saved)
    }
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    const normalizedUser = loginUsername.trim().toLowerCase()

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: normalizedUser,
          password: loginPassword,
          portal: 'chemist'
        })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        localStorage.setItem('pharmpulse_chemist_user', data.user.username)
        setCurrentUser(data.user.username)
        setLoginUsername('')
        setLoginPassword('')
        showToast(`Welcome, Chemist ${data.user.username}!`)
      } else {
        setLoginError(data.error || 'Access Denied: Invalid Chemist credentials.')
      }
    } catch {
      setLoginError('Backend offline. Please try again later.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('pharmpulse_chemist_user')
    setCurrentUser(null)
    setVerificationResult(null)
    showToast('Chemist session closed.')
  }

  const fetchBatches = async () => {
    if (!currentUser) return
    try {
      const res = await fetch(`${API_BASE}/api/drugs/batches`)
      const data = await res.json()
      if (res.ok) setBatches(data)
    } catch {
      // Silent catch
    }
  }

  const verifyBatch = async (id: string) => {
    if (!id || !currentUser) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/drugs/verify/${encodeURIComponent(id.trim())}`)
      const data = await res.json()
      if (res.ok) {
        setVerificationResult(data)
      } else {
        setVerificationResult({ error: data.error || 'Verification failed' })
      }
    } catch {
      setVerificationResult({ error: 'Network error: Unable to reach the secure verification node.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    if (currentUser) fetchBatches() 
  }, [currentUser])

  useEffect(() => { 
    if (currentUser) verifyBatch(query) 
  }, [query, currentUser])

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminCodeInput) {
      showToast('Please enter the secret Admin Code')
      return
    }

    try {
      const res = await fetch(`${API_BASE}/api/drugs/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchNumber: query, adminCode: adminCodeInput })
      })
      const data = await res.json()
      if (res.ok) {
        showToast('Success: Medicine dispensed and permanently locked.')
        setVerificationResult({
          ...verificationResult,
          status: 'Sold'
        })
        setAdminCodeInput('')
        fetchBatches()
      } else {
        showToast(data.error || 'Invalid Admin Code')
      }
    } catch {
      showToast('Connection error during redemption')
    }
  }

  // --- CHEMIST LOGIN SCREEN ---
  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', background: '#090d16', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '420px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '36px', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(16, 214, 178, 0.1)', borderRadius: '12px', marginBottom: '12px' }}>
              <ScanLine color="#10d6b2" size={32} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 6px 0' }}>Chemist Portal Access</h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Authorized Retail Chemist & Hospital Dispensary Login</p>
          </div>

          {loginError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', color: '#ef4444', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} /> {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Chemist Username</label>
              <input
                required
                type="text"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                placeholder="e.g. harsh, sumedh, avadhut, praditha"
                style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Account Password</label>
              <input
                required
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="Enter password"
                style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              style={{ marginTop: '8px', padding: '12px', background: '#10d6b2', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Lock size={16} /> {loginLoading ? 'Verifying...' : 'Sign In as Chemist'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
            Only verified pharmacy and hospital partners may dispense medicines.
          </div>
        </div>
      </div>
    )
  }

  // --- AUTHENTICATED CHEMIST DASHBOARD ---
  return (
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#fff', padding: '32px', fontFamily: 'sans-serif' }}>
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FlaskConical color="#10d6b2" size={26} />
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>PharmPulse 🔍 Chemist & Verifier Portal</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>Decentralized Anti-Counterfeit Point-of-Sale Gate</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '13px', color: '#10d6b2', fontWeight: 600 }}>
            👤 Chemist: <strong>{currentUser}</strong>
          </span>
          <button 
            onClick={handleLogout} 
            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={14} /> Sign Out
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 214, 178, 0.1)', border: '1px solid #10d6b2', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', color: '#10d6b2', fontWeight: 'bold' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10d6b2', display: 'inline-block' }} />
            Network Node Active
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        
        {/* Verification Section */}
        <section style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ScanLine size={20} color="#10d6b2" />
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Scan Medicine QR & Verify Authenticity</h2>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
            Enter or scan a package batch ID to verify Indian pharmaceutical compliance and execute point-of-sale locking.
          </p>

          {/* Search Bar */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
              placeholder="Enter Batch ID (e.g. IN-COV-2026-889)" 
              style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '14px' }} 
            />
            <button 
              onClick={() => verifyBatch(query)} 
              style={{ padding: '0 24px', background: '#10d6b2', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
            >
              {loading ? 'Checking...' : 'Verify'}
            </button>
          </div>

          {/* Quick Select Test Batches */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Quick Test Batches:</span>
            {batches.map(b => (
              <button 
                key={b.batchNumber} 
                onClick={() => setQuery(b.batchNumber)} 
                style={{ 
                  background: query === b.batchNumber ? 'rgba(16, 214, 178, 0.2)' : 'rgba(255,255,255,0.05)', 
                  border: `1px solid ${query === b.batchNumber ? '#10d6b2' : 'rgba(255,255,255,0.1)'}`, 
                  padding: '6px 12px', 
                  borderRadius: '6px', 
                  color: query === b.batchNumber ? '#10d6b2' : '#cbd5e1', 
                  cursor: 'pointer', 
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                {b.batchNumber}
              </button>
            ))}
          </div>

          {/* Result Display Card */}
          {verificationResult && (
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {verificationResult.error ? (
                <div style={{ color: '#ef4444', fontSize: '14px', display: 'flex', alignItems: 'flex-start', gap: '10px', lineHeight: '1.5' }}>
                  <AlertTriangle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '15px', marginBottom: '4px' }}>COUNTERFEIT ALERT / UNRECOGNIZED BATCH</strong>
                    {verificationResult.error}
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {verificationResult.warning ? (
                        <AlertTriangle color="#ef4444" size={24} />
                      ) : (
                        <ShieldCheck color="#10d6b2" size={24} />
                      )}
                      <div>
                        <strong style={{ fontSize: '16px', color: verificationResult.warning ? '#ef4444' : '#10d6b2', display: 'block' }}>
                          {verificationResult.warning ? 'COUNTERFEIT / CLONE ALERT!' : 'Authentic Indian Medicine Verified'}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Cryptographic Registry Ledger Confirmed</span>
                      </div>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', background: verificationResult.status === 'Sold' ? '#f59e0b' : '#10d6b2', color: '#000' }}>
                      {verificationResult.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '14px', lineHeight: '1.8', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Medicine:</span>
                      <strong style={{ textAlign: 'right' }}>{verificationResult.drugName}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Manufacturer:</span>
                      <strong style={{ textAlign: 'right' }}>{verificationResult.manufacturer}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Batch ID:</span>
                      <strong style={{ fontFamily: 'monospace', color: '#10d6b2' }}>{verificationResult.batchNumber}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Plant Location:</span>
                      <strong style={{ textAlign: 'right' }}>📍 {verificationResult.location}</strong>
                    </div>
                  </div>

                  {verificationResult.warning && (
                    <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', fontSize: '13px', fontWeight: 600, marginBottom: '16px', lineHeight: '1.5' }}>
                      {verificationResult.warning}
                    </div>
                  )}

                  {verificationResult.status === 'Active' && (
                    <form onSubmit={handleRedeem} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                      <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Lock size={14} color="#10d6b2" /> <strong>Point of Sale Dispensing Gate:</strong> Enter secret Admin Code from packaging to permanently lock this QR code against cloning.
                      </p>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                          type="password" 
                          value={adminCodeInput} 
                          onChange={e => setAdminCodeInput(e.target.value)} 
                          placeholder="Enter Secret Code from Package" 
                          style={{ flex: 1, padding: '10px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '14px' }} 
                        />
                        <button type="submit" style={{ padding: '10px 20px', background: '#10d6b2', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                          Lock as Sold
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        {/* Live QR Code Box Sidebar */}
        <aside style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '16px', letterSpacing: '0.5px' }}>LIVE PACKAGE QR CODE</div>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', display: 'inline-block', marginBottom: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(query)}`} 
                alt="Medicine Batch QR Code" 
                width={160} 
                height={160} 
              />
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#10d6b2', fontFamily: 'monospace' }}>{query}</div>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '20px', lineHeight: '1.5', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
            Scan this QR code using any reader or select test batches above to simulate real-world chemist counter verification.
          </div>
        </aside>

      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#10d6b2', color: '#000', padding: '14px 22px', borderRadius: '10px', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1000 }}>
          <CheckCircle2 size={18} /> {toast}
        </div>
      )}
    </div>
  )
}
