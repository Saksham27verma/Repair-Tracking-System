import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RepairForm from '../RepairForm';
import { getFreshSupabaseClient, generateRepairId } from '@/lib/supabase';
import { RepairRecord, RepairStatus, WarrantyStatus } from '@/app/types/database';

// Mock the utility functions
jest.mock('@/lib/supabase', () => ({
  getFreshSupabaseClient: jest.fn(),
  generateRepairId: jest.fn().mockReturnValue('HA-20240315-1234'),
}));

// Mock useAlert hook
jest.mock('@/app/components/AlertContext', () => ({
  useAlert: () => ({
    showAlert: jest.fn(),
  }),
}));

describe('RepairForm', () => {
  beforeEach(() => {
    // Set up mock for Supabase client
    const mockSupabaseClient = {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        update: jest.fn().mockResolvedValue({ data: null, error: null }),
        delete: jest.fn().mockResolvedValue({ data: null, error: null }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    };
    
    (getFreshSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders the form with all required fields', () => {
    render(<RepairForm />);

    // Check for required fields
    expect(screen.getByLabelText(/patient name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/model\/item name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/serial no/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/warranty/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/purpose/i)).toBeInTheDocument();
  });

  it('submits the form with valid data', async () => {
    const mockSupabaseClient = {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: { id: '123' }, error: null }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    };
    
    (getFreshSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    render(<RepairForm />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/patient name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/phone/i), {
      target: { value: '1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/model\/item name/i), {
      target: { value: 'Model ABC' },
    });
    fireEvent.change(screen.getByLabelText(/serial no/i), {
      target: { value: 'SN123456' },
    });
    fireEvent.change(screen.getByLabelText(/purpose/i), {
      target: { value: 'Repair' },
    });

    // Submit the form
    fireEvent.click(screen.getByText(/create repair/i));

    // Wait for the form submission to complete
    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('repairs');
    });
  });

  it('displays error message when form submission fails', async () => {
    const mockSupabaseClient = {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Failed to create repair' },
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    };
    
    (getFreshSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    render(<RepairForm />);

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/patient name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/phone/i), {
      target: { value: '1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/model\/item name/i), {
      target: { value: 'Model ABC' },
    });
    fireEvent.change(screen.getByLabelText(/serial no/i), {
      target: { value: 'SN123456' },
    });
    fireEvent.change(screen.getByLabelText(/purpose/i), {
      target: { value: 'Repair' },
    });

    // Submit the form
    fireEvent.click(screen.getByText(/create repair/i));

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/Failed to create repair/i)).toBeInTheDocument();
    });
  });

  it('handles edit mode correctly', () => {
    // Create a mockRepair object that matches the RepairRecord type
    const mockRepair: RepairRecord = {
      id: '123',
      repair_id: 'HA-20240315-1234',
      created_at: '2024-03-15T12:00:00Z',
      updated_at: '2024-03-15T12:00:00Z',
      status: 'Received' as RepairStatus,
      patient_name: 'John Doe',
      phone: '1234567890',
      model_item_name: 'Model ABC',
      serial_no: 'SN123456',
      quantity: 1,
      warranty: 'Out of warranty' as WarrantyStatus,
      purpose: 'Repair',
      date_of_receipt: '2024-03-15T12:00:00Z',
      programming_done: false
    };

    render(<RepairForm repair={mockRepair} mode="edit" />);

    // Check if form is pre-filled with repair data
    expect(screen.getByLabelText(/patient name/i)).toHaveValue('John Doe');
    expect(screen.getByLabelText(/phone/i)).toHaveValue('1234567890');
    expect(screen.getByLabelText(/model\/item name/i)).toHaveValue('Model ABC');
    expect(screen.getByLabelText(/serial no/i)).toHaveValue('SN123456');

    // Check if edit mode specific elements are present
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByText(/save changes/i)).toBeInTheDocument();
    expect(screen.getByText(/delete/i)).toBeInTheDocument();
  });
}); 