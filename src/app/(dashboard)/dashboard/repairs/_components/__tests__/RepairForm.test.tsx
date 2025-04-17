import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RepairForm from '../RepairForm';
import { supabase } from '@/lib/supabase';

// Mock the Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn().mockResolvedValue({ data: null, error: null }),
      delete: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

describe('RepairForm', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders the form with all required fields', () => {
    render(<RepairForm />);

    // Check for required fields
    expect(screen.getByLabelText(/patient name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/model\/item name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/serial number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/warranty status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/field of concern/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/purpose/i)).toBeInTheDocument();
  });

  it('submits the form with valid data', async () => {
    const mockSupabase = {
      from: jest.fn(() => ({
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    };
    (supabase.supabase as jest.Mock).mockReturnValue(mockSupabase);

    render(<RepairForm />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/patient name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: '1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/product name/i), {
      target: { value: 'Hearing Aid X' },
    });
    fireEvent.change(screen.getByLabelText(/model\/item name/i), {
      target: { value: 'Model ABC' },
    });
    fireEvent.change(screen.getByLabelText(/serial number/i), {
      target: { value: 'SN123456' },
    });
    fireEvent.change(screen.getByLabelText(/field of concern/i), {
      target: { value: 'Not working properly' },
    });
    fireEvent.change(screen.getByLabelText(/purpose/i), {
      target: { value: 'Repair' },
    });

    // Submit the form
    fireEvent.click(screen.getByText(/create repair/i));

    // Wait for the form submission to complete
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('repairs');
    });
  });

  it('displays error message when form submission fails', async () => {
    const mockSupabase = {
      from: jest.fn(() => ({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Failed to create repair' },
        }),
      })),
    };
    (supabase.supabase as jest.Mock).mockReturnValue(mockSupabase);

    render(<RepairForm />);

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/patient name/i), {
      target: { value: 'John Doe' },
    });
    // ... fill in other required fields

    // Submit the form
    fireEvent.click(screen.getByText(/create repair/i));

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/failed to create repair/i)).toBeInTheDocument();
    });
  });

  it('handles edit mode correctly', () => {
    const mockRepair = {
      id: '123',
      repair_id: 'HA-20240315-1234',
      patient_name: 'John Doe',
      phone: '1234567890',
      product_name: 'Hearing Aid X',
      model_item_name: 'Model ABC',
      serial_no: 'SN123456',
      warranty: 'In Warranty',
      foc: 'Not working properly',
      purpose: 'Repair',
      status: 'Received',
    };

    render(<RepairForm repair={mockRepair} mode="edit" />);

    // Check if form is pre-filled with repair data
    expect(screen.getByLabelText(/patient name/i)).toHaveValue('John Doe');
    expect(screen.getByLabelText(/phone number/i)).toHaveValue('1234567890');
    expect(screen.getByLabelText(/product name/i)).toHaveValue('Hearing Aid X');
    expect(screen.getByLabelText(/model\/item name/i)).toHaveValue('Model ABC');
    expect(screen.getByLabelText(/serial number/i)).toHaveValue('SN123456');

    // Check if edit mode specific elements are present
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByText(/save changes/i)).toBeInTheDocument();
    expect(screen.getByText(/delete/i)).toBeInTheDocument();
  });
}); 