'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Database,
  Table,
  HardDrive,
  RefreshCw,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  Briefcase,
  CheckSquare,
  FileCheck2,
  Users,
  UserCheck,
  Layers,
  Shield,
  Megaphone,
  Sparkles,
  FileText,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Wallet,
  BookOpen,
  Clock,
  MessageSquare,
  Send,
  Activity,
  Globe,
  Share2,
  ChevronRight,
  Eye,
  Copy,
  Check,
  Server,
  Key
} from 'lucide-react';

interface TableMeta {
  id: string;
  name: string;
  model: string;
  count: number;
  icon: string;
  category: string;
}

interface DatabaseInfo {
  status: string;
  engine: string;
  databaseFile: string;
  sizeKb: number;
  totalTables: number;
  totalRecords: number;
  lastSync: string;
  tables: TableMeta[];
}

export default function DatabasePage() {
  const { profile, role } = useAuth();
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string>('clients');
  const [tableData, setTableData] = useState<{ count: number; rows: any[] } | null>(null);
  const [loadingTable, setLoadingTable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [exporting, setExporting] = useState(false);
  const [viewRawJson, setViewRawJson] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchDatabaseInfo = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/database', {
        headers: {
          'X-User-Id': profile?.uid || 'usr_aman',
          'X-User-Email': profile?.email || 'aman@codekap.com',
          'X-User-Role': role || 'ADMIN',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDbInfo(data);
      }
    } catch (err) {
      console.error('Failed to load db info:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableRows = async (tableId: string) => {
    try {
      setLoadingTable(true);
      setSelectedTable(tableId);
      setSelectedRow(null);
      const res = await fetch(`/api/database?table=${encodeURIComponent(tableId)}`, {
        headers: {
          'X-User-Id': profile?.uid || 'usr_aman',
          'X-User-Email': profile?.email || 'aman@codekap.com',
          'X-User-Role': role || 'ADMIN',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTableData(data);
      }
    } catch (err) {
      console.error('Failed to fetch table data:', err);
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  useEffect(() => {
    if (dbInfo && dbInfo.tables.length > 0) {
      fetchTableRows(selectedTable);
    }
  }, [selectedTable]);

  const handleExportJson = async () => {
    try {
      setExporting(true);
      const res = await fetch('/api/database?export=true', {
        headers: {
          'X-User-Id': profile?.uid || 'usr_aman',
          'X-User-Email': profile?.email || 'aman@codekap.com',
          'X-User-Role': role || 'ADMIN',
        },
      });
      if (res.ok) {
        const fullBackup = await res.json();
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `codekap_database_backup_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }
    } catch (err) {
      alert('Error exporting database backup.');
    } finally {
      setExporting(false);
    }
  };

  const copyRowJson = (row: any) => {
    navigator.clipboard.writeText(JSON.stringify(row, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTableIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building2': return Building2;
      case 'Briefcase': return Briefcase;
      case 'CheckSquare': return CheckSquare;
      case 'FileCheck2': return FileCheck2;
      case 'Users': return Users;
      case 'UserCheck': return UserCheck;
      case 'Layers': return Layers;
      case 'Shield': return Shield;
      case 'Megaphone': return Megaphone;
      case 'Sparkles': return Sparkles;
      case 'FileText': return FileText;
      case 'Globe': return Globe;
      case 'Share2': return Share2;
      case 'TrendingUp': return TrendingUp;
      case 'Receipt': return Receipt;
      case 'FileSpreadsheet': return FileSpreadsheet;
      case 'Wallet': return Wallet;
      case 'BookOpen': return BookOpen;
      case 'Clock': return Clock;
      case 'MessageSquare': return MessageSquare;
      case 'Send': return Send;
      case 'Activity': return Activity;
      default: return Database;
    }
  };

  const categories = ['ALL', 'Core CRM', 'Operations', 'Team & Auth', 'Growth & Ads', 'KAIRO Social', 'Sales & CRM', 'Finance', 'Knowledge', 'Chat', 'Analytics', 'System'];

  const filteredTables = (dbInfo?.tables || []).filter((t) => {
    const matchesCategory = activeCategory === 'ALL' || t.category === activeCategory;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const currentTableMeta = (dbInfo?.tables || []).find((t) => t.id === selectedTable);

  const filteredRows = (tableData?.rows || []).filter((row) => {
    if (!searchQuery) return true;
    const rowStr = JSON.stringify(row).toLowerCase();
    return rowStr.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-50/70 p-6 md:p-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Live Database Hub
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  SQLite Single Source of Truth
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Central persistent database storing all platform operations, client records, tasks, campaigns, finance & social media.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchDatabaseInfo();
              fetchTableRows(selectedTable);
            }}
            disabled={loading || loadingTable}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs flex items-center gap-2 transition-all cursor-pointer btn-press"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || loadingTable ? 'animate-spin' : ''}`} />
            <span>Sync & Refresh</span>
          </button>

          <button
            onClick={handleExportJson}
            disabled={exporting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer btn-press"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Exporting...' : 'Export Full DB Backup (JSON)'}</span>
          </button>
        </div>
      </div>

      {/* Database Key Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 card-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Database Engine</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-900">SQLite + Prisma ORM</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Persistent File Storage
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 card-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total System Records</span>
            <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Table className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-purple-900">
            {dbInfo ? dbInfo.totalRecords.toLocaleString() : '...'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Across {dbInfo ? dbInfo.totalTables : '22'} structured tables
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 card-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Database Storage Size</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {dbInfo ? `${dbInfo.sizeKb} KB` : '...'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono truncate">
            {dbInfo?.databaseFile || 'prisma/dev.db'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 card-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Real-time Connection</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-emerald-700">Healthy (WAL Mode)</div>
          <div className="text-[11px] text-slate-500 font-medium">
            Zero data-loss transactional storage
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tables List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Table className="w-4 h-4 text-blue-600" />
                <span>Database Tables ({filteredTables.length})</span>
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {categories.slice(0, 5).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Tables List Item */}
            <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredTables.map((tbl) => {
                const IconComponent = getTableIcon(tbl.icon);
                const isSelected = selectedTable === tbl.id;

                return (
                  <button
                    key={tbl.id}
                    onClick={() => fetchTableRows(tbl.id)}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer btn-press ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-600/20'
                        : 'bg-slate-50/70 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-600 shadow-2xs'
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{tbl.name}</div>
                        <div
                          className={`text-[10px] ${
                            isSelected ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          {tbl.category}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                        }`}
                      >
                        {tbl.count}
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Table Explorer & Rows Inspector */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Table Header / Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">
                    {currentTableMeta?.name || selectedTable}
                  </h3>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {tableData ? `${tableData.rows.length} rows loaded` : 'Loading...'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prisma Model: <code className="font-mono text-slate-700 font-bold">{currentTableMeta?.model}</code> • Live SQLite Query
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search in table..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-44 sm:w-56 pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-2xs"
                  />
                </div>

                <button
                  onClick={() => setViewRawJson(!viewRawJson)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    viewRawJson
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {viewRawJson ? 'Table View' : 'Raw JSON'}
                </button>
              </div>
            </div>

            {/* Table Content */}
            <div className="p-4 sm:p-5">
              {loadingTable ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-xs font-medium">Fetching records from SQLite database...</span>
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <Table className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">No records found in this table.</p>
                  <p className="text-[11px] text-slate-400">Records created in the app will automatically be stored here.</p>
                </div>
              ) : viewRawJson ? (
                <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto max-h-[500px] text-xs font-mono text-emerald-400 custom-scrollbar">
                  <pre>{JSON.stringify(filteredRows, null, 2)}</pre>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[500px] custom-scrollbar border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200">
                        {Object.keys(filteredRows[0] || {})
                          .slice(0, 6)
                          .map((key) => (
                            <th key={key} className="p-3 capitalize tracking-tight font-extrabold whitespace-nowrap">
                              {key}
                            </th>
                          ))}
                        <th className="p-3 text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRows.map((row, idx) => (
                        <tr
                          key={row.id || idx}
                          className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                          onClick={() => setSelectedRow(row)}
                        >
                          {Object.keys(filteredRows[0] || {})
                            .slice(0, 6)
                            .map((key) => {
                              const val = row[key];
                              const displayVal =
                                typeof val === 'object' && val !== null
                                  ? JSON.stringify(val)
                                  : String(val ?? '—');

                              return (
                                <td
                                  key={key}
                                  className="p-3 text-slate-700 font-medium max-w-[180px] truncate"
                                  title={displayVal}
                                >
                                  {displayVal}
                                </td>
                              );
                            })}
                          <td className="p-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRow(row);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 transition-all cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Single Row Deep Inspector */}
      {selectedRow && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 max-h-[85vh] flex flex-col card-lift">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Record Details: {selectedRow.name || selectedRow.title || selectedRow.id}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">Table: {selectedTable}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyRowJson(selectedRow)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={() => setSelectedRow(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Row Details Grid */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {Object.entries(selectedRow).map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-xs">
                  <span className="font-mono font-bold text-slate-600 sm:w-1/3 truncate">{k}:</span>
                  <span className="font-mono text-slate-900 sm:w-2/3 break-all bg-white p-2 rounded-lg border border-slate-200/60">
                    {typeof v === 'object' && v !== null ? JSON.stringify(v, null, 2) : String(v ?? 'null')}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedRow(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
