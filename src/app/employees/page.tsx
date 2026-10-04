'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../components/dashboard-layout';
import { AuthGuard } from '../../components/auth-guard';
import { EmployeeItem } from '../../lib/types';
import { 
  Users, 
  Plus, 
  Search, 
  Briefcase, 
  Mail, 
  Phone, 
  Edit3,
  Trash2,
  CheckCircle2, 
  AlertCircle,
  Camera,
  X,
  RefreshCw,
  UserCheck,
  Shield,
  Percent
} from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeEmployee, setActiveEmployee] = useState<EmployeeItem | null>(null);

  // Notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form data for creating
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Development',
    designation: '',
    role: 'EMPLOYEE',
    managerName: 'Aman Sir',
  });

  // Form data for editing
  const [editFormData, setEditFormData] = useState({
    id: '',
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    department: 'Development',
    designation: '',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    workloadScore: 50,
    avatar: '',
    managerName: 'Aman Sir',
  });

  const [editAvatarPreview, setEditAvatarPreview] = useState<string>('');
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setEmployees(data);
      }
    } catch (e) {
      console.warn('Error loading employees:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          department: 'Development',
          designation: '',
          role: 'EMPLOYEE',
          managerName: 'Aman Sir',
        });
        showToast('Employee created successfully!');
        fetchEmployees();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to create employee.', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error creating employee.', 'error');
    }
  };

  const openEditModal = (emp: EmployeeItem) => {
    setActiveEmployee(emp);
    setEditFormData({
      id: emp.id,
      employeeId: emp.employeeId || '',
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      department: emp.department || 'Development',
      designation: emp.designation || '',
      role: emp.role || 'EMPLOYEE',
      status: emp.status || 'ACTIVE',
      workloadScore: emp.workloadScore || 50,
      avatar: emp.avatar || '',
      managerName: emp.managerName || 'Aman Sir',
    });
    setEditAvatarPreview(emp.avatar || '');
    setShowEditModal(true);
  };

  const handleEditAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDimension = 200;
        let { width, height } = img;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setEditAvatarPreview(dataUrl);
          setEditFormData((prev) => ({ ...prev, avatar: dataUrl }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.name || !editFormData.email) {
      showToast('Name and email are required.', 'error');
      return;
    }

    setSavingEdit(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        setShowEditModal(false);
        showToast('Employee details updated permanently in database!');
        await fetchEmployees();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update employee.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating employee.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const openDeleteModal = (emp: EmployeeItem) => {
    setActiveEmployee(emp);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!activeEmployee) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/employees?id=${encodeURIComponent(activeEmployee.id)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setShowDeleteModal(false);
        showToast(`Employee "${activeEmployee.name}" deleted permanently.`);
        setActiveEmployee(null);
        await fetchEmployees();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete employee.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting employee.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = employees.filter((emp) => {
    const matchSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.designation.toLowerCase().includes(search.toLowerCase());
    const matchDept = selectedDept === 'ALL' || emp.department.toLowerCase().includes(selectedDept.toLowerCase());
    return matchSearch && matchDept;
  });

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

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-blue-600" />
              <span>Employees & Organization</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Manage CodeKap staff members, department designations, workload & reporting.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, email, designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
            {['ALL', 'Development', 'Digital Marketing', 'Sales', 'Management'].map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedDept === dept
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Employees Table / Cards */}
        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-xs font-medium">Loading organization staff...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No employees found</h3>
            <p className="text-xs text-slate-400 mt-1">Try changing filters or search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((emp) => (
              <div
                key={emp.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.email}`}
                        alt={emp.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900">{emp.name}</h3>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
                            {emp.employeeId}
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 font-medium">{emp.designation}</p>
                      </div>
                    </div>

                    {/* Action buttons: Edit & Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(emp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit employee"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteModal(emp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete employee permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 my-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span>{emp.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                    {emp.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Workload</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            (emp.workloadScore || 50) > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${emp.workloadScore || 50}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800">{emp.workloadScore || 50}%</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      emp.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : emp.status === 'ON_LEAVE'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {emp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ======================================================== */}
        {/* EDIT EMPLOYEE MODAL */}
        {/* ======================================================== */}
        {showEditModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    <span>Edit Employee Details</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Update member info, designation, workload & photo. Changes persist permanently in database.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                {/* Avatar Section */}
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="relative">
                    <img
                      src={editAvatarPreview || `https://api.dicebear.com/7.x/avataaars/svg?seed=${editFormData.email}`}
                      alt="Avatar Preview"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow hover:bg-blue-700 cursor-pointer"
                      title="Upload photo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-xs">Profile Photo</p>
                    <p className="text-[10px] text-slate-400 mb-2">Upload a crisp photo or use default avatar</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Change Photo
                      </button>
                      {editAvatarPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditAvatarPreview('');
                            setEditFormData((prev) => ({ ...prev, avatar: '' }));
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={editFileInputRef}
                    onChange={handleEditAvatarSelect}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Company Email *</label>
                    <input
                      type="email"
                      required
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-500 bg-white"
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Designation Title *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.designation}
                      onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-500 bg-white"
                      placeholder="e.g. Lead Architect"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Department</label>
                    <select
                      value={editFormData.department}
                      onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-500 bg-white"
                    >
                      <option value="Development">Development</option>
                      <option value="Digital Marketing">Digital Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="Administration & Management">Administration & Management</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Role Permission</label>
                    <select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-500 bg-white"
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="DEPT_HEAD">Department Head</option>
                      <option value="MANAGER">Manager</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Status</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-500 bg-white"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="ON_LEAVE">On Leave</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Workload Slider */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="font-semibold text-slate-700">Workload Allocation</label>
                    <span className="font-extrabold text-blue-600 text-xs">{editFormData.workloadScore}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={editFormData.workloadScore}
                    onChange={(e) => setEditFormData({ ...editFormData, workloadScore: Number(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                {/* Modal Footer */}
                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {savingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* DELETE CONFIRMATION MODAL */}
        {/* ======================================================== */}
        {showDeleteModal && activeEmployee && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Permanently Delete Employee?</h3>
              <p className="text-xs text-slate-500 mb-4">
                Are you sure you want to remove <strong className="text-slate-800">{activeEmployee.name}</strong> ({activeEmployee.employeeId})? This will permanently delete their profile from the database.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {deleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Delete Permanently</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CREATE EMPLOYEE MODAL */}
        {/* ======================================================== */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <h3 className="text-base font-bold text-slate-900">Add New Employee</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Company Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. employee@codekap.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Department</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-500 bg-white"
                    >
                      <option value="Development">Development</option>
                      <option value="Digital Marketing">Digital Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="Administration & Management">Administration & Management</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Role Type</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-500 bg-white"
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="DEPT_HEAD">Department Head</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Designation Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Fullstack Next.js Developer"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs cursor-pointer"
                  >
                    Create Employee
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
