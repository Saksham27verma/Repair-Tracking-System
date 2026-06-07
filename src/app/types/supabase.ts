import { RepairStatus, EstimateStatus, WarrantyStatus, PaymentMode, Ear, CompanyType, MouldType, RepairRecord, Customer, Center, RepairMovement } from './database';

export interface Database {
  public: {
    Tables: {
      repairs: {
        Row: RepairRecord;
        Insert: Omit<RepairRecord, 'id' | 'created_at' | 'current_center' | 'pickup_center'> & { updated_at?: string };
        Update: Partial<Omit<RepairRecord, 'id' | 'created_at' | 'current_center' | 'pickup_center'>>;
      };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, 'id' | 'created_at' | 'updated_at'> & { updated_at?: string };
        Update: Partial<Omit<Customer, 'id' | 'created_at'>>;
      };
      centers: {
        Row: Center;
        Insert: Omit<Center, 'id' | 'created_at' | 'updated_at'> & { updated_at?: string };
        Update: Partial<Omit<Center, 'id' | 'created_at'>>;
      };
      repair_movements: {
        Row: RepairMovement;
        Insert: Omit<RepairMovement, 'id' | 'created_at' | 'from_center' | 'to_center'>;
        Update: Partial<Omit<RepairMovement, 'id' | 'created_at' | 'from_center' | 'to_center'>>;
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