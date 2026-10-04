'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/dashboard-layout';
import { AuthGuard } from '../../components/auth-guard';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Grid,
  List,
  Edit3,
  Trash2,
  X,
  RefreshCw,
  Tag,
  Check,
  CalendarDays
} from 'lucide-react';

interface CalendarEventItem {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: string;
  priority?: string;
  description?: string;
  status?: string;
  color?: string;
  isSynced?: boolean;
}

export default function CalendarDeadlinesPage() {
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 7, 1)); // Default to August 2026 to match existing project context
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDay, setSelectedDay] = useState<string | null>('2026-08-26');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);
  const [isEditingSelected, setIsEditingSelected] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Add form state
  const [addFormData, setAddFormData] = useState({
    title: '',
    date: '2026-08-26',
    time: '10:00 AM',
    type: 'PROJECT',
    priority: 'MEDIUM',
    description: '',
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    id: '',
    title: '',
    date: '',
    time: '10:00 AM',
    type: 'PROJECT',
    priority: 'MEDIUM',
    description: '',
    status: 'PENDING',
  });

  const [submitting, setSubmitting] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/calendar');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEvents(data);
        }
      }
    } catch (e) {
      console.warn('Error loading calendar events:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    // Jump to current local date
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setSelectedDay(todayStr);
  };

  const monthYearString = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Filter events by category
  const filteredEvents = events.filter((evt) => {
    if (selectedCategory === 'ALL') return true;
    return evt.type.toUpperCase() === selectedCategory.toUpperCase();
  });

  // Events filtered for current month view
  const currentMonthYearPrefix = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const eventsInCurrentMonth = filteredEvents.filter((evt) => evt.date.startsWith(currentMonthYearPrefix));

  // Calendar Grid generation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({ dateStr, dayNum: day, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ dateStr, dayNum: d, isCurrentMonth: true });
  }

  // Next month leading days to complete grid (42 cells = 6 weeks)
  const remainingCells = 42 - calendarDays.length;
  for (let nextD = 1; nextD <= remainingCells; nextD++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(nextD).padStart(2, '0')}`;
    calendarDays.push({ dateStr, dayNum: nextD, isCurrentMonth: false });
  }

  // Open Create Modal
  const openCreateModal = (defaultDate?: string) => {
    setAddFormData({
      title: '',
      date: defaultDate || selectedDay || currentMonthYearPrefix + '-15',
      time: '10:00 AM',
      type: selectedCategory !== 'ALL' ? selectedCategory : 'PROJECT',
      priority: 'MEDIUM',
      description: '',
    });
    setShowAddModal(true);
  };

  // Handle Add Event Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.title.trim() || !addFormData.date) {
      showToast('Title and Date are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addFormData),
      });

      if (res.ok) {
        setShowAddModal(false);
        showToast('Event added successfully!');
        await fetchEvents();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to create event.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error creating event.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open View/Edit Modal
  const openViewModal = (evt: CalendarEventItem) => {
    setSelectedEvent(evt);
    setEditFormData({
      id: evt.id,
      title: evt.title,
      date: evt.date,
      time: evt.time || '10:00 AM',
      type: evt.type,
      priority: evt.priority || 'MEDIUM',
      description: evt.description || '',
      status: evt.status || 'PENDING',
    });
    setIsEditingSelected(false);
    setShowViewModal(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.title.trim() || !editFormData.date) {
      showToast('Title and Date are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedEvent(updated);
        setIsEditingSelected(false);
        showToast('Event updated successfully!');
        await fetchEvents();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update event.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating event.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Event
  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const res = await fetch(`/api/calendar?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setShowViewModal(false);
        setSelectedEvent(null);
        showToast('Event deleted successfully.');
        await fetchEvents();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to delete event.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting event.', 'error');
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type.toUpperCase()) {
      case 'CRM':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SALES':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PROJECT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'FINANCE':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'MARKETING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getMonthAbbr = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleString('default', { month: 'short' }).toUpperCase();
  };

  const getDayNumber = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.getDate();
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 animate-fade-in shadow-xl rounded-2xl border px-4 py-3 text-xs font-semibold flex items-center gap-2.5 bg-white border-slate-200">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className={toastMessage.type === 'success' ? 'text-slate-900' : 'text-rose-700'}>
              {toastMessage.text}
            </span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
              <span>Company Calendar & Deadlines</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Consolidated timeline of task deadlines, client milestone signoffs, follow-ups & invoice due dates.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Timeline</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Month Grid</span>
              </button>
            </div>

            {/* Add Event Button */}
            <button
              type="button"
              onClick={() => openCreateModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
          </div>
        </div>

        {/* Month Navigation & Category Tabs */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Month Stepper */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-extrabold text-slate-900 min-w-28 text-center px-1">
                {monthYearString}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
            {['ALL', 'PROJECT', 'SALES', 'CRM', 'FINANCE', 'MARKETING'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: TIMELINE / AGENDA VIEW */}
        {/* ======================================================== */}
        {viewMode === 'timeline' && (
          <div className="space-y-3 animate-fade-in">
            {loading ? (
              <div className="flex items-center justify-center p-12 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-xs font-medium">Loading events...</span>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">No events found</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">No deadlines or events match the selected category.</p>
                <button
                  type="button"
                  onClick={() => openCreateModal()}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Event</span>
                </button>
              </div>
            ) : (
              filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition-all text-xs group"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Date Block */}
                    <div className="w-13 h-13 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center font-mono shrink-0 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">
                        {getMonthAbbr(evt.date)}
                      </span>
                      <span className="text-lg font-extrabold text-slate-900 leading-tight mt-0.5">
                        {getDayNumber(evt.date)}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTypeBadgeClass(evt.type)}`}>
                          {evt.type}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-300" />
                          <span>{evt.date}</span>
                          {evt.time && <span className="text-slate-500">· {evt.time}</span>}
                        </span>
                        {evt.priority && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              evt.priority === 'HIGH'
                                ? 'bg-rose-50 text-rose-600'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {evt.priority}
                          </span>
                        )}
                        {evt.status === 'COMPLETED' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700">
                            ✓ Done
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {evt.title}
                      </h3>
                      {evt.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{evt.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => openViewModal(evt)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>View Event</span>
                      <span>→</span>
                    </button>
                    {!evt.isSynced && (
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(evt.id)}
                        className="p-1 text-slate-300 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: FULL MONTH CALENDAR GRID */}
        {/* ======================================================== */}
        {viewMode === 'grid' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-4 sm:p-6 animate-fade-in">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid Days */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((cell, idx) => {
                const dayEvents = filteredEvents.filter((e) => e.date === cell.dateStr);
                const isSelected = selectedDay === cell.dateStr;
                const isToday =
                  new Date().toISOString().split('T')[0] === cell.dateStr;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDay(cell.dateStr)}
                    className={`min-h-[75px] sm:min-h-[95px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20'
                        : isToday
                        ? 'border-blue-300 bg-blue-50/20'
                        : cell.isCurrentMonth
                        ? 'border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                        : 'border-slate-50 bg-slate-50/50 opacity-40 hover:opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-extrabold rounded-lg w-5 h-5 flex items-center justify-center ${
                          isToday
                            ? 'bg-blue-600 text-white shadow-xs'
                            : isSelected
                            ? 'text-blue-700 font-black'
                            : 'text-slate-700'
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {cell.isCurrentMonth && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCreateModal(cell.dateStr);
                          }}
                          className="w-4 h-4 rounded-full text-slate-300 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center text-[11px] font-bold cursor-pointer"
                          title="Add event on this day"
                        >
                          +
                        </button>
                      )}
                    </div>

                    {/* Event indicators */}
                    <div className="space-y-1 mt-1">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openViewModal(ev);
                          }}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md truncate cursor-pointer transition-transform hover:scale-102 border ${getTypeBadgeClass(
                            ev.type
                          )}`}
                          title={`${ev.time ? ev.time + ' - ' : ''}${ev.title}`}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] font-extrabold text-blue-600 text-right pr-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Day Agenda Drawer Below Grid */}
            {selectedDay && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-blue-600" />
                    <span>Events for {selectedDay}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => openCreateModal(selectedDay)}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to this day</span>
                  </button>
                </div>

                {filteredEvents.filter((e) => e.date === selectedDay).length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No events scheduled on this date.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredEvents
                      .filter((e) => e.date === selectedDay)
                      .map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => openViewModal(ev)}
                          className="p-3 rounded-2xl border border-slate-200 hover:border-blue-400 transition-all cursor-pointer bg-slate-50/50 flex justify-between items-start"
                        >
                          <div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getTypeBadgeClass(ev.type)}`}>
                              {ev.type}
                            </span>
                            <h5 className="text-xs font-bold text-slate-900 mt-1">{ev.title}</h5>
                            {ev.description && <p className="text-[10px] text-slate-500 mt-0.5">{ev.description}</p>}
                          </div>
                          {ev.time && <span className="text-[10px] text-slate-400 font-mono">{ev.time}</span>}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* ADD EVENT MODAL */}
        {/* ======================================================== */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-blue-600" />
                  <span>Add Calendar Event</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Event / Deadline Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Client Milestone Signoff"
                    value={addFormData.title}
                    onChange={(e) => setAddFormData({ ...addFormData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={addFormData.date}
                      onChange={(e) => setAddFormData({ ...addFormData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 02:30 PM"
                      value={addFormData.time}
                      onChange={(e) => setAddFormData({ ...addFormData, time: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Category</label>
                    <select
                      value={addFormData.type}
                      onChange={(e) => setAddFormData({ ...addFormData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-500 bg-white"
                    >
                      <option value="PROJECT">PROJECT</option>
                      <option value="SALES">SALES</option>
                      <option value="CRM">CRM</option>
                      <option value="FINANCE">FINANCE</option>
                      <option value="MARKETING">MARKETING</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                    <select
                      value={addFormData.priority}
                      onChange={(e) => setAddFormData({ ...addFormData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-500 bg-white"
                    >
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Description / Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Details about client signoff, follow-up notes, deliverables..."
                    value={addFormData.description}
                    onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Save Event</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW / EDIT EVENT MODAL */}
        {/* ======================================================== */}
        {showViewModal && selectedEvent && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTypeBadgeClass(selectedEvent.type)}`}>
                    {selectedEvent.type}
                  </span>
                  <span className="text-xs font-bold text-slate-500 font-mono">{selectedEvent.date}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!isEditingSelected ? (
                /* View Mode */
                <div className="space-y-4 text-xs">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{selectedEvent.title}</h3>
                    {selectedEvent.time && (
                      <p className="text-slate-500 text-xs mt-1 flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Scheduled for {selectedEvent.time}</span>
                      </p>
                    )}
                  </div>

                  {selectedEvent.description ? (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700">
                      <p className="font-semibold text-slate-900 mb-0.5">Notes & Brief:</p>
                      <p className="leading-relaxed">{selectedEvent.description}</p>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No extra notes provided for this event.</p>
                  )}

                  <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
                    <span>Priority: <strong className="text-slate-800">{selectedEvent.priority || 'MEDIUM'}</strong></span>
                    <span>Status: <strong className="text-slate-800">{selectedEvent.status || 'PENDING'}</strong></span>
                  </div>

                  <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                    {!selectedEvent.isSynced ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(selectedEvent.id)}
                        className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 font-bold cursor-pointer text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">Synced from Project Task</span>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowViewModal(false)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer font-medium"
                      >
                        Close
                      </button>
                      {!selectedEvent.isSynced && (
                        <button
                          type="button"
                          onClick={() => setIsEditingSelected(true)}
                          className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Edit Mode */
                <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Date *</label>
                      <input
                        type="date"
                        required
                        value={editFormData.date}
                        onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Time</label>
                      <input
                        type="text"
                        value={editFormData.time}
                        onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Category</label>
                      <select
                        value={editFormData.type}
                        onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-500 bg-white"
                      >
                        <option value="PROJECT">PROJECT</option>
                        <option value="SALES">SALES</option>
                        <option value="CRM">CRM</option>
                        <option value="FINANCE">FINANCE</option>
                        <option value="MARKETING">MARKETING</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                      <select
                        value={editFormData.priority}
                        onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-500 bg-white"
                      >
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Status</label>
                      <select
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-500 bg-white"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Description / Notes</label>
                    <textarea
                      rows={3}
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditingSelected(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
