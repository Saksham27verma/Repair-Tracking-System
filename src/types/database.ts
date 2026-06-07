export enum RepairStatus {
  RECEIVED = 'Received',
  SENT_TO_MANUFACTURER = 'Sent to Manufacturer',
  RETURNED_FROM_MANUFACTURER = 'Returned from Manufacturer',
  READY_FOR_PICKUP = 'Ready for Pickup',
  COMPLETED = 'Completed'
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