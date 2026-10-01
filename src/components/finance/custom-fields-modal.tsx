'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Sliders, Check } from 'lucide-react';

export interface CustomFieldItem {
  key: string;
  value: string;
}

interface CustomFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customFields: CustomFieldItem[];
  onSave: (fields: CustomFieldItem[]) => void;
}

const COMMON_FIELDS = [
  'Purchase Order (PO) Number',
  'Project Reference',
  'Payment Terms',
  'Delivery Note No.',
  'Sales Representative',
  'E-Way Bill No.',
  'Vehicle Number',
  'Customer Note',
];

export function CustomFieldsModal({
  isOpen,
  onClose,
  customFields,
  onSave,
}: CustomFieldsModalProps) {
  const [fields, setFields] = useState<CustomFieldItem[]>(customFields || []);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  if (!isOpen) return null;

  const handleAddField = () => {
    if (!newKey.trim()) return;
    setFields([...fields, { key: newKey.trim(), value: newValue.trim() }]);
    setNewKey('');
    setNewValue('');
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleUpdateField = (index: number, key: string, value: string) => {
    const updated = [...fields];
    updated[index] = { key, value };
    setFields(updated);
  };

  const handleSave = () => {
    onSave(fields);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Custom Fields</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <p className="text-slate-500">
            Add custom fields to display additional meta-information on this document and printed PDF.
          </p>

          {/* Quick presets */}
          <div>
            <span className="font-bold text-slate-700 block mb-1.5">Quick Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_FIELDS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    if (!fields.some((f) => f.key === preset)) {
                      setFields([...fields, { key: preset, value: '' }]);
                    }
                  }}
                  className="px-2 py-1 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200 text-[11px] font-medium transition-colors"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Existing Fields List */}
          <div className="space-y-2 pt-2">
            <span className="font-bold text-slate-700 block">Active Fields:</span>
            {fields.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl text-slate-400">
                No custom fields added yet.
              </div>
            ) : (
              fields.map((f, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={f.key}
                    onChange={(e) => handleUpdateField(idx, e.target.value, f.value)}
                    placeholder="Field Name"
                    className="w-1/2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={f.value}
                    onChange={(e) => handleUpdateField(idx, f.key, e.target.value)}
                    placeholder="Field Value"
                    className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveField(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add New Field Row */}
          <div className="pt-2 border-t border-slate-100">
            <span className="font-bold text-slate-700 block mb-1.5">Add Custom Field:</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Field Name (e.g. PO Number)"
                className="w-1/2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Value"
                className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddField}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 text-xs font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm"
          >
            Apply Fields
          </button>
        </div>
      </div>
    </div>
  );
}
