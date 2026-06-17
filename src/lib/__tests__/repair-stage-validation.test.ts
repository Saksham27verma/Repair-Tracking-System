import {
  validateRepairForStatus,
  validateTransitionFields,
  buildRepairUpdatesFromTransition,
} from '@/lib/repair-stage-validation';

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

  it('allows zero company invoice when FOC is confirmed', () => {
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
      manufacturer_invoice_number: 'FOC',
      manufacturer_invoice_date: '2026-06-11',
      manufacturer_invoice_total: 0,
      manufacturer_invoice_is_foc: true,
      warranty_after_repair: '6 months',
    });

    expect(result.isValid).toBe(true);
  });

  it('blocks zero company invoice without FOC confirmation', () => {
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
      manufacturer_invoice_number: 'INV-0',
      manufacturer_invoice_date: '2026-06-11',
      manufacturer_invoice_total: 0,
      manufacturer_invoice_is_foc: false,
      warranty_after_repair: '6 months',
    });

    expect(result.isValid).toBe(false);
  });

  it('allows ready for pickup even when estimate was pending (approval happens before return)', () => {
    const result = validateRepairForStatus('Ready for Pickup', {
      status: 'Ready for Pickup',
      patient_name: 'John Doe',
      phone: '9999999999',
      model_item_name: 'Model X',
      serial_no: 'SN-1',
      warranty: 'Out of warranty',
      purpose: 'Service',
      current_center_id: 'center-1',
      pickup_center_id: 'center-1',
      date_out_to_manufacturer: '2026-06-10T10:00:00.000Z',
      manufacturer_invoice_number: 'INV-12',
      manufacturer_invoice_date: '2026-06-11',
      manufacturer_invoice_total: 2500,
      warranty_after_repair: '1 year',
      repair_estimate_by_company: 3000,
      estimate_status: 'Pending',
    });

    expect(result.isValid).toBe(true);
  });

  it('allows ready for pickup when estimate is approved', () => {
    const result = validateRepairForStatus('Ready for Pickup', {
      status: 'Ready for Pickup',
      patient_name: 'John Doe',
      phone: '9999999999',
      model_item_name: 'Model X',
      serial_no: 'SN-1',
      warranty: 'Out of warranty',
      purpose: 'Service',
      current_center_id: 'center-1',
      pickup_center_id: 'center-1',
      date_out_to_manufacturer: '2026-06-10T10:00:00.000Z',
      manufacturer_invoice_number: 'INV-12',
      manufacturer_invoice_date: '2026-06-11',
      manufacturer_invoice_total: 2500,
      warranty_after_repair: '1 year',
      repair_estimate_by_company: 3000,
      estimate_status: 'Approved',
    });

    expect(result.isValid).toBe(true);
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

  it('allows completed status for FOC repairs without payment details', () => {
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
      date_out_to_customer: '2026-06-17T10:00:00.000Z',
      manufacturer_invoice_number: 'FOC',
      manufacturer_invoice_date: '2026-06-11',
      manufacturer_invoice_total: 0,
      manufacturer_invoice_is_foc: true,
      warranty_after_repair: '6 months',
      estimate_by_us: 0,
      repair_estimate_by_company: null,
      customer_paid: null,
      payment_mode: null,
    });

    expect(result.isValid).toBe(true);
    expect(result.missingFields).not.toContain('customer_paid');
    expect(result.missingFields).not.toContain('payment_mode');
  });
});

describe('validateTransitionFields', () => {
  it('accepts destination center when device is at manufacturer', () => {
    const result = validateTransitionFields(
      'Returned from Manufacturer',
      {
        manufacturer_invoice_number: 'INV-12',
        manufacturer_invoice_date: '2026-06-11',
        manufacturer_invoice_total: 2500,
        warranty_after_repair: '6 months',
      },
      {
        patient_name: 'John Doe',
        phone: '9999999999',
        model_item_name: 'Model X',
        serial_no: 'SN-1',
        warranty: 'Out of warranty',
        purpose: 'Service',
        date_out_to_manufacturer: '2026-06-10T10:00:00.000Z',
        current_center_id: 'center-1',
        receiving_center_id: 'center-1',
      }
    );

    expect(result.isValid).toBe(true);
    expect(result.missingFields).not.toContain('receiving_center_id');
  });

  it('validates ready for pickup without re-requiring manufacturer fields from prior step', () => {
    const result = validateTransitionFields(
      'Ready for Pickup',
      { pickup_center_id: 'center-1' },
      {
        patient_name: 'John Doe',
        phone: '9999999999',
        model_item_name: 'Model X',
        serial_no: 'SN-1',
        warranty: 'Out of warranty',
        purpose: 'Service',
        current_center_id: 'center-1',
        date_out_to_manufacturer: '2026-06-10T10:00:00.000Z',
        manufacturer_invoice_number: 'INV-12',
        manufacturer_invoice_date: '2026-06-11',
        manufacturer_invoice_total: 2500,
        warranty_after_repair: '1 year',
        repair_estimate_by_company: 3000,
        estimate_status: 'Approved',
      }
    );

    expect(result.isValid).toBe(true);
    expect(result.missingFields).not.toContain('manufacturer_invoice_number');
  });

  it('only applies pickup center updates when transitioning to ready for pickup', () => {
    const updates = buildRepairUpdatesFromTransition(
      {
        manufacturer_invoice_number: '',
        manufacturer_invoice_total: null,
        pickup_center_id: 'center-1',
      },
      'Ready for Pickup'
    );

    expect(updates).toEqual({ pickup_center_id: 'center-1' });
  });

  it('blocks return from manufacturer when estimate approval is pending', () => {
    const result = validateTransitionFields(
      'Returned from Manufacturer',
      {},
      {
        patient_name: 'John Doe',
        phone: '9999999999',
        model_item_name: 'Model X',
        serial_no: 'SN-1',
        warranty: 'Out of warranty',
        purpose: 'Service',
        current_center_id: 'center-1',
        date_out_to_manufacturer: '2026-06-10T10:00:00.000Z',
        repair_estimate_by_company: 3000,
        estimate_status: 'Pending',
      }
    );

    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain('estimate_approval');
  });

  it('allows return from manufacturer when estimate was declined (no invoice required)', () => {
    const result = validateTransitionFields(
      'Returned from Manufacturer',
      {},
      {
        patient_name: 'John Doe',
        phone: '9999999999',
        model_item_name: 'Model X',
        serial_no: 'SN-1',
        warranty: 'Out of warranty',
        purpose: 'Service',
        current_center_id: 'center-1',
        date_out_to_manufacturer: '2026-06-10T10:00:00.000Z',
        repair_estimate_by_company: 3000,
        estimate_status: 'Declined',
      }
    );

    expect(result.isValid).toBe(true);
    expect(result.missingFields).not.toContain('manufacturer_invoice_number');
  });

  it('allows return from manufacturer when estimate is approved with invoice details', () => {
    const result = validateTransitionFields(
      'Returned from Manufacturer',
      {
        manufacturer_invoice_number: 'INV-12',
        manufacturer_invoice_date: '2026-06-11',
        manufacturer_invoice_total: 2500,
        warranty_after_repair: '1 year',
      },
      {
        patient_name: 'John Doe',
        phone: '9999999999',
        model_item_name: 'Model X',
        serial_no: 'SN-1',
        warranty: 'Out of warranty',
        purpose: 'Service',
        current_center_id: 'center-1',
        date_out_to_manufacturer: '2026-06-10T10:00:00.000Z',
        repair_estimate_by_company: 3000,
        estimate_status: 'Approved',
      }
    );

    expect(result.isValid).toBe(true);
  });

  it('allows completing FOC repair with only completion date', () => {
    const result = validateTransitionFields(
      'Completed',
      { date_out_to_customer: '2026-06-17T10:00:00.000Z' },
      {
        patient_name: 'John Doe',
        phone: '9999999999',
        model_item_name: 'Model X',
        serial_no: 'SN-1',
        warranty: 'Out of warranty',
        purpose: 'Service',
        current_center_id: 'center-1',
        pickup_center_id: 'center-1',
        date_out_to_manufacturer: '2026-06-10T10:00:00.000Z',
        manufacturer_invoice_number: 'FOC',
        manufacturer_invoice_date: '2026-06-11',
        manufacturer_invoice_total: 0,
        manufacturer_invoice_is_foc: true,
        warranty_after_repair: '6 months',
        estimate_by_us: 0,
        repair_estimate_by_company: null,
      }
    );

    expect(result.isValid).toBe(true);
    expect(result.missingFields).not.toContain('customer_paid');
    expect(result.missingFields).not.toContain('payment_mode');
  });

  it('auto-sets zero customer payment when completing FOC repair', () => {
    const updates = buildRepairUpdatesFromTransition(
      { date_out_to_customer: '2026-06-17T10:00:00.000Z' },
      'Completed',
      {
        manufacturer_invoice_total: 0,
        estimate_by_us: 0,
        repair_estimate_by_company: null,
        manufacturer_invoice_is_foc: true,
      }
    );

    expect(updates.customer_paid).toBe(0);
    expect(updates.payment_mode).toBeNull();
  });
});
