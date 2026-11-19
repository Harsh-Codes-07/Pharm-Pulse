'use client'

import { useState, useEffect } from 'react'
import {
  AlertTriangle, BadgeCheck, Bell, FlaskConical, Globe2,
  Package, Plus, ScanLine, Search, ShieldCheck, Wallet, Shield
} from 'lucide-react'

export function PharmPulseDashboard() {
  const [portalMode, setPortalMode] = useState<'admin' | 'client'>('admin')
  const [dark, setDark] = useState(true)
  const [batches, setBatches] = useState<any[]>([])
  const [query, setQuery] = useState('IN-COV-2026-889')
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [adminCodeInput, setAdminCodeInput] = useState('')
  const [toast, setToast] = useState('')
  
  const [newDrugName, setNewDrugName] = useState('')
  const [newBatchNo, setNewBatchNo] = useState('')
  const [newManufacturer, setNewManufacturer] = useState('Sun Pharmaceutical Industries Ltd.')
  const [newLocation, setNewLocation] = useState('Pune Plant, Maharashtra, India')
  const [newAdminCode, setNewAdminCode] = useState('')

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3500)
  }

  const fetchBatches = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/drugs/batches')
      const data = await res.json()
      if (res.ok) setBatches(data)
    } catch {
      showToast('Backend server offline')
    }
  }

  const verifyBatch = async (id: string) => {
    if (!id) return
    try {
      const res = await fetch(`http://localhost:5000/api/drugs/verify/${encodeURIComponent(id)}`)
      const data = await res.json()
      if (res.ok) {
        setVerificationResult(data)
      } else {
        setVerificationResult({ error: data.error, warning: data.error })
      }
    } catch {
      showToast('Error connecting to backend verification server')
    }
  }

  useEffect(() => {
    fetchBatches()
  }, [])

  useEffect(() => {
    if (portalMode === 'client') {
      verifyBatch(query)
    }
  }, [query, portalMode])

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('http://localhost:5000/api/drugs/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          drugName: newDrugName, 
          batchNumber: newBatchNo, 
          manufacturer: newManufacturer,
          location: newLocation, 
          adminCode: newAdminCode 
        })
      })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message)
        setNewDrugName('')
        setNewBatchNo('')
        setNewAdminCode('')
        fetchBatches()
      } else {
        showToast(data.error || 'Failed to mint batch')
      }
    } catch {
      showToast('Failed to connect to backend')
    }
  }

  const handleRedeem = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/drugs/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchNumber: query, adminCode: adminCodeInput })
      })
      const data = await res.json()
      if (res.ok) {
        showToast('Success: Medicine dispensed and locked as SOLD.')
        setVerificationResult(data.record)
        setAdminCodeInput('')
        fetchBatches()
      } else {
        showToast(data.error || 'Invalid admin code')
      }
    } catch {
      showToast('Connection error')
    }
  }

  return (
    <div className={`app-shell ${dark ? 'theme-dark' : 'theme-light'}`} style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>  <header className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}> <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}> <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}> <div className="brand-mark"><FlaskConical size={19} /></div> <span className="brand-name">pharm<span>pulse</span></span> <span style={{ fontSize: '10px', background: '#10d6b2', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>INDIA REGISTRY</span> </div>  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px', marginLeft: '24px' }}> <button onClick={() => setPortalMode('admin')} style={{ background: portalMode === 'admin' ? '#10d6b2' : 'transparent', color: portalMode === 'admin' ? '#000' : 'inherit', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }} > 👑 Admin Portal (Mint Batches & Codes) </button> <button onClick={() => setPortalMode('client')} style={{ background: portalMode === 'client' ? '#10d6b2' : 'transparent', color: portalMode === 'client' ? '#000' : 'inherit', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }} > 🔍 Chemist / Customer QR Scanner </button> </div> </div>  <div className="top-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}> <div className="network-pill"><i className="status-dot" /><span>India L2 Network</span></div> <button className="theme-switch" onClick={() => setDark(!dark)}><span>{dark ? '◐' : '☼'}</span></button> </div> </header>  <main className="content" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>  {portalMode === 'admin' ? ( <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>  <section className="panel" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}> <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}> <Plus size={20} color="#10d6b2" /> <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Mint Indian Pharma Batch</h2> </div> <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}> Register a new authentic medicine batch produced in an Indian manufacturing plant with an automated Admin Code. </p>  <form onSubmit={handleMint} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}> <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}> Medicine Name & Dosage <input required value={newDrugName} onChange={e => setNewDrugName(e.target.value)} placeholder="e.g. Augmentin 625 Duo · 10s" style={{ padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: 'inherit' }} /> </label>  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}> Batch ID / Serial Number <input required value={newBatchNo} onChange={e => setNewBatchNo(e.target.value)} placeholder="e.g. IN-AUG-2026-901" style={{ padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: 'inherit' }} /> </label>  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}> Indian Manufacturer <select value={newManufacturer} onChange={e => setNewManufacturer(e.target.value)} style={{ padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: 'inherit' }} > <option>Sun Pharmaceutical Industries Ltd.</option> <option>Serum Institute of India Pvt. Ltd.</option> <option>Cipla Limited</option> <option>Dr. Reddy's Laboratories Ltd.</option> <option>Lupin Pharmaceuticals</option> </select> </label>  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}> Manufacturing Plant Location (India) <input value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="e.g. Hinjewadi Biotech Park, Pune, Maharashtra" style={{ padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: 'inherit' }} /> </label>  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}> Secret Admin Code (Leave blank to auto-generate) <input value={newAdminCode} onChange={e => setNewAdminCode(e.target.value)} placeholder="e.g. 7788" style={{ padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: 'inherit' }} /> </label>  <button type="submit" className="primary-button" style={{ marginTop: '10px', padding: '12px', background: '#10d6b2', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}> Mint Batch & Generate QR </button> </form> </section>  <section className="panel" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}> <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}> <Shield size={20} color="#10d6b2" /> <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Indian Factories Inventory & Admin Codes</h2> </div> <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}> Real batches registered in Indian manufacturing plants. Use these admin codes at checkout. </p>  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '440px', overflowY: 'auto' }}> {batches.map(b => ( <div key={b.batchNumber} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> <div> <strong style={{ display: 'block', fontSize: '14px' }}>{b.drugName}</strong> <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>{b.manufacturer}</span> <span style={{ fontSize: '11px', color: '#10d6b2' }}>Batch: {b.batchNumber} · 📍 {b.location}</span> </div> <div style={{ textAlign: 'right' }}> <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: b.status === 'Sold' ? '#f59e0b' : '#10d6b2', color: '#000' }}> {b.status} </span> <div style={{ fontSize: '12px', marginTop: '4px', fontFamily: 'monospace', color: '#10d6b2' }}> Admin Code: <strong>{b.adminCode}</strong> </div> </div> </div> ))} </div> </section>  </div> ) : ( <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>  <section className="panel" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}> <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}> <ScanLine size={20} color="#10d6b2" /> <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Medicine Authenticity & Counterfeit Guard</h2> </div> <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}> Scan or lookup a batch ID. If a counterfeiter tries to copy and re-scan a sold QR code, the system immediately flags a clone alert. </p>  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}> <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Enter Batch ID (e.g. IN-COV-2026-889)" style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: 'inherit' }} /> <button onClick={() => verifyBatch(query)} className="primary-button" style={{ padding: '10px 20px', background: '#10d6b2', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}> Scan / Lookup </button> </div>  <div className="search-hint" style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}> <span style={{ fontSize: '12px', color: '#94a3b8', alignSelf: 'center' }}>Test Indian batches:</span> {batches.map(b => ( <button key={b.batchNumber} type="button" onClick={() => setQuery(b.batchNumber)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', color: '#10d6b2', cursor: 'pointer', fontSize: '12px' }}> {b.batchNumber} </button> ))} </div>  {verificationResult && ( <div style={{ padding: '18px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>  {verificationResult.error ? ( <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', fontSize: '14px' }}> <AlertTriangle size={18} style={{ display: 'inline', marginRight: '6px' }} /> <strong>{verificationResult.error}</strong> </div> ) : ( <> <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}> <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}> {verificationResult.warning ? <AlertTriangle color="#ef4444" size={22} /> : <ShieldCheck color="#10d6b2" size={22} />} <strong style={{ fontSize: '15px', color: verificationResult.warning ? '#ef4444' : '#10d6b2' }}> {verificationResult.warning ? 'COUNTERFEIT / CLONE ALERT!' : 'Authentic Indian Pharma Verified'} </strong> </div> <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', background: verificationResult.status === 'Sold' ? '#f59e0b' : '#10d6b2', color: '#000' }}> {verificationResult.status} </span> </div>  <div style={{ fontSize: '14px', marginBottom: '14px', lineHeight: '1.6' }}> <p><strong>Medicine:</strong> {verificationResult.drugName}</p> <p><strong>Manufacturer:</strong> {verificationResult.manufacturer}</p> <p><strong>Batch ID:</strong> {verificationResult.batchNumber}</p> <p><strong>Plant Location:</strong> 📍 {verificationResult.location}</p> </div>  {verificationResult.warning && ( <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', fontSize: '13px', marginBottom: '14px', fontWeight: 500 }}> {verificationResult.warning} </div> )}  {verificationResult.status === 'Active' && ( <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}> <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}> 🔒 <strong>Point of Sale Dispensing Gate:</strong> Enter the Admin Code to mark this medicine as SOLD and lock the QR code against duplication. </p> <div style={{ display: 'flex', gap: '10px' }}> <input type="password" value={adminCodeInput} onChange={e => setAdminCodeInput(e.target.value)} placeholder="Enter Admin Code (e.g. 5544)" style={{ flex: 1, padding: '8px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: 'inherit' }} /> <button onClick={handleRedeem} style={{ padding: '8px 16px', background: '#10d6b2', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}> Confirm & Lock as Sold </button> </div> </div> )} </> )} </div> )} </section>  <aside className="panel" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}> <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '12px' }}>LIVE MEDICINE QR CODE</div> <div style={{ background: '#fff', padding: '16px', borderRadius: '10px', display: 'inline-block', marginBottom: '16px' }}> <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(query)}`}
                  alt="QR Code"
                  width={160}
                  height={160}
                />
              </div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: '#10d6b2' }}>{query}</div>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                Scan this QR. Once locked with the Admin Code, any subsequent scan triggers a red counterfeit alarm.
              </p>
            </aside>

          </div>
        )}

      </main>

      {toast && <div className="toast" style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#10d6b2', color: '#000', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}><BadgeCheck size={16} style={{ display: 'inline', marginRight: '6px' }} />{toast}</div>}
    </div>
  )
}