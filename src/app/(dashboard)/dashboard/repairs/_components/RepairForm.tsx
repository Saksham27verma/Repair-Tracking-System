'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Paper,
  FormControlLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Checkbox,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Snackbar,
  CircularProgress,
  InputAdornment,
  Autocomplete,
  Divider,
  LinearProgress,
  Chip,
  Stack,
  IconButton,
  Stepper,
  Step,
  StepButton,
  StepLabel,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  MoveToInbox as MoveToInboxIcon,
  LocalShipping as LocalShippingIcon,
  AssignmentReturn as AssignmentReturnIcon,
  Storefront as StorefrontIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  CalendarToday as CalendarTodayIcon,
} from '@mui/icons-material';
import CenterSelect from '@/app/components/CenterSelect';
import StageTransitionFields from '@/app/components/StageTransitionFields';
import { getMovementForStatusChange } from '@/lib/tracking';
// Comment out problematic import and use direct imports from database.ts
// import { Database } from '@/app/types/supabase';
import { generateRepairId, supabase } from '@/lib/supabase';
import { useAlert } from '@/app/components/AlertProvider';
import { 
  EstimateStatus, 
  MouldType, 
  Ear, 
  RepairStatus, 
  WarrantyStatus,
  PaymentMode,
  CompanyType,
  HEARING_AID_MODELS,
  RepairRecord,
  Customer,
  WarrantyAfterRepair,
  ReceivingCenter,
  DeviceFormat,
} from '@/app/types/database';
import { inferDeviceFormat } from '@/lib/device-format';
import { calculateTaxFromInclusive, formatCurrency, GST_RATE_OPTIONS } from '@/lib/invoice-tax';
import { getCustomerVisitStatsByPhone, type CustomerVisitStats } from '@/lib/customer-visits';
import {
  getTransitionFieldsForStatus,
  validateRepairForStatus,
  validateTransitionFields,
  type TransitionFieldValues,
} from '@/lib/repair-stage-validation';
import Link from 'next/link';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { styled } from '@mui/material/styles';
import { nanoid } from 'nanoid';

dayjs.extend(utc);

const CustomTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.dark,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset': {
      borderColor: theme.palette.primary.dark,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

type EarType = Ear | null;

interface FormState {
  repair_id: string;
  status: RepairStatus;
  patient_name: string;
  phone: string;
  email: string;
  company: CompanyType | '';
  model_item_name: string;
  serial_no: string;
  serial_no_2: string;
  device_format: DeviceFormat;
  quantity: number;
  warranty: WarrantyStatus;
  purpose: string;
  hope_markup: number | null;
  customer_paid: number | null;
  payment_mode: PaymentMode | null;
  courier_expenses: number | null;
  programming_done: boolean;
  remarks: string;
  estimate_status: EstimateStatus;
  date_of_receipt?: string;
  date_out_to_manufacturer?: string | null;
  date_received_from_manufacturer?: string | null;
  date_out_to_customer?: string | null;
  created_at?: string;
  updated_at?: string;
  ear: EarType;
  mould: MouldType | '';
  warranty_after_repair: WarrantyAfterRepair | '';
  receiving_center: ReceivingCenter | '';
  receiving_center_id: string;
  pickup_center_id: string;
  manufacturer_invoice_number: string;
  manufacturer_invoice_date: string | null;
  manufacturer_invoice_total: number | null;
  manufacturer_invoice_gst_rate: number;
}

interface Props {
  repair?: RepairRecord;
  mode?: 'create' | 'edit';
  prefillCustomer?: Customer;
}

// Predefined repair purpose options
const repairPurposeOptions = [
  'Hearing aid is physically damaged',
  'Sound from the hearing aid is unclear or distorted',
  'Hearing aid is not connecting with external devices',
  'Ear hook is loose, broken, or needs replacement',
  'General maintenance or servicing is required',
  'Hearing aid is not charging properly',
  'Hearing aid turns off automatically',
  'Hearing aid is not turning on',
  'Reshelling of Machine',
  'Other (please specify)'
];

const initialFormData: FormState = {
  repair_id: '',
  status: 'Received',
  patient_name: '',
  phone: '',
  email: '',
  company: '',
  model_item_name: '',
  serial_no: '',
  serial_no_2: '',
  device_format: 'piece',
  quantity: 1,
  warranty: 'Out of warranty',
  purpose: '',
  hope_markup: null,
  customer_paid: null,
  payment_mode: null,
  courier_expenses: null,
  programming_done: false,
  remarks: '',
  estimate_status: 'Not Required',
  ear: null,
  mould: '',
  warranty_after_repair: '',
  receiving_center: '',
  receiving_center_id: '',
  pickup_center_id: '',
  manufacturer_invoice_number: '',
  manufacturer_invoice_date: null,
  manufacturer_invoice_total: null,
  manufacturer_invoice_gst_rate: 18,
};

const FORM_SECTIONS = [
  { title: 'Customer', subtitle: 'Patient contact details' },
  { title: 'Device & Repair', subtitle: 'Device information and repair purpose' },
  { title: 'Center Tracking', subtitle: 'Where the device was received' },
  { title: 'Financial', subtitle: 'Invoices, markup, and payment' },
  { title: 'Notes', subtitle: 'Programming status and remarks' },
] as const;

const STATUS_STEPS: {
  status: RepairStatus;
  label: string;
  description: string;
  dateField: keyof FormState | null;
  dateLabel: string | null;
  relevantSections: string[];
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}[] = [
  {
    status: 'Received',
    label: 'Received',
    description: 'Device received from the customer and logged.',
    dateField: 'date_of_receipt',
    dateLabel: 'Date Received',
    relevantSections: ['Customer', 'Device & Repair', 'Center Tracking'],
    icon: <MoveToInboxIcon />,
    color: '#1565C0',
    bgColor: '#E3F2FD',
  },
  {
    status: 'Sent to Company for Repair',
    label: 'Sent to Company',
    description: 'Device dispatched to the manufacturer for repair.',
    dateField: 'date_out_to_manufacturer',
    dateLabel: 'Date Sent',
    relevantSections: ['Center Tracking', 'Financial'],
    icon: <LocalShippingIcon />,
    color: '#E65100',
    bgColor: '#FFF3E0',
  },
  {
    status: 'Returned from Manufacturer',
    label: 'Returned',
    description: 'Device returned from the manufacturer. Enter invoice details.',
    dateField: 'date_received_from_manufacturer',
    dateLabel: 'Date Returned',
    relevantSections: ['Financial'],
    icon: <AssignmentReturnIcon />,
    color: '#6A1B9A',
    bgColor: '#F3E5F5',
  },
  {
    status: 'Ready for Pickup',
    label: 'Ready for Pickup',
    description: 'Device is ready. Notify the customer and set pickup center.',
    dateField: null,
    dateLabel: null,
    relevantSections: ['Center Tracking', 'Financial'],
    icon: <StorefrontIcon />,
    color: '#2E7D32',
    bgColor: '#E8F5E9',
  },
  {
    status: 'Completed',
    label: 'Completed',
    description: 'Device handed back to the customer. Confirm payment.',
    dateField: 'date_out_to_customer',
    dateLabel: 'Date Completed',
    relevantSections: ['Financial', 'Notes'],
    icon: <CheckCircleIcon />,
    color: '#1B5E20',
    bgColor: '#F1F8E9',
  },
];

function getStatusIndex(status: RepairStatus): number {
  return STATUS_STEPS.findIndex((s) => s.status === status);
}

function isCustomerSectionValid(formData: FormState): boolean {
  return Boolean(formData.patient_name?.trim()) && (formData.phone?.trim().length ?? 0) >= 10;
}

function isDeviceSectionValid(
  formData: FormState,
  isCustomPurpose: boolean,
  customPurpose: string
): boolean {
  const hasPurpose = isCustomPurpose
    ? Boolean(customPurpose?.trim())
    : Boolean(formData.purpose?.trim());
  const hasSerial =
    formData.device_format === 'kit'
      ? Boolean(formData.serial_no?.trim()) && Boolean(formData.serial_no_2?.trim())
      : Boolean(formData.serial_no?.trim());
  return (
    Boolean(formData.model_item_name?.trim()) &&
    hasSerial &&
    Boolean(formData.warranty) &&
    hasPurpose
  );
}

function isTrackingSectionValid(formData: FormState): boolean {
  return Boolean(formData.receiving_center_id?.trim());
}

function getMaxUnlockedSection(
  formData: FormState,
  isCustomPurpose: boolean,
  customPurpose: string
): number {
  if (!isCustomerSectionValid(formData)) return 0;
  if (!isDeviceSectionValid(formData, isCustomPurpose, customPurpose)) return 1;
  if (!isTrackingSectionValid(formData)) return 2;
  return FORM_SECTIONS.length - 1;
}

interface RepairVisitTab {
  id: string;
  formData: FormState;
  customPurpose: string;
  isCustomPurpose: boolean;
  seenSections: boolean[];
}

type CustomerFields = Pick<FormState, 'patient_name' | 'phone' | 'email' | 'company'>;

function createNewVisitTab(
  savedEmail: string,
  customer?: Customer,
  customerFields?: CustomerFields
): RepairVisitTab {
  return {
    id: nanoid(),
    formData: {
      ...initialFormData,
      repair_id: generateRepairId(),
      email: customer?.email || customerFields?.email || savedEmail,
      patient_name: customer?.name || customerFields?.patient_name || '',
      phone: customer?.phone || customerFields?.phone || '',
      company: (customer?.company as CompanyType) || customerFields?.company || '',
    },
    customPurpose: '',
    isCustomPurpose: false,
    seenSections: [true, false, false, false, false],
  };
}

function isVisitTabComplete(tab: RepairVisitTab): boolean {
  return (
    isCustomerSectionValid(tab.formData) &&
    isDeviceSectionValid(tab.formData, tab.isCustomPurpose, tab.customPurpose) &&
    isTrackingSectionValid(tab.formData) &&
    tab.seenSections.every(Boolean)
  );
}

function syncCustomerFields(formData: FormState, fields: CustomerFields): FormState {
  return {
    ...formData,
    patient_name: fields.patient_name,
    phone: fields.phone,
    email: fields.email,
    company: fields.company,
  };
}

function getCustomerQuote(tabFormData: FormState): number {
  const invoiceTotal = Number(tabFormData.manufacturer_invoice_total) || 0;
  const markup = Number(tabFormData.hope_markup) || 0;
  if (invoiceTotal <= 0 && markup <= 0) return 0;
  return Math.round((invoiceTotal + markup) * 100) / 100;
}

function buildRepairDbData(tabFormData: FormState, customerId: string) {
  const now = new Date().toISOString();
  const dateOfReceipt = tabFormData.date_of_receipt || now;
  const customerQuote = getCustomerQuote(tabFormData);

  return {
    dbData: {
      customer_id: customerId,
      patient_name: tabFormData.patient_name,
      phone: tabFormData.phone,
      ...(tabFormData.email ? { email: tabFormData.email } : {}),
      company: tabFormData.company || null,
      model_item_name: tabFormData.model_item_name,
      serial_no: tabFormData.serial_no,
      serial_no_2: tabFormData.device_format === 'kit' ? tabFormData.serial_no_2 : null,
      device_format: tabFormData.device_format,
      quantity: tabFormData.device_format === 'kit' ? 2 : 1,
      warranty: tabFormData.warranty,
      purpose: tabFormData.purpose,
      repair_estimate_by_company: customerQuote > 0 ? customerQuote : null,
      estimate_by_us:
        tabFormData.hope_markup != null && `${tabFormData.hope_markup}` !== ''
          ? Number(tabFormData.hope_markup)
          : null,
      customer_paid: tabFormData.customer_paid,
      payment_mode: tabFormData.payment_mode,
      courier_expenses: tabFormData.courier_expenses,
      manufacturer_invoice_number: tabFormData.manufacturer_invoice_number || null,
      manufacturer_invoice_date: tabFormData.manufacturer_invoice_date || null,
      manufacturer_invoice_total:
        tabFormData.manufacturer_invoice_total != null &&
        `${tabFormData.manufacturer_invoice_total}` !== ''
          ? Number(tabFormData.manufacturer_invoice_total)
          : null,
      manufacturer_invoice_gst_rate: Number(tabFormData.manufacturer_invoice_gst_rate) || 18,
      ...(Number(tabFormData.manufacturer_invoice_total) > 0
        ? (() => {
            const breakdown = calculateTaxFromInclusive(
              Number(tabFormData.manufacturer_invoice_total),
              Number(tabFormData.manufacturer_invoice_gst_rate) || 18
            );
            return {
              manufacturer_invoice_base_amount: breakdown.netValue,
              manufacturer_invoice_tax_amount: breakdown.taxAmount,
              manufacturer_invoice_cgst_amount: breakdown.cgstAmount,
              manufacturer_invoice_sgst_amount: breakdown.sgstAmount,
            };
          })()
        : {
            manufacturer_invoice_base_amount: null,
            manufacturer_invoice_tax_amount: null,
            manufacturer_invoice_cgst_amount: null,
            manufacturer_invoice_sgst_amount: null,
          }),
      programming_done: Boolean(tabFormData.programming_done),
      remarks: tabFormData.remarks || null,
      estimate_status: tabFormData.estimate_status,
      updated_at: now,
      ear: tabFormData.device_format === 'kit' ? 'both' : tabFormData.ear,
      mould: tabFormData.mould || null,
      warranty_after_repair: tabFormData.warranty_after_repair || null,
      receiving_center: tabFormData.receiving_center || null,
      current_center_id: tabFormData.receiving_center_id || null,
      pickup_center_id: tabFormData.pickup_center_id || null,
      current_location_type: 'at_center' as const,
    },
    dateOfReceipt,
    now,
  };
}

export default function RepairForm({ repair, mode = 'create', prefillCustomer }: Props) {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [visitStats, setVisitStats] = useState<CustomerVisitStats | null>(null);
  const [visitStatsLoading, setVisitStatsLoading] = useState(false);
  
  // Get saved email from localStorage for new repairs
  const [savedEmail, setSavedEmail] = useState<string>('');
  
  // Check for saved email in localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && mode === 'create') {
      const email = localStorage.getItem('userEmail') || '';
      setSavedEmail(email);
    }
  }, [mode]);

  // State for custom purpose
  const [customPurpose, setCustomPurpose] = useState<string>('');
  const [isCustomPurpose, setIsCustomPurpose] = useState<boolean>(false);
  const [seenSections, setSeenSections] = useState<boolean[]>(() =>
    mode === 'edit'
      ? FORM_SECTIONS.map(() => true)
      : [true, false, false, false, false]
  );
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [centers, setCenters] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/centers')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCenters(data);
      })
      .catch(console.error);
  }, []);

  // Initialize form state with proper types
  const [formData, setFormData] = useState<FormState>(() => {
    if (repair) {
      // Check if the repair purpose is in our predefined options
      const isPredefinedPurpose = repairPurposeOptions.includes(repair.purpose);
      if (!isPredefinedPurpose && repair.purpose) {
        setCustomPurpose(repair.purpose);
        setIsCustomPurpose(true);
      }
      
      return {
        // Initialize with default values first
        ...initialFormData,
        // Then override with repair data
        repair_id: repair.repair_id,
        status: repair.status,
        patient_name: repair.patient_name,
        phone: repair.phone,
        email: repair.email || '',
        company: repair.company || '',
        model_item_name: repair.model_item_name,
        serial_no: repair.serial_no,
        serial_no_2: repair.serial_no_2 || '',
        device_format: inferDeviceFormat(repair),
        quantity: inferDeviceFormat(repair) === 'kit' ? 2 : 1,
        warranty: repair.warranty,
        purpose: repair.purpose,
        hope_markup: repair.estimate_by_us ?? (
          repair.repair_estimate_by_company && repair.manufacturer_invoice_total
            ? Math.max(0, repair.repair_estimate_by_company - repair.manufacturer_invoice_total)
            : null
        ),
        customer_paid: repair.customer_paid ?? null,
        payment_mode: repair.payment_mode || null,
        courier_expenses: repair.courier_expenses ?? null,
        programming_done: repair.programming_done !== undefined ? repair.programming_done : false,
        remarks: repair.remarks || '',
        estimate_status: (repair.estimate_status as EstimateStatus) || 'Not Required',
        date_of_receipt: repair.date_of_receipt,
        date_out_to_manufacturer: repair.date_out_to_manufacturer,
        date_received_from_manufacturer: repair.date_received_from_manufacturer,
        date_out_to_customer: repair.date_out_to_customer,
        created_at: repair.created_at,
        updated_at: repair.updated_at,
        ear: repair.ear ? repair.ear.toLowerCase() as EarType : null,
        mould: repair.mould || '',
        warranty_after_repair: repair.warranty_after_repair || '',
        receiving_center: repair.receiving_center || '',
        receiving_center_id: repair.current_center_id || '',
        pickup_center_id: repair.pickup_center_id || '',
        manufacturer_invoice_number: repair.manufacturer_invoice_number || '',
        manufacturer_invoice_date: repair.manufacturer_invoice_date || null,
        manufacturer_invoice_total: repair.manufacturer_invoice_total ?? null,
        manufacturer_invoice_gst_rate: repair.manufacturer_invoice_gst_rate ?? 18,
      };
    } else {
      // New repair - use defaults + generate ID
      return { 
        ...initialFormData, 
        repair_id: generateRepairId(),
        email: savedEmail // Use saved email from localStorage if available
      };
    }
  });

  const [visitTabs, setVisitTabs] = useState<RepairVisitTab[]>([]);
  const [activeVisitTabId, setActiveVisitTabId] = useState('');

  const syncCustomerToAllTabs = useCallback((fields: CustomerFields) => {
    setVisitTabs((prev) =>
      prev.map((tab) => ({
        ...tab,
        formData: syncCustomerFields(tab.formData, fields),
      }))
    );
  }, []);

  useEffect(() => {
    if (mode !== 'create' || visitTabs.length > 0) return;
    const tab = createNewVisitTab(savedEmail, prefillCustomer);
    setVisitTabs([tab]);
    setActiveVisitTabId(tab.id);
    setFormData(tab.formData);
    setCustomPurpose(tab.customPurpose);
    setIsCustomPurpose(tab.isCustomPurpose);
    setSeenSections(tab.seenSections);
  }, [mode, savedEmail, prefillCustomer, visitTabs.length]);

  useEffect(() => {
    if (mode !== 'create' || !prefillCustomer) return;

    const fields: CustomerFields = {
      patient_name: prefillCustomer.name,
      phone: prefillCustomer.phone,
      email: prefillCustomer.email || '',
      company: (prefillCustomer.company as CompanyType) || '',
    };

    setFormData((prev) => syncCustomerFields(prev, fields));
    syncCustomerToAllTabs(fields);
  }, [prefillCustomer, mode, syncCustomerToAllTabs]);

  useEffect(() => {
    if (mode !== 'create') return;

    const phone = formData.phone?.trim();
    if (!phone || phone.length < 10) {
      setVisitStats(null);
      return;
    }

    const timer = setTimeout(async () => {
      setVisitStatsLoading(true);
      try {
        const stats = await getCustomerVisitStatsByPhone(supabase, phone);
        setVisitStats(stats);
      } catch {
        setVisitStats(null);
      } finally {
        setVisitStatsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.phone, mode]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusChanged, setStatusChanged] = useState<{ repairId: string; oldStatus: RepairStatus; newStatus: RepairStatus } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = useCallback((fieldName: string) => {
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  const setStageValidationErrors = useCallback(
    (
      validation: ReturnType<typeof validateRepairForStatus>,
      fallbackMessage = 'Complete all required fields for this stage.'
    ) => {
      const nextErrors = validation.missingFields.reduce<Record<string, string>>((acc, field) => {
        acc[field] = 'Required for this stage';
        return acc;
      }, {});
      setFieldErrors(nextErrors);
      setError(validation.message || fallbackMessage);
    },
    []
  );

  const getVisitTabLabel = useCallback(
    (index: number) => {
      const base = visitStats?.nextVisitNumber ?? 1;
      return `Visit ${base + index}`;
    },
    [visitStats]
  );

  const getActiveTabSnapshot = useCallback(
    (): RepairVisitTab => ({
      id: activeVisitTabId,
      formData,
      customPurpose,
      isCustomPurpose,
      seenSections,
    }),
    [activeVisitTabId, formData, customPurpose, isCustomPurpose, seenSections]
  );

  const persistActiveVisitTab = useCallback(
    (tabs: RepairVisitTab[]) => {
      if (!activeVisitTabId) return tabs;
      const snapshot = getActiveTabSnapshot();
      return tabs.map((tab) => (tab.id === activeVisitTabId ? snapshot : tab));
    },
    [activeVisitTabId, getActiveTabSnapshot]
  );

  const switchVisitTab = useCallback(
    (tabId: string) => {
      if (tabId === activeVisitTabId) return;

      setVisitTabs((prev) => {
        const updated = persistActiveVisitTab(prev);
        const target = updated.find((tab) => tab.id === tabId);
        if (target) {
          setFormData(target.formData);
          setCustomPurpose(target.customPurpose);
          setIsCustomPurpose(target.isCustomPurpose);
          setSeenSections(target.seenSections);
          setActiveVisitTabId(tabId);
        }
        return updated;
      });
    },
    [activeVisitTabId, persistActiveVisitTab]
  );

  const addVisitTab = useCallback(() => {
    const customerFields: CustomerFields = {
      patient_name: formData.patient_name,
      phone: formData.phone,
      email: formData.email,
      company: formData.company,
    };

    setVisitTabs((prev) => {
      const updated = persistActiveVisitTab(prev);
      const newTab = createNewVisitTab(savedEmail, undefined, customerFields);
      setFormData(newTab.formData);
      setCustomPurpose(newTab.customPurpose);
      setIsCustomPurpose(newTab.isCustomPurpose);
      setSeenSections(newTab.seenSections);
      setActiveVisitTabId(newTab.id);
      return [...updated, newTab];
    });
  }, [formData, persistActiveVisitTab, savedEmail]);

  const removeVisitTab = useCallback(
    (tabId: string) => {
      setVisitTabs((prev) => {
        if (prev.length <= 1) return prev;

        const updated = persistActiveVisitTab(prev).filter((tab) => tab.id !== tabId);
        if (tabId === activeVisitTabId) {
          const nextTab = updated[updated.length - 1];
          setFormData(nextTab.formData);
          setCustomPurpose(nextTab.customPurpose);
          setIsCustomPurpose(nextTab.isCustomPurpose);
          setSeenSections(nextTab.seenSections);
          setActiveVisitTabId(nextTab.id);
        }
        return updated;
      });
    },
    [activeVisitTabId, persistActiveVisitTab]
  );

  const invoiceTaxBreakdown = useMemo(
    () =>
      calculateTaxFromInclusive(
        Number(formData.manufacturer_invoice_total) || 0,
        Number(formData.manufacturer_invoice_gst_rate) || 18
      ),
    [formData.manufacturer_invoice_total, formData.manufacturer_invoice_gst_rate]
  );

  const customerQuote = useMemo(() => {
    const invoiceTotal = Number(formData.manufacturer_invoice_total) || 0;
    const markup = Number(formData.hope_markup) || 0;
    if (invoiceTotal <= 0 && markup <= 0) return 0;
    return Math.round((invoiceTotal + markup) * 100) / 100;
  }, [formData.manufacturer_invoice_total, formData.hope_markup]);

  const customerQuoteTaxBreakdown = useMemo(
    () =>
      calculateTaxFromInclusive(
        customerQuote,
        Number(formData.manufacturer_invoice_gst_rate) || 18
      ),
    [customerQuote, formData.manufacturer_invoice_gst_rate]
  );

  const maxUnlockedSection = useMemo(
    () => getMaxUnlockedSection(formData, isCustomPurpose, customPurpose),
    [formData, isCustomPurpose, customPurpose]
  );

  const allMandatoryValid = useMemo(
    () =>
      isCustomerSectionValid(formData) &&
      isDeviceSectionValid(formData, isCustomPurpose, customPurpose) &&
      isTrackingSectionValid(formData),
    [formData, isCustomPurpose, customPurpose]
  );

  const allSectionsSeen = seenSections.every(Boolean);
  const allVisitTabsReady = useMemo(() => {
    if (mode !== 'create' || visitTabs.length === 0) return false;
    const tabsWithActive = persistActiveVisitTab(visitTabs);
    return tabsWithActive.every(isVisitTabComplete);
  }, [mode, visitTabs, persistActiveVisitTab, formData, customPurpose, isCustomPurpose, seenSections]);

  const canSubmit =
    mode === 'edit'
      ? allMandatoryValid
      : visitTabs.length > 1
        ? allVisitTabsReady
        : allMandatoryValid && allSectionsSeen;
  const sectionsSeenCount = seenSections.filter(Boolean).length;

  const currentStatusIndex = getStatusIndex(formData.status);
  const currentStatusStep = STATUS_STEPS[currentStatusIndex] ?? STATUS_STEPS[0];
  const nextStatusStep =
    currentStatusIndex < STATUS_STEPS.length - 1
      ? STATUS_STEPS[currentStatusIndex + 1]
      : null;

  const transitionFieldValues = useMemo<TransitionFieldValues>(
    () => ({
      manufacturer_invoice_number: formData.manufacturer_invoice_number,
      manufacturer_invoice_date: formData.manufacturer_invoice_date,
      manufacturer_invoice_total: formData.manufacturer_invoice_total,
      manufacturer_invoice_gst_rate: formData.manufacturer_invoice_gst_rate,
      warranty_after_repair: formData.warranty_after_repair,
      hope_markup: formData.hope_markup,
      customer_paid: formData.customer_paid,
      payment_mode: formData.payment_mode,
      pickup_center_id: formData.pickup_center_id,
    }),
    [formData]
  );

  const applyTransitionFieldValues = useCallback((values: TransitionFieldValues) => {
    setFormData((prev) => ({
      ...prev,
      manufacturer_invoice_number: values.manufacturer_invoice_number ?? prev.manufacturer_invoice_number,
      manufacturer_invoice_date: values.manufacturer_invoice_date ?? prev.manufacturer_invoice_date,
      manufacturer_invoice_total:
        values.manufacturer_invoice_total !== undefined
          ? values.manufacturer_invoice_total
          : prev.manufacturer_invoice_total,
      manufacturer_invoice_gst_rate:
        values.manufacturer_invoice_gst_rate ?? prev.manufacturer_invoice_gst_rate,
      warranty_after_repair:
        values.warranty_after_repair !== undefined
          ? (values.warranty_after_repair as WarrantyAfterRepair | '')
          : prev.warranty_after_repair,
      hope_markup: values.hope_markup !== undefined ? values.hope_markup : prev.hope_markup,
      customer_paid: values.customer_paid !== undefined ? values.customer_paid : prev.customer_paid,
      payment_mode:
        values.payment_mode !== undefined
          ? (values.payment_mode as PaymentMode | null)
          : prev.payment_mode,
      pickup_center_id: values.pickup_center_id ?? prev.pickup_center_id,
    }));
    Object.keys(values).forEach((key) => clearFieldError(key));
  }, [clearFieldError]);

  const setSectionRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      sectionRefs.current[index] = el;
    },
    []
  );

  const isSectionUnlocked = useCallback(
    (index: number) => mode === 'edit' || index <= maxUnlockedSection,
    [mode, maxUnlockedSection]
  );

  useEffect(() => {
    if (mode === 'edit') return;

    const observers: IntersectionObserver[] = [];

    sectionRefs.current.forEach((el, index) => {
      if (!el || !isSectionUnlocked(index)) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setSeenSections((prev) => {
              if (prev[index]) return prev;
              const next = [...prev];
              next[index] = true;
              return next;
            });
          }
        },
        { threshold: 0.25, rootMargin: '0px 0px -10% 0px' }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, [mode, maxUnlockedSection, isSectionUnlocked]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    clearFieldError(name);
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (
        mode === 'create' &&
        (name === 'patient_name' || name === 'phone' || name === 'email' || name === 'company')
      ) {
        syncCustomerToAllTabs({
          patient_name: name === 'patient_name' ? value : next.patient_name,
          phone: name === 'phone' ? value : next.phone,
          email: name === 'email' ? value : next.email,
          company: name === 'company' ? (value as CompanyType | '') : next.company,
        });
      }
      return next;
    });
  };

  // Handle purpose selection change
  const handlePurposeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === 'Other (please specify)') {
      setIsCustomPurpose(true);
      setFormData(prev => ({
        ...prev,
        purpose: customPurpose || ''
      }));
    } else {
      setIsCustomPurpose(false);
      setFormData(prev => ({
        ...prev,
        purpose: value
      }));
    }
  };

  // Handle custom purpose input change
  const handleCustomPurposeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomPurpose(value);
    setFormData(prev => ({
      ...prev,
      purpose: value
    }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStatus = e.target.value as RepairStatus;
    const now = new Date().toISOString();
    const oldStatus = formData.status;

    const candidateData: FormState = {
      ...formData,
      status: newStatus,
      ...(newStatus === 'Sent to Company for Repair' && {
        date_out_to_manufacturer: formData.date_out_to_manufacturer || now,
      }),
      ...(newStatus === 'Returned from Manufacturer' && {
        date_received_from_manufacturer: formData.date_received_from_manufacturer || now,
      }),
      ...(newStatus === 'Completed' && {
        date_out_to_customer: formData.date_out_to_customer || now,
      }),
    };

    if (mode === 'edit') {
      const hasTransitionFields = getTransitionFieldsForStatus(newStatus).length > 0;
      const validation = hasTransitionFields
        ? validateTransitionFields(newStatus, transitionFieldValues, {
            ...candidateData,
            receiving_center_id: candidateData.receiving_center_id || undefined,
          })
        : validateRepairForStatus(newStatus, {
            ...candidateData,
            receiving_center_id: candidateData.receiving_center_id || undefined,
          });
      if (!validation.isValid) {
        setStageValidationErrors(validation, `Cannot move to ${newStatus}.`);
        return;
      }
    }

    setError(null);
    setFieldErrors({});
    setFormData(candidateData);

    if (repair?.id && oldStatus !== newStatus) {
      setStatusChanged({
        repairId: repair.id,
        oldStatus,
        newStatus
      });
    }
  };

  const handleAdvanceStatus = () => {
    if (!nextStatusStep) return;
    handleStatusChange({
      target: { value: nextStatusStep.status },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleDeviceFormatChange = (format: DeviceFormat) => {
    setFormData((prev) => ({
      ...prev,
      device_format: format,
      quantity: format === 'kit' ? 2 : 1,
      serial_no_2: format === 'piece' ? '' : prev.serial_no_2,
      ear: format === 'kit' ? 'both' : prev.ear === 'both' ? null : prev.ear,
    }));
  };

  const handleMarkupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const markupValue = e.target.value ? Number(e.target.value) : 0;
    setFormData((prev) => ({
      ...prev,
      hope_markup: markupValue || null,
      estimate_status:
        (Number(prev.manufacturer_invoice_total) || 0) + markupValue > 0 &&
        (!prev.estimate_status || prev.estimate_status === 'Not Required')
          ? 'Pending'
          : prev.estimate_status || 'Not Required',
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      if (mode === 'create' && visitTabs.length > 1) {
        const allTabs = persistActiveVisitTab(visitTabs);
        const incompleteTab = allTabs.find((tab) => !isVisitTabComplete(tab));
        if (incompleteTab) {
          throw new Error(
            'Each visit tab must have all required fields filled and all sections reviewed before creating repairs.'
          );
        }

        const connCheck = await fetch('/api/health-check', {
          method: 'HEAD',
          cache: 'no-store',
          signal: AbortSignal.timeout(3000),
        });
        if (!connCheck.ok) {
          throw new Error('API server is not responding');
        }

        const firstTab = allTabs[0].formData;
        if (!firstTab.phone || firstTab.phone.length < 10) {
          throw new Error('Please enter a valid phone number');
        }

        const customerData = {
          name: firstTab.patient_name,
          phone: firstTab.phone,
          email: firstTab.email,
          company: firstTab.company || null,
        };

        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id, name, phone, email')
          .eq('phone', firstTab.phone)
          .maybeSingle();

        let customerId: string;
        if (existingCustomer) {
          const { data: updatedCustomer, error: updateError } = await supabase
            .from('customers')
            .update(customerData)
            .eq('id', existingCustomer.id)
            .select()
            .single();
          if (updateError) throw new Error(`Failed to update customer: ${updateError.message}`);
          customerId = updatedCustomer.id;
        } else {
          const { data: newCustomer, error: insertError } = await supabase
            .from('customers')
            .insert([customerData])
            .select()
            .single();
          if (insertError) throw new Error(`Failed to create customer: ${insertError.message}`);
          customerId = newCustomer.id;
        }

        const createdIds: string[] = [];
        for (const tab of allTabs) {
          const tabValidation = validateRepairForStatus('Received', {
            ...tab.formData,
            status: 'Received',
            receiving_center_id: tab.formData.receiving_center_id || undefined,
          });
          if (!tabValidation.isValid) {
            throw new Error(`Visit tab has missing fields: ${tabValidation.missingLabels.join(', ')}`);
          }

          const { dbData, dateOfReceipt, now } = buildRepairDbData(tab.formData, customerId);
          const uuid =
            typeof window !== 'undefined' && window.crypto?.randomUUID
              ? window.crypto.randomUUID()
              : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                  const r = (Math.random() * 16) | 0;
                  const v = c === 'x' ? r : (r & 0x3) | 0x8;
                  return v.toString(16);
                });

          const createData = {
            ...dbData,
            id: uuid,
            repair_id: tab.formData.repair_id,
            status: 'Received' as RepairStatus,
            date_of_receipt: dateOfReceipt,
            created_at: now,
          };

          const { error: repairError } = await supabase.from('repairs').insert([createData]);
          if (repairError) {
            throw new Error(`Failed to create repair ${tab.formData.repair_id}: ${repairError.message}`);
          }

          if (tab.formData.receiving_center_id) {
            const centerName = centers.find((c) => c.id === tab.formData.receiving_center_id)?.name;
            if (centerName) {
              await supabase.from('repairs').update({ receiving_center: centerName }).eq('id', uuid);
            }
            await fetch(`/api/repairs/${uuid}/movements`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                movement_type: 'received',
                from_location_type: 'customer',
                to_location_type: 'center',
                to_center_id: tab.formData.receiving_center_id,
                received_at: dateOfReceipt,
              }),
            });
          }

          createdIds.push(uuid);
        }

        showAlert(`${allTabs.length} repairs created successfully`, 'success');
        router.push(`/dashboard/customers/${customerId}`);
        router.refresh();
        return;
      }

      // Validate required fields
      const requiredFields = [
        'patient_name',
        'phone',
        'model_item_name',
        'serial_no',
        'warranty',
        'purpose'
      ] as const;

      const missingFields = requiredFields.filter(
        field => !formData[field as keyof typeof formData]
      );

      if (missingFields.length > 0) {
        throw new Error(`Required fields missing: ${missingFields.join(', ')}`);
      }

      if (formData.device_format === 'kit' && !formData.serial_no_2?.trim()) {
        throw new Error('Right ear serial number is required for a pair kit');
      }

      const targetStatus: RepairStatus = mode === 'edit' ? formData.status : 'Received';
      const stageValidation = validateRepairForStatus(targetStatus, {
        ...formData,
        status: targetStatus,
        receiving_center_id: formData.receiving_center_id || undefined,
      });
      if (!stageValidation.isValid) {
        setStageValidationErrors(stageValidation);
        throw new Error(stageValidation.message || 'Missing required stage fields');
      }

      // Check for connectivity before proceeding
      try {
        // Simple connection check
        const connCheck = await fetch('/api/health-check', { 
          method: 'HEAD',
          cache: 'no-store',
          signal: AbortSignal.timeout(3000) // 3-second timeout
        });
        
        if (!connCheck.ok) {
          throw new Error('API server is not responding');
        }
      } catch (connErr) {
        console.error('Connection check failed:', connErr);
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      }

      // First, create or update the customer
      const customerData = {
        name: formData.patient_name,
        phone: formData.phone,
        email: formData.email,
        company: formData.company || null
      };

      console.log('Creating/updating customer with data:', customerData);

      // Validate phone number format
      if (!customerData.phone || customerData.phone.length < 10) {
        throw new Error('Please enter a valid phone number');
      }

      // Check if customer exists
      try {
        console.log('Checking if customer exists with phone:', formData.phone);
        
        // Try to connect to Supabase with timeout
        let existingCustomer, searchError;
        
        try {
          // Add timeout to Supabase query
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database connection timeout')), 5000)
          );
          
          const queryPromise = supabase
            .from('customers')
            .select('id, name, phone, email')
            .eq('phone', formData.phone)
            .maybeSingle();
            
          // Race between the query and timeout
          const result = await Promise.race([queryPromise, timeoutPromise]);
          existingCustomer = result.data;
          searchError = result.error;
        } catch (timeoutErr) {
          console.error('Supabase query timed out:', timeoutErr);
          throw new Error('Database connection timed out. Please try again.');
        }

        if (searchError) {
          console.error('Error searching for customer in database:', searchError);
          throw new Error(`Database error: ${searchError.message}`);
        }

        let customerId;
        
        if (existingCustomer) {
          console.log('Found existing customer:', existingCustomer);
          // Update existing customer
          try {
            const { data: updatedCustomer, error: updateError } = await supabase
              .from('customers')
              .update(customerData)
              .eq('id', existingCustomer.id)
              .select()
              .single();

            if (updateError) {
              console.error('Error updating customer:', updateError);
              throw new Error(`Failed to update customer: ${updateError.message}`);
            }

            customerId = existingCustomer.id;
          } catch (updateErr) {
            console.error('Error during customer update:', updateErr);
            if (updateErr.message?.includes('Failed to fetch')) {
              throw new Error('Network connection lost. Please check your internet and try again.');
            }
            throw new Error(`Failed to update customer: ${updateErr.message || 'Unknown error'}`);
          }
        } else {
          console.log('No existing customer found, creating new customer');
          // Create new customer
          try {
            const { data: newCustomer, error: insertError } = await supabase
              .from('customers')
              .insert([customerData])
              .select()
              .single();

            if (insertError) {
              console.error('Error creating customer:', insertError);
              throw new Error(`Failed to create customer: ${insertError.message}`);
            }

            if (!newCustomer) {
              throw new Error('Customer creation returned no data');
            }

            customerId = newCustomer.id;
          } catch (createErr) {
            console.error('Error during customer creation:', createErr);
            if (createErr.message?.includes('Failed to fetch')) {
              throw new Error('Network connection lost. Please check your internet and try again.');
            }
            throw new Error(`Failed to create customer: ${createErr.message || 'Unknown error'}`);
          }
        }

        if (!customerId) {
          throw new Error('Failed to get customer ID after create/update');
        }

        console.log('Proceeding with customer ID:', customerId);
        
        // Ensure date fields are in proper format
        const now = new Date().toISOString();
        const dateOfReceipt = formData.date_of_receipt || now;

        // Prepare database object
        const dbData = {
          customer_id: customerId,
          patient_name: formData.patient_name,
          phone: formData.phone,
          // Only include email if it's set, to avoid schema issues
          ...(formData.email ? { email: formData.email } : {}),
          company: formData.company || null,
          model_item_name: formData.model_item_name,
          serial_no: formData.serial_no,
          serial_no_2: formData.device_format === 'kit' ? formData.serial_no_2 : null,
          device_format: formData.device_format,
          quantity: formData.device_format === 'kit' ? 2 : 1,
          warranty: formData.warranty,
          purpose: formData.purpose,
          repair_estimate_by_company: customerQuote > 0 ? customerQuote : null,
          estimate_by_us:
            formData.hope_markup != null && `${formData.hope_markup}` !== ''
              ? Number(formData.hope_markup)
              : null,
          customer_paid: formData.customer_paid,
          payment_mode: formData.payment_mode,
          courier_expenses: formData.courier_expenses,
          manufacturer_invoice_number: formData.manufacturer_invoice_number || null,
          manufacturer_invoice_date: formData.manufacturer_invoice_date || null,
          manufacturer_invoice_total:
            formData.manufacturer_invoice_total != null && `${formData.manufacturer_invoice_total}` !== ''
              ? Number(formData.manufacturer_invoice_total)
              : null,
          manufacturer_invoice_gst_rate: Number(formData.manufacturer_invoice_gst_rate) || 18,
          ...(Number(formData.manufacturer_invoice_total) > 0
            ? (() => {
                const breakdown = calculateTaxFromInclusive(
                  Number(formData.manufacturer_invoice_total),
                  Number(formData.manufacturer_invoice_gst_rate) || 18
                );
                return {
                  manufacturer_invoice_base_amount: breakdown.netValue,
                  manufacturer_invoice_tax_amount: breakdown.taxAmount,
                  manufacturer_invoice_cgst_amount: breakdown.cgstAmount,
                  manufacturer_invoice_sgst_amount: breakdown.sgstAmount,
                };
              })()
            : {
                manufacturer_invoice_base_amount: null,
                manufacturer_invoice_tax_amount: null,
                manufacturer_invoice_cgst_amount: null,
                manufacturer_invoice_sgst_amount: null,
              }),
          programming_done: Boolean(formData.programming_done),
          remarks: formData.remarks || null,
          estimate_status: formData.estimate_status,
          updated_at: now,
          ear: formData.device_format === 'kit' ? 'both' : formData.ear,
          mould: formData.mould || null,
          warranty_after_repair: formData.warranty_after_repair || null,
          receiving_center: formData.receiving_center || null,
          current_center_id: formData.receiving_center_id || null,
          pickup_center_id: formData.pickup_center_id || null,
          current_location_type: 'at_center',
        };

        let createdRepairId: string | null = null;

        if (mode === 'create') {
          // Add fields specific to creation
          const createData = {
            ...dbData,
            repair_id: formData.repair_id,
            status: 'Received', // Always start with Received
            date_of_receipt: dateOfReceipt,
            created_at: now
          };
          
          console.log('Creating repair with data:', createData);

          // Try to create the repair
          try {
            // Generate a UUID in the proper format
            const uuid = typeof window !== 'undefined' && window.crypto?.randomUUID ? 
              window.crypto.randomUUID() : 
              'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0, 
                      v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
              });
            
            const createDataWithId = {
              ...createData,
              id: uuid
            };
            
            console.log('Creating repair with data and explicit UUID:', createDataWithId);

            const { error: repairError } = await supabase
              .from('repairs')
              .insert([createDataWithId]);

            if (repairError) {
              console.error('Error creating repair:', repairError);
              
              // If error mentions schema or email column, handle it specifically
              if (repairError.message.includes('email') && repairError.message.includes('schema')) {
                console.error('Email column issue detected, trying without email field');
                
                // Try again without the email field
                const createDataWithoutEmail = { ...createDataWithId };
                delete createDataWithoutEmail.email;
                
                const { error: retryError } = await supabase
                  .from('repairs')
                  .insert([createDataWithoutEmail]);
                  
                if (retryError) {
                  console.error('Error creating repair on retry:', retryError);
                  throw new Error(`Failed to create repair: ${retryError.message}`);
                } else {
                  // Success on retry without email
                  showAlert('Repair created successfully', 'success');
                  
                  // Optional: display a warning about email field
                  console.warn('Created repair successfully but without email field');
                  
                  setLoading(false);
                  router.push(`/dashboard/repairs/${createDataWithoutEmail.id}?receipt=1`);
                  router.refresh();
                  return;
                }
              } else {
                // For other errors, throw normally
                throw new Error(`Failed to create repair: ${repairError.message}${repairError.details ? ` (${repairError.details})` : ''}`);
              }
            }
            
            createdRepairId = uuid;

            if (formData.receiving_center_id) {
              const centerName = centers.find((c) => c.id === formData.receiving_center_id)?.name;
              if (centerName) {
                await supabase.from('repairs').update({ receiving_center: centerName }).eq('id', uuid);
              }
              await fetch(`/api/repairs/${uuid}/movements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  movement_type: 'received',
                  from_location_type: 'customer',
                  to_location_type: 'center',
                  to_center_id: formData.receiving_center_id,
                  received_at: dateOfReceipt,
                }),
              });
            }

            showAlert('Repair created successfully', 'success');
          } catch (insertError) {
            console.error('Error during repair creation:', insertError);
            throw new Error(insertError instanceof Error ? insertError.message : 'Failed to create repair');
          }
        } else {
          // Add fields specific to updates
          const updateData = {
            ...dbData,
            status: formData.status,
            date_out_to_manufacturer: formData.date_out_to_manufacturer,
            date_received_from_manufacturer: formData.date_received_from_manufacturer,
            date_out_to_customer: formData.date_out_to_customer
          };
          
          console.log('Updating repair with data:', updateData);

          const { error: repairError } = await supabase
            .from('repairs')
            .update(updateData)
            .eq('id', repair?.id);

          if (repairError) {
            console.error('Error updating repair:', repairError);
            throw new Error(`Failed to update repair: ${repairError.message}`);
          }

          if (statusChanged && repair?.id) {
            const movement = getMovementForStatusChange(statusChanged.newStatus, {
              current_center_id: formData.receiving_center_id || repair.current_center_id,
              pickup_center_id: formData.pickup_center_id || repair.pickup_center_id,
              receiving_center_id: formData.receiving_center_id,
            });
            if (movement) {
              try {
                await fetch(`/api/repairs/${repair.id}/movements`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(movement),
                });
              } catch (movementErr) {
                console.warn('Failed to auto-log movement for status change:', movementErr);
              }
            }
          }
          
          if (repair?.repair_id) {
            try {
              // More aggressive cache invalidation approach
              console.log('Invalidating cache for repair:', repair.repair_id);
              
              // 1. Call our cache invalidation API
              const cacheResponse = await fetch(`/api/cache-invalidate?repair_id=${repair.repair_id}&id=${repair.id}`, {
                method: 'POST',
                cache: 'no-store',
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                }
              });
              
              if (!cacheResponse.ok) {
                console.warn('Cache invalidation API returned non-200 status:', cacheResponse.status);
              }
              
              // 2. Force refresh dashboard stats data
              await fetch(`/api/dashboard-stats?refresh=${Date.now()}&force=true`, {
                method: 'GET',
                cache: 'no-store',
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                },
              });
              
              console.log('Cache invalidation and dashboard refresh completed');
            } catch (cacheError) {
              console.error('Failed to invalidate cache, but repair was updated:', cacheError);
            }
          }
          
          showAlert('Repair updated successfully', 'success');
        }

        // If status was changed, send notification
        if (statusChanged) {
          try {
            await fetch('/api/status-change-notification', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(statusChanged),
            });
          } catch (notificationError) {
            console.error('Failed to send status change notification, but repair was updated:', notificationError);
          }
        }

        if (mode === 'create' && createdRepairId) {
          router.push(`/dashboard/repairs/${createdRepairId}?receipt=1`);
        } else {
          router.push('/dashboard/repairs');
        }
        router.refresh();
      } catch (customerErr) {
        console.error('Customer processing error:', customerErr);
        throw new Error(`Customer lookup failed: ${customerErr.message || 'Connection error. Please check your internet connection and try again.'}`);
      }
    } catch (err) {
      console.error('Error in form submission:', err);
      setError(
        err instanceof Error
          ? err.message
          : `An error occurred while ${mode === 'create' ? 'creating' : 'updating'} the repair`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    
    console.log(`Attempting to delete repair with ID: ${repair?.id}`);
    
    try {
      // First attempt: Delete via API route
      console.log('Attempting deletion via API route...');
      const deleteUrl = `/api/repairs?id=${repair?.id}`;
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('API deletion failed:', result);
        
        // If API fails, try direct Supabase deletion as fallback
        console.log('API deletion failed, attempting direct Supabase deletion...');
        
        const { error: deleteError } = await supabase
          .from('repairs')
          .delete()
          .eq('id', repair?.id);
        
        if (deleteError) {
          console.error('Direct Supabase deletion also failed:', deleteError);
          throw new Error(`Failed to delete repair: ${deleteError.message}`);
        } else {
          console.log('Direct Supabase deletion succeeded!');
        }
      } else {
        console.log('API deletion succeeded:', result);
      }
      
      // Success - close dialog and redirect
      setDeleteDialogOpen(false);
      setLoading(false);
      router.push('/dashboard/repairs');
      router.refresh();
      showAlert('Repair deleted successfully', 'success');
      
    } catch (error) {
      console.error('Error during repair deletion:', error);
      setLoading(false);
      setError(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      {mode === 'create' && (
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {sectionsSeenCount} of {FORM_SECTIONS.length} sections reviewed
            </Typography>
            <Typography variant="body2" color={allMandatoryValid ? 'success.main' : 'text.secondary'}>
              {allMandatoryValid ? 'All required fields complete' : 'Complete required fields as you go'}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={(sectionsSeenCount / FORM_SECTIONS.length) * 100}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
            {FORM_SECTIONS.map((section, index) => (
              <Chip
                key={section.title}
                size="small"
                label={`${index + 1}. ${section.title}`}
                color={seenSections[index] ? 'success' : isSectionUnlocked(index) ? 'primary' : 'default'}
                variant={seenSections[index] ? 'filled' : 'outlined'}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* ── Edit-mode Status Stepper ── */}
      {mode === 'edit' && (
        <Box sx={{ mb: 4 }}>
          {/* Stepper */}
          <Stepper nonLinear activeStep={currentStatusIndex} alternativeLabel>
            {STATUS_STEPS.map((step, index) => (
              <Step key={step.status} completed={index < currentStatusIndex}>
                <StepButton
                  onClick={() =>
                    handleStatusChange({
                      target: { value: step.status },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                >
                  <StepLabel
                    icon={
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor:
                            index === currentStatusIndex
                              ? step.color
                              : index < currentStatusIndex
                              ? step.color + '99'
                              : 'grey.300',
                          color: index <= currentStatusIndex ? '#fff' : 'grey.500',
                          transition: 'all 0.2s',
                          '& svg': { fontSize: 18 },
                        }}
                      >
                        {step.icon}
                      </Box>
                    }
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontWeight: index === currentStatusIndex ? 700 : 400,
                        color:
                          index === currentStatusIndex
                            ? step.color
                            : index < currentStatusIndex
                            ? 'text.secondary'
                            : 'text.disabled',
                        fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      },
                    }}
                  >
                    {step.label}
                  </StepLabel>
                </StepButton>
              </Step>
            ))}
          </Stepper>

          {/* Status context card */}
          <Box
            sx={{
              mt: 2,
              p: 2.5,
              borderRadius: 2,
              bgcolor: currentStatusStep.bgColor,
              border: `2px solid ${currentStatusStep.color}33`,
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
              alignItems: { md: 'flex-start' },
            }}
          >
            {/* Left: status info */}
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Box sx={{ color: currentStatusStep.color, display: 'flex' }}>
                  {currentStatusStep.icon}
                </Box>
                <Typography variant="subtitle1" fontWeight={700} color={currentStatusStep.color}>
                  {currentStatusStep.label}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {currentStatusStep.description}
              </Typography>
              {currentStatusStep.relevantSections.length > 0 && (
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    Focus on:
                  </Typography>
                  {currentStatusStep.relevantSections.map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      size="small"
                      sx={{
                        bgcolor: currentStatusStep.color + '22',
                        color: currentStatusStep.color,
                        fontWeight: 600,
                        border: `1px solid ${currentStatusStep.color}44`,
                      }}
                    />
                  ))}
                </Stack>
              )}

              {getTransitionFieldsForStatus(formData.status).length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <StageTransitionFields
                    targetStatus={formData.status}
                    values={transitionFieldValues}
                    onChange={applyTransitionFieldValues}
                    errors={fieldErrors}
                  />
                </Box>
              )}
            </Box>

            {/* Right: date field for this status */}
            <Box sx={{ minWidth: { md: 230 } }}>
              {currentStatusStep.dateField && currentStatusStep.dateLabel && (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label={currentStatusStep.dateLabel}
                    value={
                      formData[currentStatusStep.dateField as keyof FormState]
                        ? dayjs(formData[currentStatusStep.dateField as keyof FormState] as string)
                        : null
                    }
                    onChange={(date: Dayjs | null) =>
                      setFormData((prev) => ({
                        ...prev,
                        [currentStatusStep.dateField as string]: date?.isValid()
                          ? date.toISOString()
                          : null,
                      }))
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        sx: {
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: currentStatusStep.color + '66' },
                          },
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
              )}

              {nextStatusStep &&
                getTransitionFieldsForStatus(nextStatusStep.status).length > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    <StageTransitionFields
                      targetStatus={nextStatusStep.status}
                      values={transitionFieldValues}
                      onChange={applyTransitionFieldValues}
                      errors={fieldErrors}
                    />
                  </Box>
                )}

              {nextStatusStep && (
                <Button
                  size="small"
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleAdvanceStatus}
                  sx={{
                    mt: 1.5,
                    bgcolor: currentStatusStep.color,
                    '&:hover': { bgcolor: currentStatusStep.color + 'DD' },
                    textTransform: 'none',
                    fontWeight: 600,
                    width: '100%',
                  }}
                >
                  Move to: {nextStatusStep.label}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={5}>
          {/* Section 1: Customer */}
          <Box
            ref={setSectionRef(0)}
            sx={{
              opacity: isSectionUnlocked(0) ? 1 : 0.45,
              pointerEvents: isSectionUnlocked(0) ? 'auto' : 'none',
            }}
          >
            <Typography variant="h6" fontWeight={700} color="primary.main">
              1. {FORM_SECTIONS[0].title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {FORM_SECTIONS[0].subtitle}
            </Typography>
            {mode === 'create' && formData.phone?.trim().length >= 10 && (
              <Alert
                severity={visitStats?.totalVisits ? 'info' : 'success'}
                sx={{ mb: 2 }}
              >
                {visitStatsLoading ? (
                  'Checking customer history...'
                ) : visitStats?.totalVisits ? (
                  <>
                    Returning customer — this will be Visit {visitStats.nextVisitNumber} (
                    {visitStats.totalVisits} previous visit{visitStats.totalVisits !== 1 ? 's' : ''}).
                    {visitStats.customerId && (
                      <>
                        {' '}
                        <Link
                          href={`/dashboard/customers/${visitStats.customerId}`}
                          style={{ fontWeight: 600 }}
                        >
                          View visit history
                        </Link>
                      </>
                    )}
                  </>
                ) : (
                  'New customer — this will be Visit 1.'
                )}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Patient Name"
                  name="patient_name"
                  value={formData.patient_name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Company"
                  name="company"
                  value={formData.company || ''}
                  onChange={(e) => {
                    const company = e.target.value as CompanyType | '';
                    setFormData((prev) => {
                      const next = { ...prev, company };
                      if (mode === 'create') {
                        syncCustomerToAllTabs({
                          patient_name: next.patient_name,
                          phone: next.phone,
                          email: next.email,
                          company,
                        });
                      }
                      return next;
                    });
                  }}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="Signia">Signia</MenuItem>
                  <MenuItem value="Phonak">Phonak</MenuItem>
                  <MenuItem value="Widex">Widex</MenuItem>
                  <MenuItem value="Starkey">Starkey</MenuItem>
                  <MenuItem value="GNResound">GNResound</MenuItem>
                  <MenuItem value="Unitron">Unitron</MenuItem>
                  <MenuItem value="Oticon">Oticon</MenuItem>
                  <MenuItem value="Siemens">Siemens</MenuItem>
                  <MenuItem value="Others">Others</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>

          {mode === 'create' && visitTabs.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Add a tab for each repair visit — same customer, different device or repair details.
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 0.5,
                  borderBottom: 2,
                  borderColor: 'divider',
                  overflowX: 'auto',
                  pb: 0,
                }}
              >
                {visitTabs.map((tab, index) => (
                  <Box
                    key={tab.id}
                    onClick={() => switchVisitTab(tab.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 2,
                      py: 1,
                      cursor: 'pointer',
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 8,
                      border: '1px solid',
                      borderBottom: 'none',
                      borderColor: activeVisitTabId === tab.id ? 'primary.main' : 'divider',
                      bgcolor: activeVisitTabId === tab.id ? 'background.paper' : 'grey.100',
                      color: activeVisitTabId === tab.id ? 'primary.main' : 'text.secondary',
                      fontWeight: activeVisitTabId === tab.id ? 700 : 500,
                      minWidth: 110,
                      flexShrink: 0,
                      mb: '-2px',
                    }}
                  >
                    <Typography variant="body2" fontWeight="inherit" noWrap>
                      {getVisitTabLabel(index)}
                    </Typography>
                    {visitTabs.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeVisitTab(tab.id);
                        }}
                        sx={{ p: 0.25 }}
                        aria-label={`Close ${getVisitTabLabel(index)}`}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                  </Box>
                ))}
                <IconButton
                  onClick={addVisitTab}
                  size="small"
                  sx={{ mb: 0.5, ml: 0.5, flexShrink: 0 }}
                  aria-label="Add repair visit tab"
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </Box>
          )}

          {/* Section 2: Device & Repair */}
          <Box
            ref={setSectionRef(1)}
            sx={{
              opacity: isSectionUnlocked(1) ? 1 : 0.45,
              pointerEvents: isSectionUnlocked(1) ? 'auto' : 'none',
            }}
          >
            {!isSectionUnlocked(1) && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Fill in patient name and a valid phone number above to continue.
              </Alert>
            )}
            <Typography variant="h6" fontWeight={700} color="primary.main">
              2. {FORM_SECTIONS[1].title}
              {mode === 'create' && visitTabs.length > 1 && activeVisitTabId && (
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({getVisitTabLabel(visitTabs.findIndex((t) => t.id === activeVisitTabId))})
                </Typography>
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {FORM_SECTIONS[1].subtitle}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <FormLabel id="device-format-label">Device Intake</FormLabel>
                  <RadioGroup
                    aria-labelledby="device-format-label"
                    name="device_format"
                    value={formData.device_format}
                    onChange={(e) => handleDeviceFormatChange(e.target.value as DeviceFormat)}
                    row
                  >
                    <FormControlLabel
                      value="piece"
                      control={<Radio />}
                      label="Single device (piece)"
                    />
                    <FormControlLabel
                      value="kit"
                      control={<Radio />}
                      label="Pair kit (2 devices sold together)"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  freeSolo
                  options={HEARING_AID_MODELS}
                  value={formData.model_item_name}
                  onChange={(event, newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      model_item_name: newValue || '',
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      fullWidth
                      label="Model/Item Name"
                      name="model_item_name"
                      onChange={(e) => {
                        // Handle direct typing in the input
                        setFormData(prev => ({
                          ...prev,
                          model_item_name: e.target.value,
                        }));
                      }}
                    />
                  )}
                  groupBy={(option) => {
                    // Group by manufacturer
                    if (option.startsWith('Signia')) return 'Signia';
                    if (option.startsWith('Phonak')) return 'Phonak';
                    if (option.startsWith('Widex')) return 'Widex';
                    if (option.startsWith('Starkey')) return 'Starkey';
                    if (option.startsWith('ReSound')) return 'ReSound';
                    if (option.startsWith('Unitron')) return 'Unitron';
                    if (option.startsWith('Oticon')) return 'Oticon';
                    if (option.startsWith('Siemens')) return 'Siemens';
                    return 'Models';
                  }}
                />
              </Grid>
              {formData.device_format === 'kit' ? (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Left Ear Serial Number"
                      name="serial_no"
                      value={formData.serial_no || ''}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Right Ear Serial Number"
                      name="serial_no_2"
                      value={formData.serial_no_2 || ''}
                      onChange={handleChange}
                    />
                  </Grid>
                </>
              ) : (
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Serial Number"
                    name="serial_no"
                    value={formData.serial_no || ''}
                    onChange={handleChange}
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  select
                  label="Warranty Status"
                  name="warranty"
                  value={formData.warranty}
                  onChange={handleChange}
                >
                  <MenuItem value="2 years warranty">2 years warranty</MenuItem>
                  <MenuItem value="3 years warranty">3 years warranty</MenuItem>
                  <MenuItem value="4 years warranty">4 years warranty</MenuItem>
                  <MenuItem value="Out of warranty">Out of warranty</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  select
                  label="Purpose"
                  name="purpose_select"
                  value={isCustomPurpose ? 'Other (please specify)' : formData.purpose}
                  onChange={handlePurposeChange}
                >
                  {repairPurposeOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              {isCustomPurpose && (
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Custom Purpose"
                    name="custom_purpose"
                    value={customPurpose}
                    onChange={handleCustomPurposeChange}
                    multiline
                    rows={3}
                  />
                </Grid>
              )}
              {formData.device_format === 'piece' ? (
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <FormLabel id="ear-label">Ear</FormLabel>
                    <RadioGroup
                      aria-labelledby="ear-label"
                      name="ear"
                      value={formData.ear || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, ear: e.target.value as EarType }))}
                      row
                    >
                      <FormControlLabel value="left" control={<Radio />} label="Left" />
                      <FormControlLabel value="right" control={<Radio />} label="Right" />
                      <FormControlLabel value="both" control={<Radio />} label="Both" />
                    </RadioGroup>
                  </FormControl>
                </Grid>
              ) : (
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
                    Pair kit includes both left and right devices.
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Mould"
                  name="mould"
                  value={formData.mould || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, mould: e.target.value as MouldType | '' }))}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="Soft Half Concha Mould">Soft Half Concha Mould</MenuItem>
                  <MenuItem value="Soft Full Concha Mould">Soft Full Concha Mould</MenuItem>
                  <MenuItem value="Hard Half Concha Mould">Hard Half Concha Mould</MenuItem>
                  <MenuItem value="Hard Full Concha Mould">Hard Full Concha Mould</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Warranty After Repair"
                  name="warranty_after_repair"
                  value={formData.warranty_after_repair || ''}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.warranty_after_repair)}
                  helperText={fieldErrors.warranty_after_repair}
                >
                  <MenuItem value="">Select Warranty</MenuItem>
                  <MenuItem value="6 months">6 months</MenuItem>
                  <MenuItem value="1 year">1 year</MenuItem>
                  <MenuItem value="None">None</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>

          {/* Section 3: Center Tracking */}
          <Box
            ref={setSectionRef(2)}
            sx={{
              opacity: isSectionUnlocked(2) ? 1 : 0.45,
              pointerEvents: isSectionUnlocked(2) ? 'auto' : 'none',
            }}
          >
            {!isSectionUnlocked(2) && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Complete all required device and repair fields above to continue.
              </Alert>
            )}
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              <Typography variant="h6" fontWeight={700} color="primary.main">
                3. {FORM_SECTIONS[2].title}
              </Typography>
              {mode === 'edit' && currentStatusStep.relevantSections.includes('Center Tracking') && (
                <Chip
                  label="Relevant for current status"
                  size="small"
                  sx={{
                    bgcolor: currentStatusStep.color + '22',
                    color: currentStatusStep.color,
                    fontWeight: 600,
                    border: `1px solid ${currentStatusStep.color}44`,
                  }}
                />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {FORM_SECTIONS[2].subtitle}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
            <CenterSelect
              label="Receiving Center"
              name="receiving_center_id"
              value={formData.receiving_center_id}
              onChange={(val) => {
                clearFieldError('receiving_center_id');
                const center = centers.find((c) => c.id === val);
                setFormData((prev) => ({
                  ...prev,
                  receiving_center_id: val,
                  receiving_center: (center?.name || '') as ReceivingCenter | '',
                }));
              }}
              required
              error={Boolean(fieldErrors.receiving_center_id)}
              helperText={fieldErrors.receiving_center_id}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Pickup center is recorded later when the device is marked{' '}
              <strong>Ready for Pickup</strong> via Log Movement on the repair detail page.
            </Typography>
          </Grid>
          {mode === 'edit' && formData.pickup_center_id && (
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Pickup Center"
                value={centers.find((c) => c.id === formData.pickup_center_id)?.name || 'Set'}
                InputProps={{ readOnly: true }}
                helperText="Set when the device was marked ready for pickup"
              />
            </Grid>
          )}
            </Grid>
          </Box>

          {/* Section 4: Financial */}
          <Box
            ref={setSectionRef(3)}
            sx={{
              opacity: isSectionUnlocked(3) ? 1 : 0.45,
              pointerEvents: isSectionUnlocked(3) ? 'auto' : 'none',
            }}
          >
            {!isSectionUnlocked(3) && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Select a receiving center above to continue to financial details.
              </Alert>
            )}
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              <Typography variant="h6" fontWeight={700} color="primary.main">
                4. {FORM_SECTIONS[3].title}
              </Typography>
              {mode === 'edit' && currentStatusStep.relevantSections.includes('Financial') && (
                <Chip
                  label="Relevant for current status"
                  size="small"
                  sx={{
                    bgcolor: currentStatusStep.color + '22',
                    color: currentStatusStep.color,
                    fontWeight: 600,
                    border: `1px solid ${currentStatusStep.color}44`,
                  }}
                />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {FORM_SECTIONS[3].subtitle}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                  <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                    Step 1 — Company Invoice
                  </Typography>
                  {mode === 'edit' && formData.status === 'Returned from Manufacturer' && (
                    <Chip
                      label="Enter now — device just returned"
                      size="small"
                      color="warning"
                      icon={<AssignmentReturnIcon style={{ fontSize: 14 }} />}
                    />
                  )}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  What the manufacturer charged Hearing Hope.
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Invoice Number"
                  name="manufacturer_invoice_number"
                  value={formData.manufacturer_invoice_number}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.manufacturer_invoice_number)}
                  helperText={fieldErrors.manufacturer_invoice_number}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Invoice Date"
                    value={formData.manufacturer_invoice_date ? dayjs(formData.manufacturer_invoice_date) : null}
                    onChange={(date: Dayjs | null) => {
                      clearFieldError('manufacturer_invoice_date');
                      setFormData((prev) => ({
                        ...prev,
                        manufacturer_invoice_date: date?.isValid() ? date.format('YYYY-MM-DD') : null,
                      }));
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: Boolean(fieldErrors.manufacturer_invoice_date),
                        helperText: fieldErrors.manufacturer_invoice_date,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="GST Rate"
                  name="manufacturer_invoice_gst_rate"
                  value={formData.manufacturer_invoice_gst_rate}
                  onChange={handleChange}
                >
                  {GST_RATE_OPTIONS.map((rate) => (
                    <MenuItem key={rate} value={rate}>{rate}%</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Company Invoice Total"
                  name="manufacturer_invoice_total"
                  value={formData.manufacturer_invoice_total ?? ''}
                  onChange={handleChange}
                  InputProps={{ inputProps: { min: 0, step: 0.01 }, startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  error={Boolean(fieldErrors.manufacturer_invoice_total)}
                  helperText={fieldErrors.manufacturer_invoice_total || 'Gross amount on the manufacturer\'s invoice'}
                />
              </Grid>
              {Number(formData.manufacturer_invoice_total) > 0 && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', height: '100%' }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Net {formatCurrency(invoiceTaxBreakdown.netValue)} + CGST {formatCurrency(invoiceTaxBreakdown.cgstAmount)} + SGST {formatCurrency(invoiceTaxBreakdown.sgstAmount)}
                    </Typography>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider />
                <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ mt: 2 }}>
                  Step 2 — Your Markup
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  How much Hearing Hope adds on top of the company invoice.
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Amount You Add"
                  name="hope_markup"
                  value={formData.hope_markup ?? ''}
                  onChange={handleMarkupChange}
                  InputProps={{ inputProps: { min: 0, step: 0.01 }, startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: '#FFF7ED', border: '2px solid #F97316' }}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                    Step 3 — Customer Pays
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
                    {formatCurrency(customerQuote)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {Number(formData.manufacturer_invoice_total) > 0
                      ? `${formatCurrency(Number(formData.manufacturer_invoice_total))} (company invoice) + ${formatCurrency(Number(formData.hope_markup) || 0)} (your add)`
                      : 'Enter company invoice and your markup above'}
                  </Typography>
                  {customerQuote > 0 && (
                    <>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Patient will see this amount for approval.
                      </Typography>
                      <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #FDBA74' }}>
                        <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                          Your repair invoice breakdown
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          Net {formatCurrency(customerQuoteTaxBreakdown.netValue)} + CGST {formatCurrency(customerQuoteTaxBreakdown.cgstAmount)} + SGST {formatCurrency(customerQuoteTaxBreakdown.sgstAmount)}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 1 }}>
                    Payment Received
                  </Typography>
                  {mode === 'edit' && (formData.status === 'Ready for Pickup' || formData.status === 'Completed') && (
                    <Chip
                      label="Confirm payment now"
                      size="small"
                      color="success"
                      icon={<CheckCircleIcon style={{ fontSize: 14 }} />}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Stack>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Amount Customer Paid"
                  name="customer_paid"
                  value={formData.customer_paid || ''}
                  onChange={handleChange}
                  InputProps={{ inputProps: { min: 0, step: 0.01 }, startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  error={Boolean(fieldErrors.customer_paid)}
                  helperText={fieldErrors.customer_paid}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="Payment Mode"
                  name="payment_mode"
                  value={formData.payment_mode || ''}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.payment_mode)}
                  helperText={fieldErrors.payment_mode}
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Card">Card</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                </TextField>
              </Grid>
              {customerQuote > 0 && (
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    select
                    label="Quote Status"
                    name="estimate_status"
                    value={formData.estimate_status || 'Pending'}
                    onChange={handleChange}
                  >
                    <MenuItem value="Pending">Pending Approval</MenuItem>
                    <MenuItem value="Approved">Approved</MenuItem>
                    <MenuItem value="Declined">Declined</MenuItem>
                    <MenuItem value="Not Required">Not Required</MenuItem>
                  </TextField>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Section 5: Notes */}
          <Box
            ref={setSectionRef(4)}
            sx={{
              opacity: isSectionUnlocked(4) ? 1 : 0.45,
              pointerEvents: isSectionUnlocked(4) ? 'auto' : 'none',
            }}
          >
            {!isSectionUnlocked(4) && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Complete the tracking section above to continue.
              </Alert>
            )}
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              <Typography variant="h6" fontWeight={700} color="primary.main">
                5. {FORM_SECTIONS[4].title}
              </Typography>
              {mode === 'edit' && currentStatusStep.relevantSections.includes('Notes') && (
                <Chip
                  label="Relevant for current status"
                  size="small"
                  sx={{
                    bgcolor: currentStatusStep.color + '22',
                    color: currentStatusStep.color,
                    fontWeight: 600,
                    border: `1px solid ${currentStatusStep.color}44`,
                  }}
                />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {FORM_SECTIONS[4].subtitle}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.programming_done}
                      onChange={(e) => setFormData(prev => ({ ...prev, programming_done: e.target.checked }))}
                      name="programming_done"
                    />
                  }
                  label="Programming Complete"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Remarks"
                  name="remarks"
                  value={formData.remarks || ''}
                  onChange={handleChange}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Box>

          {error && (
            <Box>
              <Alert 
                severity="error" 
                variant="filled" 
                sx={{ 
                  mb: 3, 
                  '& .MuiAlert-message': { 
                    fontWeight: 'medium',
                  } 
                }}
              >
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Error creating repair:
                </Typography>
                <Typography variant="body2">
                  {error}
                </Typography>
                {error.includes('duplicate key') && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    It appears this record already exists or there's a conflict with an existing entry.
                    Try using a different phone number or check if the customer already exists.
                  </Typography>
                )}
              </Alert>
            </Box>
          )}

          <Box>
            {mode === 'create' && !canSubmit && !loading && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {visitTabs.length > 1
                  ? 'Complete all required fields and review all sections in every visit tab before creating repairs.'
                  : !allMandatoryValid
                    ? 'Fill in all required fields in each section before creating the repair.'
                    : 'Scroll through all sections to review the full form before creating the repair.'}
              </Alert>
            )}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              {mode === 'edit' && (
                <Button
                  type="button"
                  variant="outlined"
                  color="error"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={loading}
                >
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="outlined"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !canSubmit}
              >
                {mode === 'create'
                  ? visitTabs.length > 1
                    ? `Create ${visitTabs.length} Repairs`
                    : 'Create Repair'
                  : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !loading && setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Repair</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this repair? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
} 