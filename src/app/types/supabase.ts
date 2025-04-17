export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string;
          company: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          company?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          company?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      repairs: {
        Row: {
          id: string;
          repair_id: string;
          customer_id: string | null;
          status: 'Received' | 'Sent to Manufacturer' | 'Returned from Manufacturer' | 'Ready for Pickup' | 'Completed';
          patient_name: string;
          phone: string;
          company: string | null;
          product_name: string;
          model_item_name: string;
          serial_no: string;
          quantity: number;
          warranty: 'In Warranty' | 'Out of Warranty' | 'Extended Warranty';
          foc: string;
          purpose: string;
          date_of_receipt: string;
          date_out_to_manufacturer: string | null;
          date_received_from_manufacturer: string | null;
          date_out_to_customer: string | null;
          repair_estimate_by_company: number | null;
          estimate_by_us: number | null;
          customer_paid: number | null;
          payment_mode: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | null;
          programming_done: boolean;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          repair_id: string;
          customer_id?: string | null;
          status?: 'Received' | 'Sent to Manufacturer' | 'Returned from Manufacturer' | 'Ready for Pickup' | 'Completed';
          patient_name: string;
          phone: string;
          company?: string | null;
          product_name: string;
          model_item_name: string;
          serial_no: string;
          quantity?: number;
          warranty: 'In Warranty' | 'Out of Warranty' | 'Extended Warranty';
          foc: string;
          purpose: string;
          date_of_receipt?: string;
          date_out_to_manufacturer?: string | null;
          date_received_from_manufacturer?: string | null;
          date_out_to_customer?: string | null;
          repair_estimate_by_company?: number | null;
          estimate_by_us?: number | null;
          customer_paid?: number | null;
          payment_mode?: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | null;
          programming_done?: boolean;
          remarks?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          repair_id?: string;
          customer_id?: string | null;
          status?: 'Received' | 'Sent to Manufacturer' | 'Returned from Manufacturer' | 'Ready for Pickup' | 'Completed';
          patient_name?: string;
          phone?: string;
          company?: string | null;
          product_name?: string;
          model_item_name?: string;
          serial_no?: string;
          quantity?: number;
          warranty?: 'In Warranty' | 'Out of Warranty' | 'Extended Warranty';
          foc?: string;
          purpose?: string;
          date_of_receipt?: string;
          date_out_to_manufacturer?: string | null;
          date_received_from_manufacturer?: string | null;
          date_out_to_customer?: string | null;
          repair_estimate_by_company?: number | null;
          estimate_by_us?: number | null;
          customer_paid?: number | null;
          payment_mode?: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | null;
          programming_done?: boolean;
          remarks?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      repair_status: 'Received' | 'Sent to Manufacturer' | 'Returned from Manufacturer' | 'Ready for Pickup' | 'Completed';
      warranty_status: 'In Warranty' | 'Out of Warranty' | 'Extended Warranty';
      payment_mode: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer';
    };
  };
}; 