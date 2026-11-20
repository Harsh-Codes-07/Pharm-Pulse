'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ScanLine,
  ShieldCheck,
  AlertTriangle,
  FlaskConical,
  CheckCircle2,
  Lock,
  LogOut,
  Camera,
  X,
  Upload,
  User,
  ExternalLink,
  Sparkles,
  QrCode
} from 'lucide-react'

export default function VerifyPage() {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  
  // Chemist Login Modal State
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Query & Verification State
  const [query, setQuery] = useState('IN-COV-2026-889')
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [adminCodeInput, setAdminCodeInput] = useState('')
  const [batches, setBatches] = useState<any[]>([])
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentOrigin, setCurrentOrigin] = useState('https://pharm-pulse-lw97.vercel.app')

  // Live Camera Scanner State
  const [scannerOpen, setScannerOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<any>(null)

  // Check saved chemist session and URL query parameter on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentOrigin(window.location.origin)

      // Restore chemist login session if present
      const saved = localStorage.getItem('pharmpulse_chemist_user')
      if (saved) {
        setCurrentUser(saved)
      }

      // Read ?batch= or ?id= parameter from URL
      const params = new URLSearchParams(window.location.search)
      const batchParam = params.get('batch') || params.get('id')
      if (batchParam) {
        const cleanId = batchParam.trim()
        setQuery(cleanId)
        verifyBatch(cleanId)
      } else {
        verifyBatch('IN-COV-2026-889')
      }

      fetchBatches()
    }
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  // Fetch batches for quick-select test buttons
  const fetchBatches = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/drugs/batches`)
      const data = await res.json()
      if (res.ok && Array.isArray(data)) {
        setBatches(data)
      }
    } catch {
      // Silent catch
    }
  }

  // Extract clean batch number if a full URL was scanned
  const extractBatchId = (scannedText: string): string => {
    const trimmed = scannedText.trim()
    try {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const url = new URL(trimmed)
        const batchParam = url.searchParams.get('batch') || url.searchParams.get('id')
        if (batchParam) return batchParam.trim()
      }
    } catch {}
    return trimmed
  }

  // Verify medicine batch by ID
  const verifyBatch = async (id: string) => {
    if (!id || id.trim() === '') return
    const cleanId = extractBatchId(id)
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/drugs/verify/${encodeURIComponent(cleanId)}`)
      const data = await res.json()
      if (res.ok) {
        setVerificationResult(data)
      } else {
        setVerificationResult({ error: data.error || 'Verification failed: Batch not found in register.' })
      }
    } catch {
      setVerificationResult({ error: 'Network error: Unable to reach the secure verification ledger.' })
    } finally {
      setLoading(false)
    }
  }

  // Chemist Authentication Handler
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
        setShowLoginModal(false)
        showToast(`Welcome, Chemist ${data.user.username}! POS Dispensing unlocked.`)
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
    showToast('Chemist session closed. Switched to Public Verification Mode.')
  }

  // Point of Sale Dispensing / Lock as Sold Handler
  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      setShowLoginModal(true)
      showToast('Please sign in as an authorized chemist to dispense medicines.')
      return
    }

    if (!adminCodeInput) {
      showToast('Please enter the secret Admin Code from packaging')
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
        showToast('Success: Medicine dispensed and permanently locked as SOLD.')
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

  // --- CAMERA SCANNER LOGIC ---
  const startCameraScanner = async () => {
    setScannerOpen(true)
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Check if native BarcodeDetector is available
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await detector.detect(videoRef.current)
              if (barcodes.length > 0) {
                const scannedValue = barcodes[0].rawValue
                if (scannedValue) {
                  onCodeDetected(scannedValue)
                }
              }
            } catch {}
          }
        }, 300)
      }
    } catch (err: any) {
      setCameraError('Unable to access camera. Please allow camera permissions or enter the Batch ID manually.')
    }
  }

  const stopCameraScanner = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setScannerOpen(false)
  }

  const onCodeDetected = (rawValue: string) => {
    stopCameraScanner()
    const cleanId = extractBatchId(rawValue)
    setQuery(cleanId)
    verifyBatch(cleanId)
    showToast(`QR Code Scanned: ${cleanId}`)
  }

  // Fallback Image File Upload for QR Code decoding
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // If BarcodeDetector is available in window
    if ('BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
        const bitmap = await createImageBitmap(file)
        const barcodes = await detector.detect(bitmap)
        if (barcodes.length > 0 && barcodes[0].rawValue) {
          onCodeDetected(barcodes[0].rawValue)
          return
        }
      } catch {}
    }

    // Free QR API decoder fallback
    try {
      showToast('Decoding QR code image...')
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('https://api.qrserver.com/v1/read-qr-code/', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      const text = data?.[0]?.symbol?.[0]?.data
      if (text) {
        onCodeDetected(text)
      } else {
        showToast('No QR code detected in the uploaded image. Please enter Batch ID.')
      }
    } catch {
      showToast('Could not decode QR image. Please enter Batch ID manually.')
    }
  }

  // Full URL encoded in QR Code so any phone camera opens this exact verification result
  const qrVerificationUrl = `${currentOrigin}/?batch=${encodeURIComponent(query)}`

  return (
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#fff', padding: '24px 32px', fontFamily: 'sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', padding: '8px', background: 'rgba(16,214,178,0.12)', borderRadius: '10px' }}>
            <FlaskConical color="#10d6b2" size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              PharmPulse 🔍 Medicine Authenticity Gate
            </h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
              Blockchain Anti-Counterfeit Verification for Patients, Doctors & Authorized Chemists
            </p>
          </div>
        </div>

        {/* User Status / Chemist Login Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(16,214,178,0.08)', border: '1px solid rgba(16,214,178,0.3)', padding: '6px 14px', borderRadius: '8px' }}>
              <span style={{ fontSize: '13px', color: '#10d6b2', fontWeight: 600 }}>
                👤 Chemist: <strong>{currentUser}</strong> (POS Active)
              </span>
              <button
                onClick={handleLogout}
                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <LogOut size={12} /> Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#cbd5e1',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Lock size={14} color="#10d6b2" /> Chemist Portal Sign In
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 214, 178, 0.1)', border: '1px solid #10d6b2', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', color: '#10d6b2', fontWeight: 'bold' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10d6b2', display: 'inline-block' }} />
            Ledger Node Active
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
            Point any phone camera at the QR code, use your camera scanner below, or enter the Batch ID to verify official Indian regulatory compliance.
          </p>

          {/* Search Bar & Camera Scan Button */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <input 
                value={query} 
                onChange={e => setQuery(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && verifyBatch(query)}
                placeholder="Enter or scan Batch ID (e.g. IN-COV-2026-889)" 
                style={{ width: '100%', padding: '12px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }} 
              />
            </div>
            
            <button 
              onClick={() => verifyBatch(query)} 
              style={{ padding: '0 24px', background: '#10d6b2', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', height: '44px' }}
            >
              {loading ? 'Checking...' : 'Verify'}
            </button>

            <button
              onClick={startCameraScanner}
              style={{ padding: '0 18px', background: 'rgba(16,214,178,0.12)', border: '1px solid #10d6b2', color: '#10d6b2', fontWeight: 600, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', height: '44px' }}
            >
              <Camera size={16} /> Scan with Camera
            </button>
          </div>

          {/* Quick Select Test Batches */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Quick Test Batches:</span>
            {batches.map(b => (
              <button 
                key={b.batchNumber} 
                onClick={() => {
                  setQuery(b.batchNumber)
                  verifyBatch(b.batchNumber)
                }} 
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
            <div style={{ padding: '22px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {verificationResult.error ? (
                <div style={{ color: '#ef4444', fontSize: '14px', display: 'flex', alignItems: 'flex-start', gap: '12px', lineHeight: '1.5' }}>
                  <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '16px', marginBottom: '4px' }}>COUNTERFEIT ALERT / UNRECOGNIZED BATCH</strong>
                    {verificationResult.error}
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>
                      This medicine ID has not been authenticated by any authorized manufacturer on the national ledger. Do not consume.
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Status Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {verificationResult.warning ? (
                        <AlertTriangle color="#ef4444" size={28} />
                      ) : (
                        <ShieldCheck color="#10d6b2" size={28} />
                      )}
                      <div>
                        <strong style={{ fontSize: '17px', color: verificationResult.warning ? '#ef4444' : '#10d6b2', display: 'block' }}>
                          {verificationResult.warning ? 'COUNTERFEIT / DUPLICATE CLONE ALERT!' : 'Authentic Indian Medicine Verified'}
                        </strong>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Cryptographic National Ledger Confirmed</span>
                      </div>
                    </div>
                    <span style={{ padding: '4px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', background: verificationResult.status === 'Sold' ? '#f59e0b' : '#10d6b2', color: '#000' }}>
                      {verificationResult.status}
                    </span>
                  </div>

                  {/* Rich Medicine Details Grid */}
                  <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px' }}>Medicine Name & Dosage</span>
                        <strong style={{ color: '#fff', fontSize: '15px' }}>{verificationResult.drugName}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px' }}>Batch ID</span>
                        <strong style={{ fontFamily: 'monospace', color: '#10d6b2', fontSize: '15px' }}>{verificationResult.batchNumber}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px' }}>Manufacturer</span>
                        <strong style={{ color: '#fff' }}>{verificationResult.manufacturer}</strong>
                      </div>
                      {verificationResult.marketedBy && (
                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px' }}>Marketed By</span>
                          <strong style={{ color: '#fff' }}>{verificationResult.marketedBy}</strong>
                        </div>
                      )}
                      <div>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px' }}>Plant Location (Manufacturing Facility)</span>
                        <strong style={{ color: '#fff' }}>📍 {verificationResult.location}</strong>
                      </div>
                      {verificationResult.price && (
                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px' }}>Maximum Retail Price (MRP)</span>
                          <strong style={{ color: '#10d6b2', fontSize: '14px' }}>{verificationResult.price}</strong>
                        </div>
                      )}
                      {verificationResult.manufactureDate && (
                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px' }}>Date of Manufacture (MFG)</span>
                          <strong style={{ color: '#cbd5e1' }}>📅 {verificationResult.manufactureDate}</strong>
                        </div>
                      )}
                      {verificationResult.expiryDate && (
                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px' }}>Date of Expiry (EXP)</span>
                          <strong style={{ color: '#f59e0b' }}>⏳ {verificationResult.expiryDate}</strong>
                        </div>
                      )}
                    </div>

                    {verificationResult.contents && (
                      <div style={{ background: 'rgba(16,214,178,0.05)', border: '1px solid rgba(16,214,178,0.18)', padding: '12px 14px', borderRadius: '8px', fontSize: '12px' }}>
                        <span style={{ color: '#10d6b2', fontWeight: 600 }}>Active Ingredients & Contents: </span>
                        <span style={{ color: '#e2e8f0' }}>{verificationResult.contents}</span>
                      </div>
                    )}
                  </div>

                  {/* Warning Box for Sold / Cloned Medicine */}
                  {verificationResult.warning && (
                    <div style={{ padding: '14px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', fontSize: '13px', fontWeight: 600, marginBottom: '16px', lineHeight: '1.5' }}>
                      {verificationResult.warning}
                    </div>
                  )}

                  {/* Point-of-Sale Dispensing Gate */}
                  {verificationResult.status === 'Active' && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                      <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Lock size={14} color="#10d6b2" /> <strong>Point-of-Sale Dispensing Gate:</strong> Enter packaging Admin Code to lock this medicine as SOLD against clone attempts.
                      </p>

                      {currentUser ? (
                        <form onSubmit={handleRedeem} style={{ display: 'flex', gap: '10px' }}>
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
                        </form>
                      ) : (
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94a3b8' }}>
                          <span>Dispensing lock requires authorized chemist login.</span>
                          <button
                            onClick={() => setShowLoginModal(true)}
                            style={{ background: '#10d6b2', border: 'none', color: '#000', fontWeight: 'bold', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                          >
                            Sign In to Dispense
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        {/* Live QR Code Box Sidebar */}
        <aside style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '14px', letterSpacing: '0.5px' }}>
              LIVE MEDICINE QR CODE
            </div>
            
            {/* The QR Code Image encodes the full web URL so any phone camera immediately opens verification */}
            <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', display: 'inline-block', marginBottom: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrVerificationUrl)}`} 
                alt="Medicine Batch QR Code" 
                width={180} 
                height={180} 
              />
            </div>

            <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#10d6b2', fontFamily: 'monospace' }}>
              {query}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', wordBreak: 'break-all' }}>
              Encodes direct link: <br />
              <span style={{ color: '#94a3b8' }}>{qrVerificationUrl}</span>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '20px', lineHeight: '1.5', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'left' }}>
            <strong style={{ color: '#10d6b2', display: 'block', marginBottom: '4px' }}>📱 How to Test Scanning:</strong>
            1. Open the camera on your phone.<br />
            2. Point it at the QR code above.<br />
            3. Tap the link that appears — it opens this verification report directly!
          </div>
        </aside>

      </div>

      {/* CAMERA SCANNER MODAL */}
      {scannerOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '480px', background: '#0e1526', border: '1px solid rgba(16,214,178,0.3)', borderRadius: '16px', padding: '24px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={20} color="#10d6b2" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Scan Medicine QR Code</h3>
              </div>
              <button onClick={stopCameraScanner} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {cameraError ? (
              <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>
                {cameraError}
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%', height: '280px', background: '#000', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                <video
                  ref={videoRef}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  playsInline
                  muted
                />
                {/* Target overlay */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ width: '180px', height: '180px', border: '2px solid #10d6b2', borderRadius: '12px', boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
                </div>
              </div>
            )}

            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
              Align the QR code on the medicine packaging within the box.
            </p>

            {/* Fallback image upload button */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', color: '#10d6b2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={14} /> Upload QR Photo
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
              <button
                onClick={stopCameraScanner}
                style={{ padding: '6px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHEMIST LOGIN MODAL */}
      {showLoginModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '400px', background: '#0e1526', border: '1px solid rgba(16,214,178,0.3)', borderRadius: '16px', padding: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={20} color="#10d6b2" />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold' }}>Chemist Portal Sign In</h3>
              </div>
              <button onClick={() => setShowLoginModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {loginError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', color: '#ef4444', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} /> {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Chemist Username</label>
                <input
                  required
                  type="text"
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  placeholder="e.g. harsh, sumedh, avadhut"
                  style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Password</label>
                <input
                  required
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Enter chemist password"
                  style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                style={{ marginTop: '6px', padding: '11px', background: '#10d6b2', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Lock size={15} /> {loginLoading ? 'Verifying...' : 'Sign In as Chemist'}
              </button>
            </form>

            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
              Authorized chemists can execute point-of-sale dispensing and lock medicines as SOLD.
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#10d6b2', color: '#000', padding: '14px 22px', borderRadius: '10px', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 3000 }}>
          <CheckCircle2 size={18} /> {toast}
        </div>
      )}
    </div>
  )
}
