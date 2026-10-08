import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, CalendarDays, Check, ClipboardList, Clock3, LoaderCircle, MapPin } from 'lucide-react'
import { supabase } from './lib/supabase'
import { defaultEquipmentOptions, normalizeRequestedItems, timeRangeOverlaps } from './lib/request-helpers'
import './App.css'

const STORAGE_KEY = 'llcc-booking-requests'

type BookingStatus = 'pending' | 'reviewed' | 'recommended' | 'approved' | 'rejected'
type BookingRecord = {
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
  status: BookingStatus
  created_at: string
}

const sampleBookings: BookingRecord[] = [
  {
    id: 'demo-approved-1',
    requester_name: 'Maria Santos',
    department_college: 'College of Education',
    contact_number: '09171234567',
    event_organizer: 'Student Council',
    event_name: 'Campus Leadership Forum',
    event_date: '2026-10-08',
    start_time: '09:00',
    end_time: '12:00',
    venue_location: 'Main Gym',
    requested_items: ['LED Wall', 'Sound System'],
    status: 'approved',
    created_at: '2026-10-02T08:00:00.000Z',
  },
  {
    id: 'demo-pending-1',
    requester_name: 'Rafael Gomez',
    department_college: 'Business and Accountancy',
    contact_number: '09181234567',
    event_organizer: 'BA Club',
    event_name: 'Entrepreneur Week',
    event_date: '2026-10-09',
    start_time: '13:00',
    end_time: '16:30',
    venue_location: 'Auditorium',
    requested_items: ['Microphone', 'Lights'],
    status: 'pending',
    created_at: '2026-10-02T09:00:00.000Z',
  },
  {
    id: 'demo-approved-2',
    requester_name: 'Liza Perez',
    department_college: 'College of Engineering',
    contact_number: '09201234567',
    event_organizer: 'Robotics Team',
    event_name: 'Innovation Expo',
    event_date: '2026-10-10',
    start_time: '10:00',
    end_time: '14:00',
    venue_location: 'AV Room',
    requested_items: ['Projector with white screen'],
    status: 'approved',
    created_at: '2026-10-02T10:00:00.000Z',
  },
]

const equipmentOptions = defaultEquipmentOptions

function todayDate() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDate(value: string) {
  if (!value) return ''
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function formatTime(value: string) {
  if (!value) return ''
  const [hours, minutes] = value.split(':').map(Number)
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })
}

function App() {
  const [requesterName, setRequesterName] = useState('')
  const [department, setDepartment] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [eventOrganizer, setEventOrganizer] = useState('')
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState(todayDate())
  const [startTime, setStartTime] = useState('13:30')
  const [endTime, setEndTime] = useState('17:00')
  const [venue, setVenue] = useState('')
  const [requestedItems, setRequestedItems] = useState<string[]>([])
  const [customItem, setCustomItem] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [bookingLog, setBookingLog] = useState<BookingRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return sampleBookings
    try {
      return JSON.parse(saved) as BookingRecord[]
    } catch {
      return sampleBookings
    }
  })

  const refreshBookings = useCallback(async () => {
    if (!supabase) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) {
        setBookingLog(sampleBookings)
        return
      }
      try {
        setBookingLog(JSON.parse(saved) as BookingRecord[])
      } catch {
        setBookingLog(sampleBookings)
      }
      return
    }

    const { data, error } = await supabase
      .from('equipment_booking_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      const mapped = data.map((row) => ({
        id: row.id,
        requester_name: row.requester_name,
        department_college: row.department_college,
        contact_number: row.contact_number,
        event_organizer: row.event_organizer,
        event_name: row.event_name,
        event_date: row.event_date,
        start_time: row.start_time,
        end_time: row.end_time,
        venue_location: row.venue_location,
        requested_items: row.requested_items ?? [],
        status: (row.status ?? 'pending') as BookingStatus,
        created_at: row.created_at,
      }))
      setBookingLog(mapped)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped))
    }
  }, [])

  useEffect(() => {
    void refreshBookings()
    const timer = window.setInterval(() => {
      void refreshBookings()
    }, 10000)
    return () => window.clearInterval(timer)
  }, [refreshBookings])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookingLog))
  }, [bookingLog])

  const venueAvailability = useMemo(() => {
    if (!venue || !eventDate || !startTime || !endTime) {
      return { label: 'Pending check', tone: 'neutral' }
    }

    const bookingConflict = bookingLog.some((booking: BookingRecord) => {
      if (booking.venue_location.toLowerCase() !== venue.trim().toLowerCase()) return false
      if (booking.event_date !== eventDate) return false
      return timeRangeOverlaps(startTime, endTime, booking.start_time, booking.end_time)
    })

    return bookingConflict
      ? { label: 'Booked for this time', tone: 'busy' }
      : { label: 'Available', tone: 'free' }
  }, [bookingLog, venue, eventDate, startTime, endTime])

  const upcomingBookings = useMemo(() => {
    return [...bookingLog]
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      .slice(0, 5)
  }, [bookingLog])

  function toggleItem(item: string) {
    if (item === 'Other') {
      setRequestedItems((items) => {
        if (items.includes('Other')) {
          return items.filter((selected) => selected !== 'Other')
        }
        return [...items, 'Other']
      })
      return
    }

    setRequestedItems((items) => items.includes(item)
      ? items.filter((selected) => selected !== item)
      : [...items, item])
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const normalizedItems = normalizeRequestedItems(requestedItems, customItem)
    if (normalizedItems.length === 0) {
      setError('Select at least one requested item.')
      return
    }

    const bookingRecord: BookingRecord = {
      id: crypto.randomUUID(),
      requester_name: requesterName.trim(),
      department_college: department.trim(),
      contact_number: contactNumber.trim(),
      event_organizer: eventOrganizer.trim(),
      event_name: eventName.trim(),
      event_date: eventDate,
      start_time: startTime,
      end_time: endTime,
      venue_location: venue.trim(),
      requested_items: normalizedItems,
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    setBookingLog((prev: BookingRecord[]) => [bookingRecord, ...prev])

    if (!supabase) {
      setSubmitted(true)
      return
    }

    setSubmitting(true)
    try {
      const { error: insertError } = await supabase.from('equipment_booking_requests').insert({
        requester_name: bookingRecord.requester_name,
        department_college: bookingRecord.department_college,
        contact_number: bookingRecord.contact_number,
        event_organizer: bookingRecord.event_organizer,
        event_name: bookingRecord.event_name,
        event_date: bookingRecord.event_date,
        start_time: bookingRecord.start_time,
        end_time: bookingRecord.end_time,
        venue_location: bookingRecord.venue_location,
        requested_items: bookingRecord.requested_items,
      })
      if (insertError) throw insertError
      setSubmitted(true)
    } catch (requestError) {
      const errMsg =
        requestError instanceof Error
          ? requestError.message
          : typeof requestError === 'object' && requestError !== null && 'message' in requestError
            ? String((requestError as { message: unknown }).message)
            : JSON.stringify(requestError)
      setError(errMsg || 'The request could not be submitted. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function newRequest() {
    setRequesterName('')
    setDepartment('')
    setContactNumber('')
    setEventOrganizer('')
    setEventName('')
    setEventDate(todayDate())
    setStartTime('13:30')
    setEndTime('17:00')
    setVenue('')
    setRequestedItems([])
    setCustomItem('')
    setError('')
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <main className="request-shell confirmation-page">
        <Header />
        <section className="request-confirmation">
          <div className="request-success-icon"><Check size={28} /></div>
          <p className="request-kicker">REQUEST RECEIVED</p>
          <h1>Your event request<br /><em>is in the queue.</em></h1>
          <p className="confirmation-copy">Thank you, {requesterName}. Your equipment request is submitted for college review.</p>
          <div className="request-receipt">
            <div className="receipt-heading"><span>EVENT DETAILS</span><span className="pending-tag">Pending review</span></div>
            <div className="receipt-row"><span>Event</span><strong>{eventName}</strong></div>
            <div className="receipt-row"><span>Date</span><strong>{formatDate(eventDate)}</strong></div>
            <div className="receipt-row"><span>Time</span><strong>{formatTime(startTime)} – {formatTime(endTime)}</strong></div>
            <div className="receipt-row"><span>Venue</span><strong>{venue}</strong></div>
            <div className="receipt-items"><span>Requested items</span><div>{requestedItems.map((item) => <span className="receipt-item" key={item}>{item}</span>)}</div></div>
          </div>
          <p className="office-note">Reviewed by, recommending approval, and approved fields are completed by college staff.</p>
          <button type="button" className="text-button" onClick={newRequest}>Submit another request <ArrowRight size={16} /></button>
        </section>
        <PageFooter />
      </main>
    )
  }

  return (
    <main id="top" className="request-shell app-shell">
      <Header />
      <section className="request-intro intro">
        <div className="intro-kicker"><span>FACILITIES &amp; EVENT SUPPORT</span><span className="kicker-line" /></div>
        <h1>LED wall &amp; sound<br />system <em>request.</em></h1>
        <p>Submit an event equipment request for review by Lapu-Lapu City College.</p>
        <div className="request-stamp" aria-hidden="true"><img src="/llcc-logo.webp" alt="LLCC Logo" className="stamp-logo-img" /><span>LAPU-LAPU<br />CITY COLLEGE</span></div>
      </section>

      <div className="request-layout booking-layout">
        <form className="request-form booking-form" onSubmit={submitRequest}>
          <section className="form-section request-section">
            <SectionHeading number="01" title="Requester information" detail="Who is submitting this request?" />
            <div className="request-fields">
              <Field label="NAME OF REQUESTER"><input value={requesterName} onChange={(event) => setRequesterName(event.target.value)} placeholder="Full name" autoComplete="name" required /></Field>
              <Field label="DEPARTMENT / COLLEGE"><input value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="Department or college" required /></Field>
              <Field label="CONTACT NUMBER"><input type="tel" value={contactNumber} onChange={(event) => setContactNumber(event.target.value)} placeholder="Your phone number" autoComplete="tel" required /></Field>
            </div>
          </section>

          <section className="form-section request-section">
            <SectionHeading number="02" title="Event information" detail="Tell us what is happening and where." />
            <div className="request-fields">
              <Field label="EVENT ORGANIZER"><input value={eventOrganizer} onChange={(event) => setEventOrganizer(event.target.value)} placeholder="Organizer or organization" required /></Field>
              <Field label="NAME OF EVENT"><input value={eventName} onChange={(event) => setEventName(event.target.value)} placeholder="Event title" required /></Field>
              <Field label="DATE OF EVENT"><input type="date" value={eventDate} min={todayDate()} onChange={(event) => setEventDate(event.target.value)} required /></Field>
              <div className="field time-fields"><span>DATE &amp; TIME OF EVENT</span><div className="time-inputs"><label><Clock3 size={14} /><input aria-label="Event start time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required /></label><span>to</span><label><Clock3 size={14} /><input aria-label="Event end time" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required /></label></div></div>
              <Field label="VENUE / LOCATION"><div className="input-with-icon"><MapPin size={15} /><input value={venue} onChange={(event) => setVenue(event.target.value)} placeholder="Building, room, or venue" required /></div></Field>
            </div>
          </section>

          <section className="form-section request-section equipment-section">
            <SectionHeading number="03" title="Requested items" detail="Select all equipment needed for your event." />
            <div className="equipment-list">
              {equipmentOptions.map((item: string) => <label className={`equipment-option ${requestedItems.includes(item) ? 'checked' : ''}`} key={item}>
                <input type="checkbox" checked={requestedItems.includes(item)} onChange={() => toggleItem(item)} />
                <span className="equipment-check"><Check size={13} /></span>
                <span>{item}</span>
              </label>)}
            </div>
            <div className="custom-item-wrap">
              <p className="custom-item-note">NOTE: Provide Double AA battery</p>
              {requestedItems.includes('Other') && (
                <>
                  <label className="custom-item-label">Other equipment item</label>
                  <input
                    value={customItem}
                    onChange={(event) => setCustomItem(event.target.value)}
                    placeholder="Type another equipment request"
                  />
                </>
              )}
            </div>
          </section>

          <section className="booking-status-panel">
            <div className="booking-status-header">
              <h3>Booking status</h3>
              <span className="booking-status-pill">{upcomingBookings.length} upcoming</span>
            </div>
            <div className="booking-status-list">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="booking-status-item">
                  <div className="booking-status-summary">
                    <strong>{booking.event_name}</strong>
                    <span>{formatDate(booking.event_date)}</span>
                  </div>
                  <div className="booking-status-meta">
                    <span>{booking.venue_location}</span>
                    <span className={`booking-badge booking-badge-${booking.status}`}>{booking.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="office-workflow">
            <div className="office-workflow-title"><ClipboardList size={16} /><span>OFFICE USE ONLY</span></div>
            <div className="approval-fields">
              <div><span>REVIEWED BY</span><i /></div>
              <div><span>RECOMMENDING APPROVAL</span><i /></div>
              <div><span>APPROVED</span><i /></div>
            </div>
            <p>Completed by the reviewing and approving college offices.</p>
          </section>

          {error && <div className="error-message" role="alert">{error}</div>}
          <button className="submit-button" type="submit" disabled={submitting}>{submitting ? <>Submitting request <LoaderCircle className="spinner" size={18} /></> : <>Submit equipment request <ArrowRight size={18} /></>}</button>
          <p className="form-footnote"><CalendarDays size={14} /> Requests are subject to availability and college approval.</p>
        </form>

        <aside className="request-summary booking-summary">
          <div className="summary-top"><span>REQUEST SUMMARY</span><span className="summary-spark">✳</span></div>
          <div className="summary-content">
            <span className="summary-index">EVENT AT A GLANCE</span>
            <h3>{eventName || 'Your event name'}</h3>
            <p>{eventOrganizer || 'Event organizer'}{department ? ` · ${department}` : ''}</p>
            <div className="summary-rule" />
            <div className="summary-row"><span><CalendarDays size={15} /> Date</span><strong>{eventDate ? formatDate(eventDate) : 'Not selected'}</strong></div>
            <div className="summary-row"><span><Clock3 size={15} /> Time</span><strong>{formatTime(startTime)} – {formatTime(endTime)}</strong></div>
            <div className="summary-row"><span><MapPin size={15} /> Venue</span><strong>{venue || 'Not entered'}</strong></div>
            <div className="summary-rule" />
            <div className={`summary-venue-status ${venueAvailability.tone}`}>
              <span>Venue status</span>
              <strong>{venueAvailability.label}</strong>
            </div>
            <div className="summary-items-heading">EQUIPMENT ({normalizeRequestedItems(requestedItems, customItem).length})</div>
            {normalizeRequestedItems(requestedItems, customItem).length > 0
              ? <ul className="summary-equipment">{normalizeRequestedItems(requestedItems, customItem).map((item: string) => <li key={item}><Check size={13} />{item}</li>)}</ul>
              : <p className="summary-empty">No items selected yet</p>}
          </div>
          <div className="summary-footer"><img src="/llcc-logo.webp" alt="LLCC Logo" className="footer-logo-img" /><span>Lapu-Lapu City College</span></div>
        </aside>
      </div>
      <PageFooter />
    </main>
  )
}

function Header() {
  return (
    <header className="topbar">
      <a className="brand" href="#top">
        <img src="/llcc-logo.webp" alt="LLCC Logo" className="brand-logo-img" />
        <span>LAPU-LAPU CITY COLLEGE</span>
      </a>
      <div className="topbar-note"><span className="status-dot" /> Equipment request form</div>
    </header>
  )
}

function SectionHeading({ number, title, detail }: { number: string; title: string; detail: string }) {
  return <div className="section-heading"><span className="step-number">{number}</span><div><h2>{title}</h2><p>{detail}</p></div></div>
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>
}

function PageFooter() {
  return <footer className="page-footer"><span>LED WALL &amp; SOUND SYSTEM REQUEST</span><span>For official college event use</span><span>© 2026</span></footer>
}

export default App
