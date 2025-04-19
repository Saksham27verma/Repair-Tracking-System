import { RepairStatus, EstimateStatus, WarrantyStatus, PaymentMode, Ear, CompanyType, MouldType, RepairRecord, Customer } from './database';

export interface Database {
  public: {
    Tables: {
      repairs: {
        Row: RepairRecord;
        Insert: Omit<RepairRecord, 'id' | 'created_at'> & { updated_at?: string };
        Update: Partial<Omit<RepairRecord, 'id' | 'created_at'>>;
      };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, 'id' | 'created_at' | 'updated_at'> & { updated_at?: string };
        Update: Partial<Omit<Customer, 'id' | 'created_at'>>;
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, any>;
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, any>;
        Returns: any;
      };
    };
  };
} 