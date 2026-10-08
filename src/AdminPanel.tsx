import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2, XCircle, Clock, RefreshCw,
  ChevronDown, ChevronUp, CalendarDays, MapPin, Phone,
  Users, Package, ClipboardCheck, Filter, LogOut, Search,
  Trash2, Printer, FileText, Boxes, X, AlertTriangle, Layers
} from 'lucide-react'
import { supabase } from './lib/supabase'
import './AdminPanel.css'

type Status = 'pending' | 'reviewed' | 'recommended' | 'approved' | 'rejected'

type Request = {
  id: string
  requester_name: string
  department_college: string
  contact_number: string
  event_organizer: string
  event_name: string
  event_date: string
  start_time: string
  end_time: string
  venue_location: string
  requested_items: string[]
  reviewed_by: string | null
  recommending_approval_by: string | null
  approved_by: string | null
  status: Status
  created_at: string
}

const APPROVER_NAMES = {
  reviewed: 'Van Dexter R. Lachica',
  recommended: 'Dr. Robert B. Pabillaran',
  approved: 'Dr. Maria Noeleen M. Borbajo',
}

const STATUS_META: Record<Status, { label: string; color: string }> = {
  pending:     { label: 'Pending',     color: 'status-pending' },
  reviewed:    { label: 'Reviewed',    color: 'status-reviewed' },
  recommended: { label: 'Recommended', color: 'status-recommended' },
  approved:    { label: 'Approved',    color: 'status-approved' },
  rejected:    { label: 'Rejected',    color: 'status-rejected' },
}

function formatDate(v: string) {
  if (!v) return ''
  return new Date(`${v}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatFullDate(v: string) {
  if (!v) return ''
  return new Date(`${v}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function formatTime(v: string) {
  if (!v) return ''
  const [h, m] = v.split(':').map(Number)
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function getControlNumber(id: string, date: string) {
  const cleanDate = (date || '2026-01-01').replace(/-/g, '')
  const shortId = id.slice(0, 5).toUpperCase()
  return `LLCC-INV-${cleanDate}-${shortId}`
}

// ── Login Screen ─────────────────────────────────────────────────────────────
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || 'llcc2026'

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pw === ADMIN_PASS) { onLogin() }
    else { setErr('Incorrect password. Please try again.'); setPw('') }
  }
  return (
    <div className="admin-login-shell">
      <div className="admin-login-card">
        <img src="/llcc-logo.webp" alt="LLCC Logo" className="admin-login-logo-img" />
        <p className="admin-login-org">Lapu-Lapu City College</p>
        <h1 className="admin-login-title">Admin Portal</h1>
        <p className="admin-login-sub">Equipment Request Review &amp; Inventory Management</p>
        <form onSubmit={submit} className="admin-login-form">
          <label>
            <span>Admin Password</span>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Enter Admin password"
              autoFocus
              required
            />
          </label>
          {err && <p className="admin-login-err">{err}</p>}
          <button type="submit" className="admin-login-btn">Access Portal</button>
        </form>
        <p className="admin-login-hint">Default password: <code>llcc2026</code></p>
      </div>
    </div>
  )
}

// ── Single Event Inventory Slip Modal ─────────────────────────────────────────
function InventorySlipModal({ req, onClose }: { req: Request; onClose: () => void }) {
  const controlNo = getControlNumber(req.id, req.event_date)

  function handlePrint() {
    window.print()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="inventory-modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header-actions no-print">
          <div className="modal-title-wrap">
            <FileText size={18} className="modal-title-icon" />
            <div>
              <h3>Equipment Inventory &amp; Dispatch Slip</h3>
              <p>Official dispatch form for {req.event_name}</p>
            </div>
          </div>
          <div className="modal-btns">
            <button className="print-btn" onClick={handlePrint}>
              <Printer size={15} /> Print / Save PDF
            </button>
            <button className="close-btn" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Voucher */}
        <div className="slip-sheet print-target">
          {/* Header */}
          <div className="slip-header">
            <div className="slip-logo-block">
              <img src="/llcc-logo.webp" alt="LLCC Logo" className="slip-crest-img" />
              <div>
                <p className="slip-inst">Republic of the Philippines</p>
                <h2 className="slip-col-name">LAPU-LAPU CITY COLLEGE</h2>
                <p className="slip-dept">Physical Facilities, Equipment &amp; Inventory Management Office</p>
                <p className="slip-loc">Don B. Benedicto Road, Gun-ob, Lapu-Lapu City, Cebu</p>
              </div>
            </div>
            <div className="slip-meta-box">
              <div className="slip-meta-row">
                <span className="sm-label">CONTROL NO:</span>
                <span className="sm-value highlight">{controlNo}</span>
              </div>
              <div className="slip-meta-row">
                <span className="sm-label">ISSUANCE DATE:</span>
                <span className="sm-value">{new Date().toLocaleDateString('en-US')}</span>
              </div>
              <div className="slip-meta-row">
                <span className="sm-label">STATUS:</span>
                <span className="sm-value uppercase">{req.status}</span>
              </div>
            </div>
          </div>

          <div className="slip-title-bar">
            <h1>EQUIPMENT INVENTORY DISPATCH &amp; RELEASE SLIP</h1>
          </div>

          {/* Event & Borrower Details */}
          <div className="slip-section-grid">
            <div className="slip-box">
              <h4 className="slip-box-title">EVENT PARTICULARS</h4>
              <table className="slip-info-table">
                <tbody>
                  <tr>
                    <th>Event Name:</th>
                    <td className="bold">{req.event_name}</td>
                  </tr>
                  <tr>
                    <th>Event Date:</th>
                    <td>{formatFullDate(req.event_date)}</td>
                  </tr>
                  <tr>
                    <th>Time Duration:</th>
                    <td>{formatTime(req.start_time)} to {formatTime(req.end_time)}</td>
                  </tr>
                  <tr>
                    <th>Venue / Location:</th>
                    <td>{req.venue_location}</td>
                  </tr>
                  <tr>
                    <th>Event Organizer:</th>
                    <td>{req.event_organizer}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="slip-box">
              <h4 className="slip-box-title">BORROWER / REQUESTER DETAILS</h4>
              <table className="slip-info-table">
                <tbody>
                  <tr>
                    <th>Requester:</th>
                    <td className="bold">{req.requester_name}</td>
                  </tr>
                  <tr>
                    <th>College / Dept:</th>
                    <td>{req.department_college}</td>
                  </tr>
                  <tr>
                    <th>Contact No:</th>
                    <td>{req.contact_number}</td>
                  </tr>
                  <tr>
                    <th>Request Ref ID:</th>
                    <td><code>{req.id.slice(0, 8)}</code></td>
                  </tr>
                  <tr>
                    <th>Submission Date:</th>
                    <td>{new Date(req.created_at).toLocaleDateString('en-US')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Equipment Inventory Table */}
          <div className="slip-table-wrap">
            <h4 className="slip-box-title">EQUIPMENT DISPATCH &amp; RETURN CHECKLIST</h4>
            <table className="slip-inventory-table">
              <thead>
                <tr>
                  <th style={{ width: '38px' }}>#</th>
                  <th>Equipment Description / Requested Item</th>
                  <th style={{ width: '85px' }}>Qty Released</th>
                  <th style={{ width: '130px' }}>Property / Tag #</th>
                  <th style={{ width: '110px' }}>Out Condition</th>
                  <th style={{ width: '110px' }}>Return Condition</th>
                  <th>Accessories Included</th>
                </tr>
              </thead>
              <tbody>
                {req.requested_items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="center">{idx + 1}</td>
                    <td className="bold">{item}</td>
                    <td className="center">1 unit / set</td>
                    <td className="center muted-fill">LLCC-{item.slice(0, 3).toUpperCase()}-{(idx + 1).toString().padStart(3, '0')}</td>
                    <td className="center"><span className="check-box">[ ✔ ] Serviceable</span></td>
                    <td className="center"><span className="check-box">[ &nbsp; ] In Good Order</span></td>
                    <td className="muted-fill">Power &amp; audio cables, connectors</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Guidelines & Terms */}
          <div className="slip-terms">
            <p><strong>BORROWER UNDERTAKING:</strong> The borrower accepts full responsibility for the proper handling, security, and timely return of all items listed above immediately after the event. Any damage, malfunction, or loss will be reported immediately to the Facilities &amp; Equipment Custodian.</p>
          </div>

          {/* Signatures */}
          <div className="slip-signatures">
            <div className="sig-block">
              <p className="sig-role">Prepared &amp; Reviewed By</p>
              <div className="sig-line">{APPROVER_NAMES.reviewed}</div>
              <p className="sig-sub">(OIC, Dean COT)</p>
            </div>
            <div className="sig-block">
              <p className="sig-role">Recommending Approval</p>
              <div className="sig-line">{APPROVER_NAMES.recommended}</div>
              <p className="sig-sub">(VP-Academics)</p>
            </div>
            <div className="sig-block approved-block">
              <p className="sig-role">Approved By</p>
              <div className="sig-line">{APPROVER_NAMES.approved}</div>
              <p className="sig-sub">(College Administrator)</p>
            </div>
            {/* Borrower signature hidden */}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Aggregated Inventory Report Modal ─────────────────────────────────────────
function InventorySummaryModal({ requests, onClose }: { requests: Request[]; onClose: () => void }) {
  const [filterMode, setFilterMode] = useState<'all' | 'approved'>('approved')

  const targetRequests = filterMode === 'approved' 
    ? requests.filter(r => r.status === 'approved')
    : requests

  // Equipment tally breakdown
  const itemCounts: Record<string, { total: number; events: { name: string; date: string; venue: string; requester: string }[] }> = {}
  
  targetRequests.forEach(req => {
    req.requested_items.forEach(item => {
      if (!itemCounts[item]) {
        itemCounts[item] = { total: 0, events: [] }
      }
      itemCounts[item].total += 1
      itemCounts[item].events.push({
        name: req.event_name,
        date: req.event_date,
        venue: req.venue_location,
        requester: req.requester_name
      })
    })
  })

  function handlePrint() {
    window.print()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="inventory-modal-card wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header-actions no-print">
          <div className="modal-title-wrap">
            <Boxes size={20} className="modal-title-icon" />
            <div>
              <h3>Equipment Inventory &amp; Allocation Report</h3>
              <p>Comprehensive inventory deployment across events</p>
            </div>
          </div>
          <div className="modal-btns">
            <div className="filter-toggle">
              <button 
                className={`tab-btn ${filterMode === 'approved' ? 'active' : ''}`}
                onClick={() => setFilterMode('approved')}
              >
                Approved Events Only ({requests.filter(r => r.status === 'approved').length})
              </button>
              <button 
                className={`tab-btn ${filterMode === 'all' ? 'active' : ''}`}
                onClick={() => setFilterMode('all')}
              >
                All Events ({requests.length})
              </button>
            </div>
            <button className="print-btn" onClick={handlePrint}>
              <Printer size={15} /> Print Report
            </button>
            <button className="close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="slip-sheet print-target">
          <div className="slip-header">
            <div className="slip-logo-block">
              <img src="/llcc-logo.webp" alt="LLCC Logo" className="slip-crest-img" />
              <div>
                <p className="slip-inst">Republic of the Philippines</p>
                <h2 className="slip-col-name">LAPU-LAPU CITY COLLEGE</h2>
                <p className="slip-dept">Equipment &amp; Facilities Inventory Allocation Log</p>
                <p className="slip-loc">Generated on: {new Date().toLocaleString()}</p>
              </div>
            </div>
            <div className="slip-meta-box">
              <div className="slip-meta-row">
                <span className="sm-label">SCOPE:</span>
                <span className="sm-value highlight">{filterMode === 'approved' ? 'Approved Events' : 'All Requests'}</span>
              </div>
              <div className="slip-meta-row">
                <span className="sm-label">TOTAL EVENTS:</span>
                <span className="sm-value">{targetRequests.length}</span>
              </div>
            </div>
          </div>

          {/* Item Allocation Summary Cards */}
          <h4 className="slip-box-title" style={{ marginTop: 16 }}>EQUIPMENT UTILIZATION SUMMARY</h4>
          <div className="summary-grid">
            {Object.entries(itemCounts).length === 0 ? (
              <p className="empty-inline">No equipment bookings in this category.</p>
            ) : (
              Object.entries(itemCounts).map(([item, data]) => (
                <div className="summary-item-card" key={item}>
                  <div className="sic-top">
                    <span className="sic-name">{item}</span>
                    <span className="sic-badge">{data.total} Bookings</span>
                  </div>
                  <ul className="sic-events">
                    {data.events.slice(0, 4).map((ev, i) => (
                      <li key={i}>
                        <strong>{formatDate(ev.date)}</strong>: {ev.name} ({ev.venue})
                      </li>
                    ))}
                    {data.events.length > 4 && <li>...and {data.events.length - 4} more</li>}
                  </ul>
                </div>
              ))
            )}
          </div>

          {/* Schedule Allocation Master Table */}
          <h4 className="slip-box-title" style={{ marginTop: 24 }}>MASTER EVENT EQUIPMENT SCHEDULE</h4>
          <table className="slip-inventory-table">
            <thead>
              <tr>
                <th style={{ width: '90px' }}>Date</th>
                <th>Event Name</th>
                <th>Requester / Dept</th>
                <th>Venue</th>
                <th>Time</th>
                <th>Allocated Equipment</th>
                <th style={{ width: '80px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {targetRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="center muted-fill">No records found.</td>
                </tr>
              ) : (
                targetRequests.map((r) => (
                  <tr key={r.id}>
                    <td className="bold">{formatDate(r.event_date)}</td>
                    <td className="bold">{r.event_name}</td>
                    <td>{r.requester_name} <br/><small className="muted-text">{r.department_college}</small></td>
                    <td>{r.venue_location}</td>
                    <td>{formatTime(r.start_time)} – {formatTime(r.end_time)}</td>
                    <td>
                      <div className="tags-cell">
                        {r.requested_items.map(it => (
                          <span key={it} className="mini-tag">{it}</span>
                        ))}
                      </div>
                    </td>
                    <td className="center uppercase bold"><span className={`req-status-badge ${STATUS_META[r.status].color}`}>{r.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Signoff */}
          <div className="slip-signatures" style={{ marginTop: 30 }}>
            <div className="sig-block">
              <p className="sig-role">Generated By</p>
              <div className="sig-line">{APPROVER_NAMES.reviewed}</div>
              <p className="sig-sub">(OIC, Dean COT)</p>
            </div>
            <div className="sig-block">
              <p className="sig-role">Recommending Approval</p>
              <div className="sig-line">{APPROVER_NAMES.recommended}</div>
              <p className="sig-sub">(VP-Academics)</p>
            </div>
            <div className="sig-block approved-block">
              <p className="sig-role">Approved By</p>
              <div className="sig-line">{APPROVER_NAMES.approved}</div>
              <p className="sig-sub">(College Administrator)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Request Card ──────────────────────────────────────────────────────────────
function RequestCard({
  req,
  onUpdate,
  onDelete,
  onOpenSlip
}: {
  req: Request
  onUpdate: () => void
  onDelete: (id: string) => Promise<void>
  onOpenSlip: (r: Request) => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [note, setNote] = useState('')

  const [status, setStatus] = useState<Status>(req.status)

  async function save() {
    if (!supabase) return
    setSaving(true)
    setNote('')
    const { error } = await supabase
      .from('equipment_booking_requests')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({
        reviewed_by: APPROVER_NAMES.reviewed,
        recommending_approval_by: APPROVER_NAMES.recommended,
        approved_by: APPROVER_NAMES.approved,
        status,
      } as any)
      .eq('id', req.id)
    setSaving(false)
    if (error) { setNote('Error: ' + error.message) }
    else { setNote('Saved!'); onUpdate() }
  }

  async function quickStatus(s: Status) {
    if (!supabase) return
    setSaving(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from('equipment_booking_requests').update({ status: s } as any).eq('id', req.id)
    setSaving(false)
    onUpdate()
  }

  async function handleDeleteClick() {
    setDeleting(true)
    await onDelete(req.id)
    setDeleting(false)
    setConfirmDelete(false)
  }

  const meta = STATUS_META[req.status]
  return (
    <div className={`req-card ${req.status}`}>
      <div className="req-card-top" onClick={() => setOpen(o => !o)}>
        <div className="req-card-left">
          <span className={`req-status-badge ${meta.color}`}>{meta.label}</span>
          <div>
            <p className="req-event-name">{req.event_name}</p>
            <p className="req-meta-line">
              <span><Users size={11} />{req.requester_name} · {req.department_college}</span>
              <span><CalendarDays size={11} />{formatDate(req.event_date)}</span>
              <span><MapPin size={11} />{req.venue_location}</span>
            </p>
          </div>
        </div>
        <div className="req-card-right">
          {/* Inventory Slip Button */}
          <button
            className="quick-btn slip-btn"
            title="Generate official inventory slip for this event"
            onClick={e => { e.stopPropagation(); onOpenSlip(req) }}
          >
            <Printer size={13} /> Slip
          </button>

          {req.status === 'pending' && (
            <button className="quick-btn approve-btn" disabled={saving}
              onClick={e => { e.stopPropagation(); quickStatus('approved') }}>
              <CheckCircle2 size={13} /> Approve
            </button>
          )}
          {(req.status === 'pending' || req.status === 'reviewed') && (
            <button className="quick-btn reject-btn" disabled={saving}
              onClick={e => { e.stopPropagation(); quickStatus('rejected') }}>
              <XCircle size={13} /> Reject
            </button>
          )}

          {/* Delete Button for Rejected items or in general */}
          {req.status === 'rejected' && (
            confirmDelete ? (
              <div className="delete-confirm-inline" onClick={e => e.stopPropagation()}>
                <span className="del-prompt">Delete?</span>
                <button
                  className="del-confirm-yes"
                  disabled={deleting}
                  onClick={handleDeleteClick}
                >
                  {deleting ? '...' : 'Yes'}
                </button>
                <button
                  className="del-confirm-no"
                  onClick={() => setConfirmDelete(false)}
                >
                  No
                </button>
              </div>
            ) : (
              <button
                className="quick-btn delete-btn"
                disabled={deleting}
                title="Delete this rejected request from database"
                onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
              >
                <Trash2 size={13} /> Delete
              </button>
            )
          )}

          {open ? <ChevronUp size={16} className="chevron" /> : <ChevronDown size={16} className="chevron" />}
        </div>
      </div>

      {open && (
        <div className="req-detail">
          <div className="req-detail-grid">
            <div className="req-detail-col">
              <p className="detail-label">Requester</p>
              <p className="detail-value">{req.requester_name}</p>
              <p className="detail-label" style={{ marginTop: 10 }}>Department / College</p>
              <p className="detail-value">{req.department_college}</p>
              <p className="detail-label" style={{ marginTop: 10 }}>Contact</p>
              <p className="detail-value"><Phone size={11} /> {req.contact_number}</p>
            </div>
            <div className="req-detail-col">
              <p className="detail-label">Event Organizer</p>
              <p className="detail-value">{req.event_organizer}</p>
              <p className="detail-label" style={{ marginTop: 10 }}>Date &amp; Time</p>
              <p className="detail-value">
                {formatDate(req.event_date)}<br />
                {formatTime(req.start_time)} – {formatTime(req.end_time)}
              </p>
            </div>
            <div className="req-detail-col">
              <p className="detail-label">Venue</p>
              <p className="detail-value">{req.venue_location}</p>
              <p className="detail-label" style={{ marginTop: 10 }}>Submitted</p>
              <p className="detail-value">{new Date(req.created_at).toLocaleString()}</p>
            </div>
          </div>

          <div className="req-items-row">
            <Package size={13} />
            <span className="detail-label">Requested Equipment:</span>
            {req.requested_items.map(i => <span className="req-item-tag" key={i}>{i}</span>)}
            <button
              className="generate-slip-link"
              onClick={() => onOpenSlip(req)}
            >
              <FileText size={12} /> Generate Official Inventory Slip
            </button>
          </div>

          <div className="req-approval-form">
            <p className="approval-form-title"><ClipboardCheck size={14} /> Office Approval</p>
            <div className="approval-form-grid">
              <label>
                <span>Status</span>
                <select value={status} onChange={e => setStatus(e.target.value as Status)}>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="recommended">Recommended</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>
              <label>
                <span>Reviewed By</span>
                <strong className="approval-name">{APPROVER_NAMES.reviewed}</strong>
              </label>
              <label>
                <span>Recommending Approval</span>
                <strong className="approval-name">{APPROVER_NAMES.recommended}</strong>
              </label>
              <label>
                <span>Approved By</span>
                <strong className="approval-name">{APPROVER_NAMES.approved}</strong>
              </label>
            </div>
            <div className="approval-form-actions">
              {/* Delete button inside detail */}
              {confirmDelete ? (
                <div className="detail-del-group">
                  <AlertTriangle size={13} color="#c0392b" />
                  <span>Permanently delete this record?</span>
                  <button className="del-btn-confirm" disabled={deleting} onClick={handleDeleteClick}>
                    {deleting ? 'Deleting…' : 'Yes, Delete'}
                  </button>
                  <button className="del-btn-cancel" onClick={() => setConfirmDelete(false)}>Cancel</button>
                </div>
              ) : (
                <button
                  type="button"
                  className="req-delete-action-btn"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 size={13} /> Delete Request
                </button>
              )}

              {note && <span className={`save-note ${note.startsWith('Error') ? 'err' : 'ok'}`}>{note}</span>}
              <button className="save-btn" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Admin Panel Main ──────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin_authed') === '1')
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  // Modals state
  const [activeSlipRequest, setActiveSlipRequest] = useState<Request | null>(null)
  const [showInventorySummary, setShowInventorySummary] = useState(false)

  const load = useCallback(async () => {
    if (!supabase) { setError('Supabase is not configured.'); return }
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase
      .from('equipment_booking_requests')
      .select('*')
      .order('created_at', { ascending: false })
    setLoading(false)
    if (err) setError(err.message)
    else setRequests((data as Request[]) ?? [])
  }, [])

  const handleDeleteRequest = async (id: string) => {
    if (!supabase) return
    const { data, error: delErr } = await supabase
      .from('equipment_booking_requests')
      .delete()
      .eq('id', id)
      .select()

    if (delErr) {
      alert('Delete failed in Supabase: ' + delErr.message + '\n\nPlease run the DELETE SQL policy in Supabase.')
      return
    }

    if (!data || data.length === 0) {
      alert('⚠️ Supabase blocked the deletion because the DELETE permission policy has not been added yet in your Supabase SQL Editor.\n\nPlease copy and run the SQL provided in the chat.')
      return
    }

    // Only remove from UI if actually deleted in database
    setRequests(prev => prev.filter(r => r.id !== id))
  }

  useEffect(() => { if (authed) load() }, [authed, load])

  if (!authed) return <LoginScreen onLogin={() => { sessionStorage.setItem('admin_authed', '1'); setAuthed(true) }} />

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }

  const filtered = requests.filter(r => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus
    const q = search.toLowerCase()
    const matchSearch = !q || r.event_name.toLowerCase().includes(q)
      || r.requester_name.toLowerCase().includes(q)
      || r.department_college.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  return (
    <div className="admin-shell">
      {/* Topbar */}
      <header className="admin-topbar no-print">
        <div className="admin-brand">
          <img src="/llcc-logo.webp" alt="LLCC Logo" className="admin-brand-logo-img" />
          <span>LAPU-LAPU CITY COLLEGE</span>
          <span className="admin-portal-tag">Admin &amp; Inventory Portal</span>
        </div>
        <div className="admin-topbar-right">
          <button 
            className="admin-inv-btn" 
            onClick={() => setShowInventorySummary(true)}
            title="View overall equipment inventory & allocation summary"
          >
            <Boxes size={14} />
            <span>Generate Inventory Report</span>
          </button>
          <button className="admin-refresh-btn" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button className="admin-logout-btn" onClick={() => { sessionStorage.removeItem('admin_authed'); setAuthed(false) }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <main className="admin-main no-print">
        {/* Stats */}
        <div className="admin-stats">
          <div className="stat-card">
            <span className="stat-num">{counts.all}</span>
            <span className="stat-label">Total Requests</span>
          </div>
          <div className="stat-card pending-stat">
            <span className="stat-num">{counts.pending}</span>
            <span className="stat-label"><Clock size={12} /> Pending</span>
          </div>
          <div className="stat-card approved-stat">
            <span className="stat-num">{counts.approved}</span>
            <span className="stat-label"><CheckCircle2 size={12} /> Approved</span>
          </div>
          <div className="stat-card rejected-stat">
            <span className="stat-num">{counts.rejected}</span>
            <span className="stat-label"><XCircle size={12} /> Rejected</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <div className="admin-search-wrap">
            <Search size={14} />
            <input
              className="admin-search"
              placeholder="Search by event, requester, department…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="admin-filter">
            <Filter size={13} />
            {(['all', 'pending', 'reviewed', 'recommended', 'approved', 'rejected'] as const).map(s => (
              <button
                key={s}
                className={`filter-btn ${filterStatus === s ? 'active' : ''}`}
                onClick={() => setFilterStatus(s)}
              >
                {s === 'all' ? 'All' : STATUS_META[s].label}
              </button>
            ))}
          </div>
          <button 
            className="toolbar-inv-btn"
            onClick={() => setShowInventorySummary(true)}
          >
            <Layers size={13} /> Equipment Allocation Log
          </button>
        </div>

        {error && <div className="admin-error">{error}</div>}

        {/* List */}
        <div className="req-list">
          {filtered.length === 0 && !loading && (
            <div className="admin-empty">
              <ClipboardCheck size={32} />
              <p>No requests found{filterStatus !== 'all' ? ` with status "${filterStatus}"` : ''}.</p>
            </div>
          )}
          {filtered.map(r => (
            <RequestCard
              key={r.id}
              req={r}
              onUpdate={load}
              onDelete={handleDeleteRequest}
              onOpenSlip={req => setActiveSlipRequest(req)}
            />
          ))}
        </div>
      </main>

      {/* Single Event Inventory Slip Modal */}
      {activeSlipRequest && (
        <InventorySlipModal
          req={activeSlipRequest}
          onClose={() => setActiveSlipRequest(null)}
        />
      )}

      {/* Full Inventory Summary Modal */}
      {showInventorySummary && (
        <InventorySummaryModal
          requests={requests}
          onClose={() => setShowInventorySummary(false)}
        />
      )}
    </div>
  )
}
