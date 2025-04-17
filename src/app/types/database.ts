export type RepairStatus =
  | 'Received'
  | 'Sent to Manufacturer'
  | 'Returned from Manufacturer'
  | 'Ready for Pickup'
  | 'Completed';

export type WarrantyStatus = 'In Warranty' | 'Out of Warranty' | 'Extended Warranty';

export type PaymentMode = 'Cash' | 'Card' | 'UPI' | 'Bank Transfer';

export interface RepairRecord {
  id: string;
  repair_id: string;
  created_at: string;
  updated_at: string;
  status: RepairStatus;
  
  // Customer Information
  patient_name: string;
  phone: string;
  company?: string;
  
  // Product Information
  product_name: string;
  model_item_name: string;
  serial_no: string;
  quantity: number;
  warranty: WarrantyStatus;
  foc: string; // Field of Concern
  purpose: string;
  
  // Dates
  date_of_receipt: string;
  date_out_to_manufacturer?: string;
  date_received_from_manufacturer?: string;
  date_out_to_customer?: string;
  
  // Financial Information
  repair_estimate_by_company?: number;
  estimate_by_us?: number;
  customer_paid?: number;
  payment_mode?: PaymentMode;
  
  // Additional Information
  programming_done?: boolean;
  remarks?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  company?: string;
  created_at: string;
  updated_at: string;
  repairs?: RepairRecord[];
}

export interface DashboardStats {
  active_repairs: number;
  awaiting_manufacturer: number;
  ready_for_pickup: number;
  completed_repairs: number;
  overdue_repairs: number;
} 