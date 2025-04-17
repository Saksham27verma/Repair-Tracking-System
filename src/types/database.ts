export enum RepairStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface Customer {
  id: string;
  created_at: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
}

export interface Repair {
  id: string;
  created_at: string;
  customer_id: string;
  device_type: string;
  serial_number: string | null;
  issue_description: string;
  status: RepairStatus;
  estimated_completion: string | null;
  notes: string | null;
  cost: number | null;
  completed_at: string | null;
  delivered_at: string | null;
}

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: Customer;
        Insert: Omit<Customer, 'id' | 'created_at'>;
        Update: Partial<Omit<Customer, 'id' | 'created_at'>>;
      };
      repairs: {
        Row: Repair;
        Insert: Omit<Repair, 'id' | 'created_at'>;
        Update: Partial<Omit<Repair, 'id' | 'created_at'>>;
      };
    };
  };
} 