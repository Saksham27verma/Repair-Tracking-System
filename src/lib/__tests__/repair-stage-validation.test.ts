import { validateRepairForStatus } from '@/lib/repair-stage-validation';

describe('validateRepairForStatus', () => {
  it('requires manufacturer invoice fields and warranty on returned status', () => {
    const result = validateRepairForStatus('Returned from Manufacturer', {
      status: 'Returned from Manufacturer',
      patient_name: 'John Doe',
      phone: '9999999999',
      model_item_name: 'Model X',
      serial_no: 'SN-1',
      warranty: 'Out of warranty',
      purpose: 'Service',
      current_center_id: 'center-1',
      date_out_to_manufacturer: '2026-06-10T10:00:00.000Z',
      manufacturer_invoice_number: '',
      manufacturer_invoice_date: undefined,
      manufacturer_invoice_total: null,
      warranty_after_repair: undefined,
    });

    expect(result.isValid).toBe(false);
    expect(result.missingFields).toEqual(
      expect.arrayContaining([
        'manufacturer_invoice_number',
        'manufacturer_invoice_date',
        'manufacturer_invoice_total',
        'warranty_after_repair',
      ])
    );
  });

  it('allows returned status when financials and warranty are present', () => {
    const result = validateRepairForStatus('Returned from Manufacturer', {
      status: 'Returned from Manufacturer',
      patient_name: 'John Doe',
      phone: '9999999999',
      model_item_name: 'Model X',
      serial_no: 'SN-1',
      warranty: 'Out of warranty',
      purpose: 'Service',
      current_center_id: 'center-1',
      date_out_to_manufacturer: '2026-06-10T10:00:00.000Z',
      date_received_from_manufacturer: '2026-06-11T10:00:00.000Z',
      manufacturer_invoice_number: 'INV-12',
      manufacturer_invoice_date: '2026-06-11',
      manufacturer_invoice_total: 2500,
      warranty_after_repair: '6 months',
    });

    expect(result.isValid).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });

  it('requires payment details for completed status', () => {
    const result = validateRepairForStatus('Completed', {
      status: 'Completed',
      patient_name: 'John Doe',
      phone: '9999999999',
      model_item_name: 'Model X',
      serial_no: 'SN-1',
      warranty: 'Out of warranty',
      purpose: 'Service',
      current_center_id: 'center-1',
      pickup_center_id: 'center-1',
      date_out_to_manufacturer: '2026-06-10T10:00:00.000Z',
      date_out_to_customer: '',
      manufacturer_invoice_number: 'INV-12',
      manufacturer_invoice_date: '2026-06-11',
      manufacturer_invoice_total: 2500,
      warranty_after_repair: '1 year',
      customer_paid: 0,
      payment_mode: null,
    });

    expect(result.isValid).toBe(false);
    expect(result.missingFields).toEqual(
      expect.arrayContaining(['customer_paid', 'payment_mode', 'date_out_to_customer'])
    );
  });
});
