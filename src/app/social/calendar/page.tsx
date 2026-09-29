'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AuthGuard } from '@/components/auth-guard';
import { ClientSelector } from '@/components/social/client-selector';
import { SocialSubNav } from '@/components/social/social-subnav';
import { Client } from '@/lib/types';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Clock,
  Send,
  AlertCircle,
  FileText,
  RefreshCw,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  X,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  caption: string;
  platforms: string[];
  status: 'DRAFT' | 'READY' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED';
  date: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  mediaUrl: string | null;
  mediaType: string;
  createdByName: string;
  failureReason?: string | null;
}

export default function SocialCalendarPage() {
  const router = useRouter();
  const { profile, role } = useAuth();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchCalendarEvents = async (clientId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/social/calendar?clientId=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.warn('Calendar fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClient?.id) {
      fetchCalendarEvents(selectedClient.id);
    }
  }, [selectedClient?.id]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Calendar matrix calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  const getEventsForDay = (day: number) => {
    const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((ev) => {
      if (statusFilter !== 'ALL' && ev.status !== statusFilter) return false;
      const evDateStr = ev.date.split('T')[0];
      return evDateStr === targetDateStr;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'SCHEDULED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PUBLISHING':
        return 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse';
      case 'FAILED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Delete this post from calendar?')) return;
    try {
      const res = await fetch(`/api/social/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setSelectedEvent(null);
      }
    } catch (err) {
      console.error('Delete post error:', err);
    }
  };

  const handleDuplicate = (ev: CalendarEvent) => {
    router.push(`/social/create?duplicateId=${ev.id}`);
  };

  const handlePublishNow = async (ev: CalendarEvent) => {
    try {
      const res = await fetch('/api/social/posts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: ev.id }),
      });
      if (res.ok) {
        if (selectedClient?.id) fetchCalendarEvents(selectedClient.id);
        setSelectedEvent(null);
      }
    } catch (err) {
      console.error('Publish error:', err);
    }
  };

  return (
    <AuthGuard allowedDepartments={['Digital Marketing', 'Social Media', 'Marketing']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
                <CalendarIcon className="w-4 h-4" />
                <span>Editorial Content Calendar</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Social Content Calendar
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Plan, organize, reschedule, and visualize posts across Instagram and Facebook.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ClientSelector
                selectedClientId={selectedClient?.id || null}
                onSelectClient={(c) => setSelectedClient(c)}
              />
              <Link
                href="/social/create"
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer btn-press shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Schedule Post</span>
              </Link>
            </div>
          </div>

          <SocialSubNav />

          {/* Calendar Controls & Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-base font-extrabold text-slate-900 min-w-[180px]">
                {monthName}
              </h2>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-bold">Status:</span>
                {['ALL', 'SCHEDULED', 'PUBLISHED', 'DRAFT', 'FAILED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                      statusFilter === st
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Calendar Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 auto-rows-[140px] divide-x divide-y divide-slate-100">
              {/* Padding empty days */}
              {paddingDays.map((_, i) => (
                <div key={`pad-${i}`} className="bg-slate-50/40 p-2 min-h-[140px]" />
              ))}

              {/* Month Days */}
              {daysArray.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() === month &&
                  new Date().getFullYear() === year;

                return (
                  <div
                    key={day}
                    className={`p-2 relative flex flex-col justify-between group hover:bg-blue-50/20 transition-colors min-h-[140px] overflow-hidden ${
                      isToday ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          isToday
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-700'
                        }`}
                      >
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] text-slate-400 font-bold">
                          {dayEvents.length} post{dayEvents.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Events Container */}
                    <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar max-h-[100px]">
                      {dayEvents.map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => setSelectedEvent(ev)}
                          className={`w-full text-left p-1.5 rounded-lg border text-[10px] font-bold truncate block transition-all hover:scale-[1.02] shadow-2xs ${getStatusBadge(
                            ev.status
                          )}`}
                        >
                          <div className="flex items-center gap-1 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
                            <span className="truncate">{ev.title}</span>
                          </div>
                          <div className="text-[9px] opacity-75 truncate">
                            {ev.platforms.join(', ')} • {ev.status}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Post Details Full Modal */}
          {selectedEvent && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        selectedEvent.status
                      )}`}
                    >
                      {selectedEvent.status}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Platforms: {selectedEvent.platforms.join(' & ')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {selectedEvent.mediaUrl && (
                  <div className="rounded-2xl overflow-hidden max-h-48 bg-slate-950 flex items-center justify-center">
                    <img
                      src={selectedEvent.mediaUrl}
                      alt="Event media"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900">Post Caption:</h4>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100 whitespace-pre-line max-h-40 overflow-y-auto">
                    {selectedEvent.caption}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <div><strong>Client:</strong> {selectedEvent.clientName}</div>
                  <div><strong>Created By:</strong> {selectedEvent.createdByName}</div>
                  <div>
                    <strong>Date / Schedule:</strong>{' '}
                    {new Date(selectedEvent.date).toLocaleString()}
                  </div>
                  {selectedEvent.failureReason && (
                    <div className="text-rose-600">
                      <strong>Failure Reason:</strong> {selectedEvent.failureReason}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDuplicate(selectedEvent)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicate</span>
                    </button>

                    <Link
                      href={`/social/create?editId=${selectedEvent.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Post</span>
                    </Link>

                    {selectedEvent.status !== 'PUBLISHED' && (
                      <button
                        type="button"
                        onClick={() => handlePublishNow(selectedEvent)}
                        className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Publish Now</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
