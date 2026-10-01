'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Music } from 'lucide-react';
import { InvoiceLineItem } from '@/lib/types';

interface ItemTuneModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InvoiceLineItem | null;
  rowIndex: number;
  onSave: (index: number, updates: Partial<InvoiceLineItem>) => void;
}

export function ItemTuneModal({
  isOpen,
  onClose,
  item,
  rowIndex,
  onSave,
}: ItemTuneModalProps) {
  const [desc, setDesc] = useState('');
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [newDeliverable, setNewDeliverable] = useState('');
  const [unit, setUnit] = useState('MTH');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  useEffect(() => {
    if (item) {
      setDesc(item.desc || '');
      setDeliverables(item.deliverables || []);
      setUnit(item.unit || 'MTH');
      setDiscountPercent(item.discountPercent || 0);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleAddDeliverable = () => {
    if (!newDeliverable.trim()) return;
    setDeliverables([...deliverables, newDeliverable.trim()]);
    setNewDeliverable('');
  };

  const handleRemoveDeliverable = (dIdx: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== dIdx));
  };

  const handleSave = () => {
    onSave(rowIndex, {
      desc,
      deliverables,
      unit,
      discountPercent,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="text-base">🎵</span>
            <h3 className="text-sm font-bold text-slate-800">
              Line Item Scope & Details (Row #{rowIndex + 1})
            </h3>
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
          <div>
            <label className="font-bold text-slate-700 block mb-1">Item Title / Description</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Billing Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value="MTH">MTH (Month)</option>
                <option value="NOS">NOS (Numbers)</option>
                <option value="HRS">HRS (Hours)</option>
                <option value="DAYS">DAYS (Days)</option>
                <option value="PCS">PCS (Pieces)</option>
                <option value="SET">SET (Set)</option>
                <option value="JOB">JOB (Job / Project)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Item Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Deliverables / Scope Bullets */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="font-bold text-slate-700 block">Deliverables / Sub-Scope Items:</label>
            {deliverables.length === 0 ? (
              <p className="text-slate-400 italic">No sub-bullets or scope items added.</p>
            ) : (
              <div className="space-y-1.5">
                {deliverables.map((del, dIdx) => (
                  <div key={dIdx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={del}
                      onChange={(e) => {
                        const updated = [...deliverables];
                        updated[dIdx] = e.target.value;
                        setDeliverables(updated);
                      }}
                      className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveDeliverable(dIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newDeliverable}
                onChange={(e) => setNewDeliverable(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDeliverable())}
                placeholder="Add deliverable point..."
                className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddDeliverable}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg text-xs flex items-center gap-1"
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
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
