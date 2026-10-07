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
  Globe,
  Info,
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

interface CountryData {
  name: string;
  flag: string;
  dialCode: string;
  currency: string;
  currencySymbol: string;
  taxLabel: string;
  taxPlaceholder: string;
  postalLabel: string;
  postalPlaceholder: string;
  provinces?: string[];
}

const COUNTRIES_DATA: Record<string, CountryData> = {
  Canada: {
    name: 'Canada',
    flag: '🇨🇦',
    dialCode: '+1',
    currency: 'CAD',
    currencySymbol: '$',
    taxLabel: 'Business No. / CRA BN (9-digit) / GST',
    taxPlaceholder: 'e.g. 123456789 RT0001',
    postalLabel: 'Postal Code',
    postalPlaceholder: 'e.g. K1A 0B1 or M5V 2T6',
    provinces: [
      'Ontario',
      'British Columbia',
      'Alberta',
      'Quebec',
      'Manitoba',
      'Saskatchewan',
      'Nova Scotia',
      'New Brunswick',
      'Newfoundland and Labrador',
      'Prince Edward Island',
      'Northwest Territories',
      'Yukon',
      'Nunavut',
    ],
  },
  'United States': {
    name: 'United States',
    flag: '🇺🇸',
    dialCode: '+1',
    currency: 'USD',
    currencySymbol: '$',
    taxLabel: 'EIN / Federal Tax ID / SSN',
    taxPlaceholder: 'e.g. 12-3456789',
    postalLabel: 'Zip Code',
    postalPlaceholder: 'e.g. 90210, 10001',
    provinces: [
      'California',
      'New York',
      'Texas',
      'Florida',
      'Washington',
      'Illinois',
      'Pennsylvania',
      'Ohio',
      'Georgia',
      'North Carolina',
      'Michigan',
      'New Jersey',
      'Virginia',
      'Massachusetts',
      'Arizona',
      'Colorado',
      'Nevada',
      'Oregon',
      'Other US State',
    ],
  },
  'United Kingdom': {
    name: 'United Kingdom',
    flag: '🇬🇧',
    dialCode: '+44',
    currency: 'GBP',
    currencySymbol: '£',
    taxLabel: 'VAT Reg No. / Company No.',
    taxPlaceholder: 'e.g. GB 123 4567 89',
    postalLabel: 'Postcode',
    postalPlaceholder: 'e.g. SW1A 1AA, EC1A 1BB',
    provinces: ['England', 'Scotland', 'Wales', 'Northern Ireland', 'Greater London'],
  },
  Australia: {
    name: 'Australia',
    flag: '🇦🇺',
    dialCode: '+61',
    currency: 'AUD',
    currencySymbol: '$',
    taxLabel: 'ABN / ACN (Australian Business Number)',
    taxPlaceholder: 'e.g. 12 345 678 901',
    postalLabel: 'Postal Code',
    postalPlaceholder: 'e.g. 2000, 3000',
    provinces: [
      'New South Wales',
      'Victoria',
      'Queensland',
      'Western Australia',
      'South Australia',
      'Tasmania',
      'Australian Capital Territory',
      'Northern Territory',
    ],
  },
  UAE: {
    name: 'UAE',
    flag: '🇦🇪',
    dialCode: '+971',
    currency: 'AED',
    currencySymbol: 'AED',
    taxLabel: 'TRN (Tax Registration Number - 15 digit)',
    taxPlaceholder: 'e.g. 100XXXXXXXX0003',
    postalLabel: 'Postal / Makani / PO Box',
    postalPlaceholder: 'e.g. 00000 / PO Box 12345',
    provinces: [
      'Dubai',
      'Abu Dhabi',
      'Sharjah',
      'Ajman',
      'Ras Al Khaimah',
      'Fujairah',
      'Umm Al Quwain',
    ],
  },
  Germany: {
    name: 'Germany',
    flag: '🇩🇪',
    dialCode: '+49',
    currency: 'EUR',
    currencySymbol: '€',
    taxLabel: 'USt-IdNr. / Steuernummer',
    taxPlaceholder: 'e.g. DE 123456789',
    postalLabel: 'PLZ (Postleitzahl)',
    postalPlaceholder: 'e.g. 10115',
    provinces: ['Bavaria', 'Berlin', 'Baden-Württemberg', 'North Rhine-Westphalia', 'Hesse', 'Hamburg', 'Saxony'],
  },
  France: {
    name: 'France',
    flag: '🇫🇷',
    dialCode: '+33',
    currency: 'EUR',
    currencySymbol: '€',
    taxLabel: 'Numéro TVA / SIRET',
    taxPlaceholder: 'e.g. FR 12 345678901',
    postalLabel: 'Code Postal',
    postalPlaceholder: 'e.g. 75001',
    provinces: ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Provence-Alpes-Côte d\'Azur', 'Occitanie', 'Nouvelle-Aquitaine'],
  },
  Singapore: {
    name: 'Singapore',
    flag: '🇸🇬',
    dialCode: '+65',
    currency: 'SGD',
    currencySymbol: '$',
    taxLabel: 'UEN / GST Registration No.',
    taxPlaceholder: 'e.g. 201912345A',
    postalLabel: 'Postal Code',
    postalPlaceholder: 'e.g. 018956',
    provinces: ['Central Region', 'East Region', 'North Region', 'North-East Region', 'West Region'],
  },
  Netherlands: {
    name: 'Netherlands',
    flag: '🇳🇱',
    dialCode: '+31',
    currency: 'EUR',
    currencySymbol: '€',
    taxLabel: 'BTW-identificatienummer / KVK',
    taxPlaceholder: 'e.g. NL 123456789 B01',
    postalLabel: 'Postcode',
    postalPlaceholder: 'e.g. 1012 AB',
    provinces: ['North Holland', 'South Holland', 'Utrecht', 'North Brabant', 'Gelderland'],
  },
  Ireland: {
    name: 'Ireland',
    flag: '🇮🇪',
    dialCode: '+353',
    currency: 'EUR',
    currencySymbol: '€',
    taxLabel: 'VAT / Tax Registration No.',
    taxPlaceholder: 'e.g. IE 1234567T',
    postalLabel: 'Eircode',
    postalPlaceholder: 'e.g. D02 X285',
    provinces: ['Dublin', 'Leinster', 'Munster', 'Connacht', 'Ulster'],
  },
  'New Zealand': {
    name: 'New Zealand',
    flag: '🇳🇿',
    dialCode: '+64',
    currency: 'NZD',
    currencySymbol: '$',
    taxLabel: 'NZBN / GST Number',
    taxPlaceholder: 'e.g. 9429000000000',
    postalLabel: 'Postcode',
    postalPlaceholder: 'e.g. 1010',
    provinces: ['Auckland', 'Wellington', 'Canterbury', 'Waikato', 'Bay of Plenty', 'Otago'],
  },
  Switzerland: {
    name: 'Switzerland',
    flag: '🇨🇭',
    dialCode: '+41',
    currency: 'CHF',
    currencySymbol: 'CHF',
    taxLabel: 'UID / MWST No.',
    taxPlaceholder: 'e.g. CHE-123.456.789 MWST',
    postalLabel: 'PLZ',
    postalPlaceholder: 'e.g. 8001',
    provinces: ['Zurich', 'Geneva', 'Vaud', 'Bern', 'Basel-Stadt'],
  },
  'Saudi Arabia': {
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    dialCode: '+966',
    currency: 'SAR',
    currencySymbol: 'SAR',
    taxLabel: 'VAT Identification Number (15-digit)',
    taxPlaceholder: 'e.g. 300XXXXXXXX0003',
    postalLabel: 'Postal Code',
    postalPlaceholder: 'e.g. 11564',
    provinces: ['Riyadh', 'Makkah', 'Eastern Province', 'Madinah', 'Asir'],
  },
  Qatar: {
    name: 'Qatar',
    flag: '🇶🇦',
    dialCode: '+974',
    currency: 'QAR',
    currencySymbol: 'QAR',
    taxLabel: 'TIN / Tax Identification No.',
    taxPlaceholder: 'e.g. 12345678',
    postalLabel: 'Zone / PO Box',
    postalPlaceholder: 'e.g. 12345',
    provinces: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor'],
  },
  'South Africa': {
    name: 'South Africa',
    flag: '🇿🇦',
    dialCode: '+27',
    currency: 'ZAR',
    currencySymbol: 'R',
    taxLabel: 'VAT / Tax Reference No.',
    taxPlaceholder: 'e.g. 4012345678',
    postalLabel: 'Postal Code',
    postalPlaceholder: 'e.g. 2001',
    provinces: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape'],
  },
  Japan: {
    name: 'Japan',
    flag: '🇯🇵',
    dialCode: '+81',
    currency: 'JPY',
    currencySymbol: '¥',
    taxLabel: 'Corporate Number (Houjin Bangou)',
    taxPlaceholder: 'e.g. 1234567890123',
    postalLabel: 'Postal Code',
    postalPlaceholder: 'e.g. 100-0001',
    provinces: ['Tokyo', 'Osaka', 'Kanagawa', 'Aichi', 'Kyoto'],
  },
  Malaysia: {
    name: 'Malaysia',
    flag: '🇲🇾',
    dialCode: '+60',
    currency: 'MYR',
    currencySymbol: 'RM',
    taxLabel: 'SST / Business Reg No. (BRN)',
    taxPlaceholder: 'e.g. W10-1808-32000018',
    postalLabel: 'Postcode',
    postalPlaceholder: 'e.g. 50450',
    provinces: ['Kuala Lumpur', 'Selangor', 'Penang', 'Johor'],
  },
  Spain: {
    name: 'Spain',
    flag: '🇪🇸',
    dialCode: '+34',
    currency: 'EUR',
    currencySymbol: '€',
    taxLabel: 'NIF / CIF / NIE',
    taxPlaceholder: 'e.g. B12345678',
    postalLabel: 'Código Postal',
    postalPlaceholder: 'e.g. 28001',
    provinces: ['Madrid', 'Catalonia', 'Andalusia', 'Valencia'],
  },
  Italy: {
    name: 'Italy',
    flag: '🇮🇹',
    dialCode: '+39',
    currency: 'EUR',
    currencySymbol: '€',
    taxLabel: 'Partita IVA (Codice Fiscale)',
    taxPlaceholder: 'e.g. IT 12345678901',
    postalLabel: 'CAP',
    postalPlaceholder: 'e.g. 00187',
    provinces: ['Lombardy', 'Lazio', 'Veneto', 'Emilia-Romagna'],
  },
  Brazil: {
    name: 'Brazil',
    flag: '🇧🇷',
    dialCode: '+55',
    currency: 'BRL',
    currencySymbol: 'R$',
    taxLabel: 'CNPJ / CPF',
    taxPlaceholder: 'e.g. 12.345.678/0001-90',
    postalLabel: 'CEP',
    postalPlaceholder: 'e.g. 01310-100',
    provinces: ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Paraná'],
  },
  Mexico: {
    name: 'Mexico',
    flag: '🇲🇽',
    dialCode: '+52',
    currency: 'MXN',
    currencySymbol: '$',
    taxLabel: 'RFC (Registro Federal de Contribuyentes)',
    taxPlaceholder: 'e.g. ABC123456T12',
    postalLabel: 'Código Postal',
    postalPlaceholder: 'e.g. 06600',
    provinces: ['Ciudad de México', 'Jalisco', 'Nuevo León', 'Puebla'],
  },
  'Other Foreign Country': {
    name: 'Other Foreign Country',
    flag: '🌐',
    dialCode: '+1',
    currency: 'USD',
    currencySymbol: '$',
    taxLabel: 'Foreign Tax ID / Corporate Registration No.',
    taxPlaceholder: 'e.g. National Tax / Business Registration ID',
    postalLabel: 'Postal / Zip Code',
    postalPlaceholder: 'Postal / Zip Code',
  },
  India: {
    name: 'India',
    flag: '🇮🇳',
    dialCode: '+91',
    currency: 'INR',
    currencySymbol: '₹',
    taxLabel: 'PAN/IT/TAN No.',
    taxPlaceholder: 'BJXXXXXX1H',
    postalLabel: 'Pincode',
    postalPlaceholder: '39XX01',
    provinces: INDIAN_STATES,
  },
};

const DIAL_CODES = [
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'US', name: 'USA', dial: '+1', dialLabel: '+1 (US)', flag: '🇺🇸' },
  { code: 'GB', name: 'UK', dial: '+44', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'AE', name: 'UAE', dial: '+971', flag: '🇦🇪' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { code: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪' },
  { code: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
  { code: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { code: 'QA', name: 'Qatar', dial: '+974', flag: '🇶🇦' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
];

const CURRENCIES = [
  { code: 'CAD', symbol: '$', label: '🇨🇦 CAD ($) - Canadian Dollar' },
  { code: 'USD', symbol: '$', label: '🇺🇸 USD ($) - US Dollar' },
  { code: 'GBP', symbol: '£', label: '🇬🇧 GBP (£) - British Pound' },
  { code: 'EUR', symbol: '€', label: '🇪🇺 EUR (€) - Euro' },
  { code: 'AUD', symbol: '$', label: '🇦🇺 AUD ($) - Australian Dollar' },
  { code: 'AED', symbol: 'AED', label: '🇦🇪 AED (AED) - UAE Dirham' },
  { code: 'SGD', symbol: '$', label: '🇸🇬 SGD ($) - Singapore Dollar' },
  { code: 'NZD', symbol: '$', label: '🇳🇿 NZD ($) - New Zealand Dollar' },
  { code: 'CHF', symbol: 'CHF', label: '🇨🇭 CHF (CHF) - Swiss Franc' },
  { code: 'SAR', symbol: 'SAR', label: '🇸🇦 SAR (SAR) - Saudi Riyal' },
  { code: 'INR', symbol: '₹', label: '🇮🇳 INR (₹) - Indian Rupee' },
];

export function NewCustomerDrawer({
  isOpen,
  onClose,
  onSave,
  initialData,
}: NewCustomerDrawerProps) {
  // Foreign vs Domestic mode
  const [isForeign, setIsForeign] = useState(false);

  // Core fields
  const [registrationType, setRegistrationType] = useState('Unregistered (Without GST)');
  const [partyType, setPartyType] = useState('Not Applicable');
  const [legalName, setLegalName] = useState('');
  const [accountDisplayName, setAccountDisplayName] = useState('');
  const [shortAliasName, setShortAliasName] = useState('');
  const [email, setEmail] = useState('');
  const [dialCode, setDialCode] = useState('+91');
  const [mobileNo, setMobileNo] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [panItTanNo, setPanItTanNo] = useState('');
  const [creditPeriodDays, setCreditPeriodDays] = useState('');
  const [defaultPaymentMode, setDefaultPaymentMode] = useState('N/A');
  const [statutoryInfo, setStatutoryInfo] = useState(false);

  // Currency & International features
  const [currency, setCurrency] = useState('INR');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [exportType, setExportType] = useState('EXPORT_UNDER_LUT');
  const [lutNumber, setLutNumber] = useState('');

  // Mailing Details
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [country, setCountry] = useState('India');
  const [customCountryName, setCustomCountryName] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('BIHAR');
  const [customProvinceName, setCustomProvinceName] = useState('');

  // Additional options
  const [provideBankDetails, setProvideBankDetails] = useState(false);
  const [enableCreditLimit, setEnableCreditLimit] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('0.00');
  const [balanceType, setBalanceType] = useState<'Cr' | 'Dr'>('Cr');

  // Country config reference
  const currentCountryConfig = COUNTRIES_DATA[country] || COUNTRIES_DATA['India'];

  // Switch between Domestic and Foreign mode
  const handleToggleForeign = (foreign: boolean) => {
    setIsForeign(foreign);
    if (foreign) {
      // If switching to Foreign and currently on India, default to Canada
      const newCountry = country === 'India' ? 'Canada' : country;
      setCountry(newCountry);
      const conf = COUNTRIES_DATA[newCountry] || COUNTRIES_DATA['Canada'];
      setDialCode(conf.dialCode);
      setCurrency(conf.currency);
      setCurrencySymbol(conf.currencySymbol);
      setRegistrationType('Overseas / Export (Zero-rated LUT)');
      if (conf.provinces && conf.provinces.length > 0) {
        setState(conf.provinces[0]);
      } else {
        setState('');
      }
    } else {
      // Switching back to Domestic (India)
      setCountry('India');
      setDialCode('+91');
      setCurrency('INR');
      setCurrencySymbol('₹');
      setRegistrationType('Unregistered (Without GST)');
      setState('BIHAR');
    }
  };

  // Country changed handler
  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    const conf = COUNTRIES_DATA[newCountry] || COUNTRIES_DATA['Other Foreign Country'];
    if (newCountry === 'India') {
      setIsForeign(false);
      setDialCode('+91');
      setCurrency('INR');
      setCurrencySymbol('₹');
      setRegistrationType('Unregistered (Without GST)');
      setState('BIHAR');
    } else {
      setIsForeign(true);
      setDialCode(conf.dialCode);
      setCurrency(conf.currency);
      setCurrencySymbol(conf.currencySymbol);
      if (registrationType === 'Unregistered (Without GST)' || registrationType === 'Registered Regular') {
        setRegistrationType('Overseas / Export (Zero-rated LUT)');
      }
      if (conf.provinces && conf.provinces.length > 0) {
        setState(conf.provinces[0]);
      } else {
        setState('');
      }
    }
  };

  // Currency changed handler
  const handleCurrencyChange = (newCurr: string) => {
    setCurrency(newCurr);
    const matched = CURRENCIES.find((c) => c.code === newCurr);
    setCurrencySymbol(matched?.symbol || '$');
  };

  // Populate initial data when opened
  useEffect(() => {
    if (initialData) {
      const foreignDetected = Boolean(
        initialData.isForeign ||
        (initialData.country && initialData.country !== 'India') ||
        initialData.registrationType?.includes('Overseas') ||
        initialData.registrationType?.includes('Export') ||
        (initialData.currency && initialData.currency !== 'INR') ||
        (initialData.accountDisplayName && /canada|usa|us|uk|dubai|uae|australia|germany/i.test(initialData.accountDisplayName))
      );
      setIsForeign(foreignDetected);

      const targetCountry = initialData.country || (foreignDetected ? 'Canada' : 'India');
      setCountry(targetCountry);

      const cData = COUNTRIES_DATA[targetCountry] || (foreignDetected ? COUNTRIES_DATA['Canada'] : COUNTRIES_DATA['India']);
      setDialCode(initialData.dialCode || cData.dialCode || (foreignDetected ? '+1' : '+91'));
      
      const targetCurrency = initialData.currency || cData.currency || (foreignDetected ? 'CAD' : 'INR');
      setCurrency(targetCurrency);
      const currMatch = CURRENCIES.find((c) => c.code === targetCurrency);
      setCurrencySymbol(initialData.currencySymbol || currMatch?.symbol || (foreignDetected ? '$' : '₹'));

      if (initialData.registrationType) setRegistrationType(initialData.registrationType);
      else if (foreignDetected) setRegistrationType('Overseas / Export (Zero-rated LUT)');

      if (initialData.partyType) setPartyType(initialData.partyType);
      if (initialData.legalName) setLegalName(initialData.legalName);
      if (initialData.accountDisplayName) setAccountDisplayName(initialData.accountDisplayName);
      if (initialData.shortAliasName) setShortAliasName(initialData.shortAliasName);
      if (initialData.email) setEmail(initialData.email);
      if (initialData.mobileNo) setMobileNo(initialData.mobileNo);
      if (initialData.contactPersonName) setContactPersonName(initialData.contactPersonName);
      if (initialData.panItTanNo || initialData.foreignTaxId) {
        setPanItTanNo(initialData.foreignTaxId || initialData.panItTanNo || '');
      }
      if (initialData.creditPeriodDays) setCreditPeriodDays(String(initialData.creditPeriodDays));
      if (initialData.defaultPaymentMode) setDefaultPaymentMode(initialData.defaultPaymentMode);
      if (initialData.addressLine1) setAddressLine1(initialData.addressLine1);
      if (initialData.addressLine2) setAddressLine2(initialData.addressLine2);
      if (initialData.pincode) setPincode(initialData.pincode);
      if (initialData.city) setCity(initialData.city);
      if (initialData.state) setState(initialData.state);
      else if (foreignDetected && cData.provinces?.[0]) setState(cData.provinces[0]);
      if (initialData.openingBalance !== undefined) setOpeningBalance(String(initialData.openingBalance));
      if (initialData.balanceType) setBalanceType(initialData.balanceType);
      if (initialData.exportType) setExportType(initialData.exportType);
      if (initialData.lutNumber) setLutNumber(initialData.lutNumber);
      if (initialData.statutoryInfo !== undefined) setStatutoryInfo(initialData.statutoryInfo);
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
  }, [isOpen, accountDisplayName, legalName, email, mobileNo, addressLine1, city, state, country, isForeign, currency]);

  if (!isOpen) return null;

  const handleSave = () => {
    const finalName = accountDisplayName.trim() || legalName.trim() || 'New Customer';
    const effectiveCountry = country === 'Other Foreign Country' ? (customCountryName.trim() || 'Foreign') : country;
    const effectiveState = state === '__custom__' ? (customProvinceName.trim() || '') : state;
    const finalOpeningBal = parseFloat(openingBalance) || 0;

    const customerObj: SundryDebtorCustomer = {
      id: initialData?.id || `cust_${Date.now()}`,
      isForeign,
      currency,
      currencySymbol,
      dialCode,
      registrationType,
      partyType,
      legalName: legalName.trim() || finalName,
      accountDisplayName: finalName,
      shortAliasName: shortAliasName.trim(),
      email: email.trim(),
      mobileNo: mobileNo.trim(),
      contactPersonName: contactPersonName.trim(),
      panItTanNo: panItTanNo.trim(),
      foreignTaxId: isForeign ? panItTanNo.trim() : undefined,
      creditPeriodDays: creditPeriodDays ? Number(creditPeriodDays) : undefined,
      defaultPaymentMode,
      statutoryInfo,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      country: effectiveCountry,
      pincode: pincode.trim(),
      city: city.trim(),
      state: effectiveState,
      province: isForeign ? effectiveState : undefined,
      bankDetailsProvided: provideBankDetails,
      enableCreditLimit,
      openingBalance: finalOpeningBal,
      balanceType,
      balanceFormatted: `${currencySymbol}${finalOpeningBal.toFixed(2)} ${balanceType}${isForeign ? ` (${currency})` : ''}`,
      gstin: !isForeign && panItTanNo.trim().length === 15 ? panItTanNo.trim() : undefined,
      exportType: isForeign ? exportType : undefined,
      lutNumber: isForeign ? lutNumber.trim() : undefined,
    };

    onSave(customerObj);
    onClose();
  };

  const provinceList = currentCountryConfig?.provinces;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
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
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <span>New Customer (Sundry Debtors)</span>
                {isForeign && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-blue-600" />
                    Foreign Client
                  </span>
                )}
              </h2>
            </div>
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
          {/* CLIENT TYPE SELECTOR: DOMESTIC VS FOREIGN */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
              <span>Customer / Client Type</span>
              <span className="text-[10px] font-normal text-slate-500">
                {isForeign ? 'Cross-border / Export (0% GST / LUT)' : 'Domestic / Indian Tax Invoicing'}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleToggleForeign(false)}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  !isForeign
                    ? 'bg-white text-slate-800 shadow-xs border border-slate-200/80 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className="text-sm">🇮🇳</span>
                <span>Domestic Client (India)</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleForeign(true)}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  isForeign
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-extrabold'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                <span className="text-sm">🌐</span>
                <span>Foreign / Overseas Client</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                    isForeign ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  Export
                </span>
              </button>
            </div>
          </div>

          {/* Foreign Mode Info Alert Banner */}
          {isForeign && (
            <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5 animate-fade-in">
              <Globe className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-relaxed text-blue-900">
                <div className="font-bold flex items-center gap-1.5">
                  <span>Foreign / Export Client Mode Active</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                    {country} ({currency})
                  </span>
                </div>
                <p className="text-blue-700 mt-0.5 text-[11px]">
                  Configured for international clients. Supports foreign tax IDs (CRA BN, EIN, VAT, TRN),
                  overseas dialing codes, provincial regions, and multi-currency billing.
                </p>
              </div>
            </div>
          )}

          {/* Registration Type */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Registration Type</label>
            <select
              value={registrationType}
              onChange={(e) => {
                setRegistrationType(e.target.value);
                if (e.target.value.includes('Overseas') || e.target.value.includes('Export')) {
                  if (!isForeign) handleToggleForeign(true);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              {isForeign ? (
                <>
                  <option value="Overseas / Export (Zero-rated LUT)">
                    Overseas / Export (Zero-rated under LUT - 0% GST)
                  </option>
                  <option value="Overseas / Export (With IGST)">
                    Overseas / Export (With payment of IGST)
                  </option>
                  <option value="Foreign Business / Corporation">
                    Foreign Business / Corporation
                  </option>
                  <option value="Foreign Individual / Consumer">
                    Foreign Individual / Contractor
                  </option>
                  <option value="SEZ Unit / Developer">SEZ Unit / Developer</option>
                  <option value="Unregistered (Without GST)">Unregistered (Without GST)</option>
                </>
              ) : (
                <>
                  <option value="Unregistered (Without GST)">Unregistered (Without GST)</option>
                  <option value="Registered Regular">Registered Regular (With GST)</option>
                  <option value="Composition Scheme">Composition Scheme</option>
                  <option value="Consumer">Consumer</option>
                  <option value="Overseas / Export">Overseas / Export</option>
                </>
              )}
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
                {isForeign ? (
                  <>
                    <option value="Foreign Corporation / Inc.">Foreign Corporation / Inc.</option>
                    <option value="LLC / Ltd.">LLC / Ltd.</option>
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Individual / Freelancer">Individual / Freelancer</option>
                  </>
                ) : (
                  <>
                    <option value="Proprietorship">Proprietorship</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Private Limited">Private Limited</option>
                    <option value="Public Limited">Public Limited</option>
                    <option value="LLP">LLP</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="font-bold text-slate-700">Legal Name</label>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder={isForeign ? 'e.g. AVS Canada Inc.' : 'Barry Tone'}
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
                placeholder={isForeign ? 'e.g. AVS Canada' : 'Barry Tone'}
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

          {/* Email & Mobile with Selectable Dial Code */}
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
                <select
                  value={dialCode}
                  onChange={(e) => setDialCode(e.target.value)}
                  className="px-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-xs font-bold text-slate-700 focus:outline-none focus:bg-white max-w-[92px]"
                >
                  {DIAL_CODES.map((dc) => (
                    <option key={dc.code + dc.dial} value={dc.dial}>
                      {dc.flag} {dc.dial}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder={isForeign ? '416-555-0199' : '9876543210'}
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

          {/* PAN/IT/TAN No. or Foreign Tax ID & Default Credit Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span>{isForeign ? currentCountryConfig?.taxLabel || 'Foreign Tax ID / Business No.' : 'PAN/IT/TAN No.'}</span>
              </label>
              <input
                type="text"
                placeholder={isForeign ? currentCountryConfig?.taxPlaceholder || 'e.g. 123456789 RT0001 (Canada BN)' : 'BJXXXXXX1H'}
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

          {/* Currency (Special for Foreign Clients) & Default Payment Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Billing Currency {isForeign && <span className="text-blue-600 font-extrabold">*</span>}
              </label>
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.label}
                  </option>
                ))}
              </select>
            </div>

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
                {isForeign && (
                  <>
                    <option value="Wire / SWIFT">International Wire / SWIFT</option>
                    <option value="Stripe / Credit Card">Stripe / Credit Card</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Wise / OFX">Wise / Cross-Border Transfer</option>
                  </>
                )}
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="IMPS">IMPS</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          {/* Set / alter statutory information? */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between py-1">
              <span className="font-bold text-slate-700">
                {isForeign ? 'Set export statutory / LUT information?' : 'Set / alter statutory information?'}
              </span>
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

            {/* Collapsible statutory detail inputs */}
            {statutoryInfo && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 animate-fade-in">
                {isForeign ? (
                  <>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Export Scheme under GST
                      </label>
                      <select
                        value={exportType}
                        onChange={(e) => setExportType(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
                      >
                        <option value="EXPORT_UNDER_LUT">
                          Export under Letter of Undertaking (LUT / Bond) - 0% Tax
                        </option>
                        <option value="EXPORT_WITH_IGST">
                          Export with payment of Integrated Tax (IGST)
                        </option>
                        <option value="SEZ">Special Economic Zone (SEZ Supply)</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        LUT / Bond Reference ARN (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. AD240324000123P"
                        value={lutNumber}
                        onChange={(e) => setLutNumber(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      GSTIN / UIN Registration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 24AAAAA0000A1Z5"
                      value={panItTanNo}
                      onChange={(e) => setPanItTanNo(e.target.value.toUpperCase())}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mailing Details Section */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Mailing Details</span>
              {isForeign && (
                <span className="text-[10px] text-blue-600 font-semibold lowercase">
                  international shipping & billing
                </span>
              )}
            </h3>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Address 1 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder={isForeign ? 'Suite / Street address, Building Name' : 'Floor No., Building Name'}
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Address 2</label>
              <input
                type="text"
                placeholder={isForeign ? 'District, Landmark, Area' : 'Near by Location, Landmark, Sub-district'}
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
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                >
                  <optgroup label="Frequently Selected">
                    <option value="India">🇮🇳 India</option>
                    <option value="Canada">🇨🇦 Canada</option>
                    <option value="United States">🇺🇸 United States</option>
                    <option value="United Kingdom">🇬🇧 United Kingdom</option>
                    <option value="Australia">🇦🇺 Australia</option>
                    <option value="UAE">🇦🇪 UAE</option>
                  </optgroup>
                  <optgroup label="International Countries">
                    <option value="Germany">🇩🇪 Germany</option>
                    <option value="France">🇫🇷 France</option>
                    <option value="Singapore">🇸🇬 Singapore</option>
                    <option value="Netherlands">🇳🇱 Netherlands</option>
                    <option value="Ireland">🇮🇪 Ireland</option>
                    <option value="New Zealand">🇳🇿 New Zealand</option>
                    <option value="Switzerland">🇨🇭 Switzerland</option>
                    <option value="Saudi Arabia">🇸🇦 Saudi Arabia</option>
                    <option value="Qatar">🇶🇦 Qatar</option>
                    <option value="South Africa">🇿🇦 South Africa</option>
                    <option value="Japan">🇯🇵 Japan</option>
                    <option value="Malaysia">🇲🇾 Malaysia</option>
                    <option value="Spain">🇪🇸 Spain</option>
                    <option value="Italy">🇮🇹 Italy</option>
                    <option value="Brazil">🇧🇷 Brazil</option>
                    <option value="Mexico">🇲🇽 Mexico</option>
                    <option value="Other Foreign Country">🌐 Other Foreign Country</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isForeign ? currentCountryConfig?.postalLabel || 'Postal / Zip Code' : 'Pincode'}
                </label>
                <input
                  type="text"
                  placeholder={isForeign ? currentCountryConfig?.postalPlaceholder || 'e.g. K1A 0B1 or 90210' : '39XX01'}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none uppercase"
                />
              </div>
            </div>

            {/* Custom country name input if 'Other Foreign Country' selected */}
            {country === 'Other Foreign Country' && (
              <div className="animate-fade-in">
                <label className="font-bold text-slate-700 block mb-1">Specify Country Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sweden / Norway / Poland"
                  value={customCountryName}
                  onChange={(e) => setCustomCountryName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">City</label>
                <input
                  type="text"
                  placeholder={isForeign ? (country === 'Canada' ? 'Toronto / Vancouver' : 'e.g. New York / London') : 'e.g. Patna / Mohali'}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isForeign ? 'State / Province / Region' : 'State'} <span className="text-rose-500">*</span>
                </label>

                {provinceList && provinceList.length > 0 ? (
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                  >
                    {provinceList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                    <option value="__custom__">+ Other / Custom Region</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Ontario / California / London"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                )}
              </div>
            </div>

            {/* Custom Province input if selected */}
            {state === '__custom__' && (
              <div className="animate-fade-in">
                <label className="font-bold text-slate-700 block mb-1">Custom Province / Region Name</label>
                <input
                  type="text"
                  placeholder="Enter Province / State Name"
                  value={customProvinceName}
                  onChange={(e) => setCustomProvinceName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            )}
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

          {/* Opening Balance with dynamic currency */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">Opening Balance</label>
              <span className="text-[10px] text-slate-500 font-semibold">
                Currency: <span className="text-blue-700 font-extrabold">{currency} ({currencySymbol})</span>
              </span>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-slate-500 font-bold">
                  {currencySymbol}
                </span>
                <input
                  type="text"
                  placeholder="0.00"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
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

        {/* Shortcuts Footer & Action Buttons matching Screenshot */}
        <div className="border-t border-slate-200 bg-slate-50 p-3 px-6 space-y-3">
          <div className="text-[10px] text-slate-500 font-semibold tracking-wide flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-bold text-slate-700 uppercase">Shortcuts:</span>
              <span>
                <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded text-[9px] font-mono">
                  CTRL + ALT + S
                </kbd>{' '}
                Save
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded text-[9px] font-mono">
                  CTRL + ALT + C
                </kbd>{' '}
                Cancel
              </span>
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
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Customer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
