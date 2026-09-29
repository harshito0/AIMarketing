'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '../../components/dashboard-layout';
import { AuthGuard } from '../../components/auth-guard';
import { useAuth } from '../../lib/auth/auth-context';
import { Task, TaskPriority, TaskStatus, UserProfile, Client, Invitation } from '../../lib/types';
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  User,
  Shield,
  Trash2,
  Edit,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Filter,
  Check,
  Send,
  X,
  Mail
} from 'lucide-react';

export default function TasksPage() {
  const { profile, role, user: authUser } = useAuth();
  const isSuperOrManager = role === 'ADMIN' || role === 'MANAGER' || profile?.email === 'aman@codekap.com';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamUsers, setTeamUsers] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Tab & Filter state
  const [activeTab, setActiveTab] = useState<'my' | 'team'>('team');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // New / Edit Task Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [customEmailMode, setCustomEmailMode] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as TaskPriority,
    assignedToEmail: 'sharshit.0211@gmail.com',
    clientId: '',
    dueDate: '',
  });

  const openCreateTaskModal = () => {
    setEditingTask(null);
    setNewTask({
      title: '',
      description: '',
      priority: 'MEDIUM',
      assignedToEmail: 'sharshit.0211@gmail.com',
      clientId: '',
      dueDate: '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'MEDIUM',
      assignedToEmail: task.assignedToEmail || '',
      clientId: task.clientId || '',
      dueDate: task.dueDate || '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-Id': profile?.uid || authUser?.uid || 'usr_aman',
      'X-User-Email': profile?.email || authUser?.email || 'aman@codekap.com',
      'X-User-Role': role || 'ADMIN',
    };
    try {
      if (authUser) {
        const token = await authUser.getIdToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
    } catch {}
    return headers;
  };

  const fetchTasks = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError('');
    try {
      const headers = await getAuthHeaders();
      const effectiveUserId = profile?.uid || authUser?.uid || 'usr_aman';

      const url = (isSuperOrManager && activeTab === 'team')
        ? '/api/tasks?all=true'
        : `/api/tasks?userId=${encodeURIComponent(effectiveUserId)}`;

      const [taskRes, userRes, clientRes, invRes] = await Promise.all([
        fetch(url, { headers }),
        fetch('/api/users', { headers }),
        fetch('/api/clients', { headers }),
        fetch('/api/admin/invitations', { headers }),
      ]);

      let taskJson: any = null;
      try {
        const text = await taskRes.text();
        taskJson = text ? JSON.parse(text) : null;
      } catch {}

      if (taskRes.ok && taskJson && Array.isArray(taskJson)) {
        setTasks(taskJson);
      }

      let userJson: any = null;
      try {
        const text = await userRes.text();
        userJson = text ? JSON.parse(text) : null;
      } catch {}

      if (userRes.ok && userJson && Array.isArray(userJson)) {
        setTeamUsers(userJson);
      }

      let clientJson: any = null;
      try {
        const text = await clientRes.text();
        clientJson = text ? JSON.parse(text) : null;
      } catch {}

      if (clientRes.ok && clientJson && Array.isArray(clientJson)) {
        setClients(clientJson);
      }

      let invJson: any = null;
      try {
        const text = await invRes.text();
        invJson = text ? JSON.parse(text) : null;
      } catch {}

      if (invRes.ok && invJson && Array.isArray(invJson)) {
        setInvitations(invJson);
      }
    } catch (err: any) {
      console.warn('[Tasks fetch notice]:', err?.message);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [activeTab, profile, authUser, isSuperOrManager]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Combine unique candidate assignees from both registered users and invitations
  const combinedAssignees = React.useMemo(() => {
    const map = new Map<string, { email: string; name: string; tag: string }>();

    teamUsers.forEach((u) => {
      map.set(u.email.toLowerCase(), {
        email: u.email,
        name: u.name || u.email.split('@')[0],
        tag: `Member [${u.role}]`,
      });
    });

    invitations.forEach((inv) => {
      if (!map.has(inv.email.toLowerCase())) {
        map.set(inv.email.toLowerCase(), {
          email: inv.email,
          name: inv.name || inv.email.split('@')[0],
          tag: `Invited [${inv.role}] (Passcode: ${inv.passcode})`,
        });
      }
    });

    // Default fallbacks if empty
    if (!map.has('sharshit.0211@gmail.com')) {
      map.set('sharshit.0211@gmail.com', {
        email: 'sharshit.0211@gmail.com',
        name: 'Harshit Singh',
        tag: 'Invited Team Member',
      });
    }
    if (!map.has('harshitsingh19622@gmail.com')) {
      map.set('harshitsingh19622@gmail.com', {
        email: 'harshitsingh19622@gmail.com',
        name: 'Harshit Singh (Admin)',
        tag: 'Lead Engineer',
      });
    }

    return Array.from(map.values());
  }, [teamUsers, invitations]);

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.assignedToEmail.trim()) {
      setError('Please provide a task title and assignee email.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const emailLower = newTask.assignedToEmail.toLowerCase().trim();
      const selectedCandidate = combinedAssignees.find((c) => c.email.toLowerCase() === emailLower);
      const selectedClient = clients.find((c) => c.id === newTask.clientId);
      const effectiveUserId = profile?.uid || authUser?.uid || 'usr_aman';

      const payload = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        priority: newTask.priority,
        assignedToId: emailLower,
        assignedToName: selectedCandidate?.name || emailLower.split('@')[0],
        assignedToEmail: emailLower,
        clientId: selectedClient?.id || undefined,
        clientName: selectedClient?.name || undefined,
        dueDate: newTask.dueDate || undefined,
      };

      const headers = await getAuthHeaders();
      const isEdit = !!editingTask;
      const url = isEdit ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      let data: any = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch {}

      if (res.ok && (data.success || isEdit)) {
        if (isEdit) {
          setTasks((prev) =>
            prev.map((t) => (t.id === editingTask.id ? { ...t, ...payload } : t))
          );
          setSuccessMessage(`Task updated successfully!`);
        } else {
          const createdTaskRecord: Task = data.task || {
            id: `tsk_${Date.now()}`,
            ...payload,
            status: 'TODO',
            assignedById: effectiveUserId,
            assignedByName: profile?.name || 'Super Admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          setTasks((prev) => [createdTaskRecord, ...prev.filter((t) => t.id !== createdTaskRecord.id)]);
          setSuccessMessage(`Task assigned successfully to ${payload.assignedToName} (${payload.assignedToEmail})!`);
        }

        setIsModalOpen(false);
        setEditingTask(null);
        setActiveTab('team');
        setNewTask({
          title: '',
          description: '',
          priority: 'MEDIUM',
          assignedToEmail: 'sharshit.0211@gmail.com',
          clientId: '',
          dueDate: '',
        });
        fetchTasks();
      } else {
        setError(data.error || `Failed to ${isEdit ? 'update' : 'create'} task.`);
      }
    } catch (err: any) {
      setError(err.message || 'Error processing task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const headers = await getAuthHeaders();
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const headers = await getAuthHeaders();
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers,
      });
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">URGENT</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">MEDIUM</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">LOW</span>;
      default:
        return null;
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
                <CheckSquare className="w-4 h-4" />
                <span>Team Task Delegation & Workflows</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Team Tasks & Deliverables
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Assign tasks to specific team members, track execution milestones, and monitor marketing deliverables.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchTasks(true)}
                disabled={refreshing}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer btn-press"
                title="Refresh tasks"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              {isSuperOrManager && (
                <button
                  onClick={openCreateTaskModal}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer btn-press"
                >
                  <Plus className="w-4 h-4" />
                  <span>Assign Task to Member</span>
                </button>
              )}
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Top Control Tabs & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs card-lift">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('my')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer btn-press ${
                  activeTab === 'my'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                My Assigned Tasks ({tasks.filter(t => t.assignedToEmail === profile?.email || t.assignedToId === profile?.uid).length})
              </button>

              {isSuperOrManager && (
                <button
                  onClick={() => setActiveTab('team')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer btn-press ${
                    activeTab === 'team'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Team Tasks (Super Admin View)
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              {[
                { id: 'ALL', label: 'All', count: tasks.length },
                { id: 'TODO', label: 'To Do', count: tasks.filter(t => t.status === 'TODO').length },
                { id: 'IN_PROGRESS', label: 'In Progress', count: tasks.filter(t => t.status === 'IN_PROGRESS').length },
                { id: 'COMPLETED', label: 'Completed', count: tasks.filter(t => t.status === 'COMPLETED').length },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer btn-press flex items-center gap-1.5 ${
                    statusFilter === tab.id
                      ? 'bg-slate-900 text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    statusFilter === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Task List Table / Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden card-lift">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-100 space-y-2">
                    <div className="h-4 w-48 rounded skeleton-shimmer" />
                    <div className="h-3 w-72 rounded skeleton-shimmer" />
                  </div>
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {statusFilter !== 'ALL' ? `No ${statusFilter.toLowerCase().replace('_', ' ')} tasks found` : 'No tasks assigned yet'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {isSuperOrManager
                    ? 'As Super Admin, you can assign marketing tasks, creative reviews, or campaign optimization duties to team members.'
                    : 'You do not have any pending tasks right now. Great job!'}
                </p>
                {isSuperOrManager && (
                  <div className="pt-2">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 cursor-pointer btn-press"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Assign First Task</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTasks.map(task => {
                  const isCompleted = task.status === 'COMPLETED';
                  const isInProgress = task.status === 'IN_PROGRESS';

                  return (
                    <div
                      key={task.id}
                      className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-slate-50/70 animate-fade-in ${
                        isCompleted ? 'bg-slate-50/40 opacity-80' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Quick Checkbox Status Toggle */}
                        <button
                          onClick={() =>
                            handleStatusChange(task.id, isCompleted ? 'TODO' : 'COMPLETED')
                          }
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center mt-0.5 transition-all cursor-pointer btn-press ${
                            isCompleted
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : isInProgress
                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                              : 'border-slate-300 hover:border-blue-600 text-transparent'
                          }`}
                          title={isCompleted ? 'Mark as Incomplete' : 'Mark as Completed'}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={`text-sm font-bold text-slate-900 ${
                                isCompleted ? 'line-through text-slate-400' : ''
                              }`}
                            >
                              {task.title}
                            </h3>
                            {getPriorityBadge(task.priority)}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isInProgress
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {task.status.replace('_', ' ')}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                              {task.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                            <div className="flex items-center gap-1.5 font-medium text-slate-700">
                              <User className="w-3.5 h-3.5 text-blue-600" />
                              <span>Assigned to: <strong>{task.assignedToName}</strong> ({task.assignedToEmail})</span>
                            </div>

                            {task.clientName && (
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>Client: <strong>{task.clientName}</strong></span>
                              </div>
                            )}

                            {task.dueDate && (
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>Due: <strong>{task.dueDate}</strong></span>
                              </div>
                            )}

                            <span className="text-[11px] text-slate-400">
                              By {task.assignedByName} • {new Date(task.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Status Menu */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          className="text-xs font-semibold p-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-blue-600 cursor-pointer"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>

                        {isSuperOrManager && (
                          <>
                            <button
                              onClick={() => openEditTaskModal(task)}
                              className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer btn-press"
                              title="Edit Task"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer btn-press"
                              title="Delete Task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal: Assign / Edit Task */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 border border-slate-200 shadow-2xl space-y-5 my-8 card-lift">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      {editingTask ? 'Edit Workspace Task' : 'Assign Task to Team Member'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {editingTask ? 'Update task deliverables, priority, or deadline' : 'Task will immediately appear on the member\'s dashboard'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTask(null);
                  }}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer btn-press"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTask} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Assign To Team Member *
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomEmailMode(!customEmailMode)}
                      className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      {customEmailMode ? 'Pick from Team List' : 'Or Type Custom Email'}
                    </button>
                  </div>

                  {customEmailMode ? (
                    <input
                      type="email"
                      required
                      placeholder="e.g. member@company.com"
                      value={newTask.assignedToEmail}
                      onChange={(e) => setNewTask({ ...newTask, assignedToEmail: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                    />
                  ) : (
                    <select
                      required
                      value={newTask.assignedToEmail}
                      onChange={(e) => setNewTask({ ...newTask, assignedToEmail: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                    >
                      <option value="">-- Select Member / Invite --</option>
                      {combinedAssignees.map((candidate) => (
                        <option key={candidate.email} value={candidate.email}>
                          {candidate.name} ({candidate.email}) — {candidate.tag}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Task Title / Objective *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Design 3 Ad Creatives for G1 Sphere Dental Campaign"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Task Instructions & Details
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe deliverables, required copywriting style, target demographics, or project guidance..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent ⚡</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Due Date (Optional)</label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Associated Client Business (Optional)
                  </label>
                  <select
                    value={newTask.clientId}
                    onChange={(e) => setNewTask({ ...newTask, clientId: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                  >
                    <option value="">-- No Specific Client (General Task) --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.industry})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Task will immediately be synced to the assignee's personal workspace.</span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer btn-press"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !newTask.title.trim() || !newTask.assignedToEmail}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center gap-2 disabled:opacity-60 cursor-pointer btn-press"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{editingTask ? 'Saving...' : 'Assigning...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{editingTask ? 'Save Task Changes' : 'Assign Task'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
