'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  ChevronRight,
  HelpCircle,
  Building,
  Save,
  Check,
} from 'lucide-react';
import { SundryDebtorCustomer } from '@/lib/types';

interface NewCustomerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: SundryDebtorCustomer) => void;
  initialData?: Partial<SundryDebtorCustomer> | null;
}

const INDIAN_STATES = [
  'BIHAR',
  'PUNJAB',
  'CHANDIGARH',
  'DELHI',
  'HARYANA',
  'HIMACHAL PRADESH',
  'JAMMU & KASHMIR',
  'UTTAR PRADESH',
  'UTTARAKHAND',
  'RAJASTHAN',
  'GUJARAT',
  'MAHARASHTRA',
  'KARNATAKA',
  'TAMIL NADU',
  'TELANGANA',
  'ANDHRA PRADESH',
  'KERALA',
  'WEST BENGAL',
  'ODISHA',
  'MADHYA PRADESH',
  'GOA',
  'ASSAM',
];

export function NewCustomerDrawer({
  isOpen,
  onClose,
  onSave,
  initialData,
}: NewCustomerDrawerProps) {
  const [registrationType, setRegistrationType] = useState('Unregistered (Without GST)');
  const [partyType, setPartyType] = useState('Not Applicable');
  const [legalName, setLegalName] = useState('');
  const [accountDisplayName, setAccountDisplayName] = useState('');
  const [shortAliasName, setShortAliasName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [panItTanNo, setPanItTanNo] = useState('');
  const [creditPeriodDays, setCreditPeriodDays] = useState('');
  const [defaultPaymentMode, setDefaultPaymentMode] = useState('N/A');
  const [statutoryInfo, setStatutoryInfo] = useState(false);
  
  // Mailing Details
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [country, setCountry] = useState('India');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('BIHAR');

  // Additional options
  const [provideBankDetails, setProvideBankDetails] = useState(false);
  const [enableCreditLimit, setEnableCreditLimit] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('0.00');
  const [balanceType, setBalanceType] = useState<'Cr' | 'Dr'>('Cr');

  // Populate initial data when opened
  useEffect(() => {
    if (initialData) {
      if (initialData.registrationType) setRegistrationType(initialData.registrationType);
      if (initialData.partyType) setPartyType(initialData.partyType);
      if (initialData.legalName) setLegalName(initialData.legalName);
      if (initialData.accountDisplayName) setAccountDisplayName(initialData.accountDisplayName);
      if (initialData.shortAliasName) setShortAliasName(initialData.shortAliasName);
      if (initialData.email) setEmail(initialData.email);
      if (initialData.mobileNo) setMobileNo(initialData.mobileNo);
      if (initialData.contactPersonName) setContactPersonName(initialData.contactPersonName);
      if (initialData.panItTanNo) setPanItTanNo(initialData.panItTanNo);
      if (initialData.creditPeriodDays) setCreditPeriodDays(String(initialData.creditPeriodDays));
      if (initialData.defaultPaymentMode) setDefaultPaymentMode(initialData.defaultPaymentMode);
      if (initialData.addressLine1) setAddressLine1(initialData.addressLine1);
      if (initialData.addressLine2) setAddressLine2(initialData.addressLine2);
      if (initialData.pincode) setPincode(initialData.pincode);
      if (initialData.city) setCity(initialData.city);
      if (initialData.state) setState(initialData.state);
      if (initialData.openingBalance !== undefined) setOpeningBalance(String(initialData.openingBalance));
      if (initialData.balanceType) setBalanceType(initialData.balanceType);
    }
  }, [initialData, isOpen]);

  // Keyboard shortcut listeners (CTRL + ALT + S: Save, CTRL + ALT + C: Cancel)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSave();
      } else if (e.ctrlKey && e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, accountDisplayName, legalName, email, mobileNo, addressLine1, city, state]);

  if (!isOpen) return null;

  const handleSave = () => {
    const finalName = accountDisplayName.trim() || legalName.trim() || 'New Customer';
    const customerObj: SundryDebtorCustomer = {
      id: initialData?.id || `cust_${Date.now()}`,
      registrationType,
      partyType,
      legalName: legalName.trim() || finalName,
      accountDisplayName: finalName,
      shortAliasName: shortAliasName.trim(),
      email: email.trim(),
      mobileNo: mobileNo.trim(),
      contactPersonName: contactPersonName.trim(),
      panItTanNo: panItTanNo.trim(),
      creditPeriodDays: creditPeriodDays ? Number(creditPeriodDays) : undefined,
      defaultPaymentMode,
      statutoryInfo,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      country,
      pincode: pincode.trim(),
      city: city.trim(),
      state,
      bankDetailsProvided: provideBankDetails,
      enableCreditLimit,
      openingBalance: parseFloat(openingBalance) || 0,
      balanceType,
      balanceFormatted: `₹${parseFloat(openingBalance || '0').toFixed(2)} ${balanceType}`,
      gstin: panItTanNo.length === 15 ? panItTanNo : undefined,
    };

    onSave(customerObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel matching Screenshot 5 */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              New Customer (Sundry Debtors)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Custom Field</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Registration Type */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Registration Type</label>
            <select
              value={registrationType}
              onChange={(e) => setRegistrationType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="Unregistered (Without GST)">Unregistered (Without GST)</option>
              <option value="Registered Regular">Registered Regular (With GST)</option>
              <option value="Composition Scheme">Composition Scheme</option>
              <option value="Consumer">Consumer</option>
              <option value="Overseas / Export">Overseas / Export</option>
            </select>
          </div>

          {/* Party Type & Legal Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Party Type</label>
              <select
                value={partyType}
                onChange={(e) => setPartyType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value="Not Applicable">Not Applicable</option>
                <option value="Proprietorship">Proprietorship</option>
                <option value="Partnership">Partnership</option>
                <option value="Private Limited">Private Limited</option>
                <option value="Public Limited">Public Limited</option>
                <option value="LLP">LLP</option>
              </select>
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="font-bold text-slate-700">Legal Name</label>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Barry Tone"
                value={legalName}
                onChange={(e) => {
                  setLegalName(e.target.value);
                  if (!accountDisplayName) setAccountDisplayName(e.target.value);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Account Display Name & Short/Alias Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Account display name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Barry Tone"
                value={accountDisplayName}
                onChange={(e) => setAccountDisplayName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Short/Alias Name</label>
              <input
                type="text"
                placeholder="Jack"
                value={shortAliasName}
                onChange={(e) => setShortAliasName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Email & Mobile */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                placeholder="example@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Mobile No.</label>
              <div className="flex">
                <span className="inline-flex items-center gap-1 px-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-xs font-medium text-slate-600">
                  <span>🇮🇳</span> +91
                </span>
                <input
                  type="text"
                  placeholder="9876543210"
                  value={mobileNo}
                  onChange={(e) => setMobileNo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-r-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Contact person name */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Contact person name</label>
            <input
              type="text"
              placeholder="Barry Tone"
              value={contactPersonName}
              onChange={(e) => setContactPersonName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* PAN/IT/TAN No. & Default Credit Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">PAN/IT/TAN No.</label>
              <input
                type="text"
                placeholder="BJXXXXXX1H"
                value={panItTanNo}
                onChange={(e) => setPanItTanNo(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 uppercase placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Default Credit Period (In days)</label>
              <input
                type="number"
                placeholder="Default Credit Period (In days)"
                value={creditPeriodDays}
                onChange={(e) => setCreditPeriodDays(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Default Payment Mode */}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <label className="font-bold text-slate-700">Default Payment Mode</label>
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <select
              value={defaultPaymentMode}
              onChange={(e) => setDefaultPaymentMode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="N/A">N/A</option>
              <option value="IMPS">IMPS</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          {/* Set / alter statutory information? */}
          <div className="flex items-center justify-between py-1">
            <span className="font-bold text-slate-700">Set / alter statutory information?</span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="statutory"
                  checked={statutoryInfo === true}
                  onChange={() => setStatutoryInfo(true)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="statutory"
                  checked={statutoryInfo === false}
                  onChange={() => setStatutoryInfo(false)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {/* Mailing Details Section */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Mailing Details</h3>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Address 1 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Floor No., Building Name"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Address 2</label>
              <input
                type="text"
                placeholder="Near by Location, Landmark, Sub-district"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                >
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="UAE">UAE</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pincode</label>
                <input
                  type="text"
                  placeholder="39XX01"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">City</label>
                <input
                  type="text"
                  placeholder="e.g. Patna / Mohali"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  State <span className="text-rose-500">*</span>
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Provide bank details? & Enable credit limit? */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Provide bank details?</span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bank"
                    checked={provideBankDetails === true}
                    onChange={() => setProvideBankDetails(true)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bank"
                    checked={provideBankDetails === false}
                    onChange={() => setProvideBankDetails(false)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-700">Enable credit limit?</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="credit"
                    checked={enableCreditLimit === true}
                    onChange={() => setEnableCreditLimit(true)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="credit"
                    checked={enableCreditLimit === false}
                    onChange={() => setEnableCreditLimit(false)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>

          {/* Opening Balance */}
          <div className="pt-2 border-t border-slate-100">
            <label className="font-bold text-slate-700 block mb-1">Opening Balance</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-slate-500 font-bold">₹</span>
                <input
                  type="text"
                  placeholder="0.00"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
              <select
                value={balanceType}
                onChange={(e) => setBalanceType(e.target.value as any)}
                className="w-20 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value="Cr">Cr</option>
                <option value="Dr">Dr</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shortcuts Footer & Action Buttons matching Screenshot 5 */}
        <div className="border-t border-slate-200 bg-slate-50 p-3 px-6 space-y-3">
          <div className="text-[10px] text-slate-500 font-semibold tracking-wide flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-bold text-slate-700 uppercase">Shortcuts:</span>
              <span><kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded text-[9px] font-mono">CTRL + ALT + S</kbd> Save</span>
              <span><kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded text-[9px] font-mono">CTRL + ALT + C</kbd> Cancel</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <span>↔ Left/Right Arrow</span>
              <HelpCircle className="w-3 h-3" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 text-xs font-bold transition-all shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all shadow-md shadow-blue-600/20"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
