'use client';

import { useMemo } from 'react';
import {
  Box,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import { PaymentMode, RepairStatus, WarrantyAfterRepair } from '@/app/types/database';
import CenterSelect from '@/app/components/CenterSelect';
import { calculateTaxFromInclusive, formatCurrency, GST_RATE_OPTIONS } from '@/lib/invoice-tax';
import {
  getCustomerQuoteFromTransition,
  getTransitionFieldsForStatus,
  TransitionFieldValues,
} from '@/lib/repair-stage-validation';

const STATUS_HEADINGS: Partial<Record<RepairStatus, string>> = {
  'Returned from Manufacturer': 'Manufacturer return — complete financials',
  'Ready for Pickup': 'Pickup & customer quote',
  Completed: 'Confirm payment from customer',
};

interface StageTransitionFieldsProps {
  targetStatus: RepairStatus;
  values: TransitionFieldValues;
  onChange: (values: TransitionFieldValues) => void;
  errors?: Record<string, string>;
  /** In movement dialog, pickup center is chosen separately */
  hidePickupCenter?: boolean;
}

function FinancialSummary({
  customerQuote,
  invoiceTotal,
  markup,
  customerQuoteTaxBreakdown,
}: {
  customerQuote: number;
  invoiceTotal: number;
  markup: number;
  customerQuoteTaxBreakdown: ReturnType<typeof calculateTaxFromInclusive>;
}) {
  return (
    <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: '#FFF7ED', border: '2px solid #F97316' }}>
      <Typography variant="subtitle1" fontWeight={700} color="primary.main">
        Customer Pays
      </Typography>
      <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
        {formatCurrency(customerQuote)}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {invoiceTotal > 0
          ? `${formatCurrency(invoiceTotal)} (company invoice) + ${formatCurrency(markup)} (your markup)`
          : 'Enter company invoice and your markup above'}
      </Typography>
      {customerQuote > 0 && (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Patient will see this amount for approval.
          </Typography>
          <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #FDBA74' }}>
            <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
              Your repair invoice breakdown
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              Net {formatCurrency(customerQuoteTaxBreakdown.netValue)} + CGST{' '}
              {formatCurrency(customerQuoteTaxBreakdown.cgstAmount)} + SGST{' '}
              {formatCurrency(customerQuoteTaxBreakdown.sgstAmount)}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}

export default function StageTransitionFields({
  targetStatus,
  values,
  onChange,
  errors = {},
  hidePickupCenter = false,
}: StageTransitionFieldsProps) {
  const fields = getTransitionFieldsForStatus(targetStatus);
  if (fields.length === 0) return null;

  const setField = <K extends keyof TransitionFieldValues>(
    key: K,
    value: TransitionFieldValues[K]
  ) => {
    onChange({ ...values, [key]: value });
  };

  const invoiceTotal = Number(values.manufacturer_invoice_total) || 0;
  const markup = Number(values.hope_markup) || 0;
  const gstRate = Number(values.manufacturer_invoice_gst_rate) || 18;
  const customerQuote = useMemo(() => getCustomerQuoteFromTransition(values), [values]);

  const invoiceTaxBreakdown = useMemo(
    () => calculateTaxFromInclusive(invoiceTotal, gstRate),
    [invoiceTotal, gstRate]
  );

  const customerQuoteTaxBreakdown = useMemo(
    () => calculateTaxFromInclusive(customerQuote, gstRate),
    [customerQuote, gstRate]
  );

  const showFullFinancialFlow = targetStatus === 'Returned from Manufacturer';
  const heading = STATUS_HEADINGS[targetStatus];

  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: '#FFFBEB',
        border: '1px solid #FCD34D',
      }}
    >
      {heading && (
        <>
          <Typography variant="subtitle2" fontWeight={700} color="warning.dark">
            {heading}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
            Fill in all details below to complete this step
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </>
      )}

      <Grid container spacing={2}>
        {showFullFinancialFlow && (
          <>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                Step 1 — Company Invoice
              </Typography>
              <Typography variant="caption" color="text.secondary">
                What the manufacturer charged Hearing Hope.
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                size="small"
                label="Invoice Number"
                value={values.manufacturer_invoice_number || ''}
                onChange={(e) => setField('manufacturer_invoice_number', e.target.value)}
                error={Boolean(errors.manufacturer_invoice_number)}
                helperText={errors.manufacturer_invoice_number}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Invoice Date"
                  value={values.manufacturer_invoice_date ? dayjs(values.manufacturer_invoice_date) : null}
                  onChange={(date: Dayjs | null) =>
                    setField(
                      'manufacturer_invoice_date',
                      date?.isValid() ? date.format('YYYY-MM-DD') : null
                    )
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      required: true,
                      error: Boolean(errors.manufacturer_invoice_date),
                      helperText: errors.manufacturer_invoice_date,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                size="small"
                label="GST Rate"
                value={gstRate}
                onChange={(e) => setField('manufacturer_invoice_gst_rate', Number(e.target.value))}
              >
                {GST_RATE_OPTIONS.map((rate) => (
                  <MenuItem key={rate} value={rate}>
                    {rate}%
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                size="small"
                type="number"
                label="Company Invoice Total"
                value={values.manufacturer_invoice_total ?? ''}
                onChange={(e) =>
                  setField(
                    'manufacturer_invoice_total',
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 },
                }}
                error={Boolean(errors.manufacturer_invoice_total)}
                helperText={errors.manufacturer_invoice_total || "Gross amount on manufacturer's invoice"}
              />
            </Grid>

            {invoiceTotal > 0 && (
              <Grid item xs={12} sm={4}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Net {formatCurrency(invoiceTaxBreakdown.netValue)} + CGST{' '}
                    {formatCurrency(invoiceTaxBreakdown.cgstAmount)} + SGST{' '}
                    {formatCurrency(invoiceTaxBreakdown.sgstAmount)}
                  </Typography>
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider />
              <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mt: 1.5 }}>
                Step 2 — Your Markup
              </Typography>
              <Typography variant="caption" color="text.secondary">
                How much Hearing Hope adds on top of the company invoice.
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Amount You Add"
                value={values.hope_markup ?? ''}
                onChange={(e) =>
                  setField('hope_markup', e.target.value ? Number(e.target.value) : null)
                }
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <FinancialSummary
                customerQuote={customerQuote}
                invoiceTotal={invoiceTotal}
                markup={markup}
                customerQuoteTaxBreakdown={customerQuoteTaxBreakdown}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
              <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 1 }}>
                Warranty After Repair
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                select
                size="small"
                label="Warranty After Repair"
                value={values.warranty_after_repair || ''}
                onChange={(e) =>
                  setField('warranty_after_repair', e.target.value as WarrantyAfterRepair)
                }
                error={Boolean(errors.warranty_after_repair)}
                helperText={errors.warranty_after_repair}
              >
                <MenuItem value="">Select warranty</MenuItem>
                <MenuItem value="6 months">6 months</MenuItem>
                <MenuItem value="1 year">1 year</MenuItem>
                <MenuItem value="None">None</MenuItem>
              </TextField>
            </Grid>
          </>
        )}

        {targetStatus === 'Ready for Pickup' &&
          fields.includes('pickup_center_id') &&
          !hidePickupCenter && (
          <Grid item xs={12}>
            <CenterSelect
              label="Pickup Center"
              name="pickup_center_id"
              value={values.pickup_center_id || ''}
              onChange={(val) => setField('pickup_center_id', val)}
              required
              error={Boolean(errors.pickup_center_id)}
              helperText={errors.pickup_center_id}
            />
          </Grid>
        )}

        {targetStatus === 'Ready for Pickup' && customerQuote > 0 && (
          <Grid item xs={12}>
            <FinancialSummary
              customerQuote={customerQuote}
              invoiceTotal={invoiceTotal}
              markup={markup}
              customerQuoteTaxBreakdown={customerQuoteTaxBreakdown}
            />
          </Grid>
        )}

        {targetStatus === 'Completed' && (
          <>
            {customerQuote > 0 && (
              <Grid item xs={12}>
                <Stack spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                    Customer quote for this repair
                  </Typography>
                  <FinancialSummary
                    customerQuote={customerQuote}
                    invoiceTotal={invoiceTotal}
                    markup={markup}
                    customerQuoteTaxBreakdown={customerQuoteTaxBreakdown}
                  />
                </Stack>
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider />
              <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 1 }}>
                Payment Received
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                size="small"
                type="number"
                label="Amount Customer Paid"
                value={values.customer_paid ?? ''}
                onChange={(e) =>
                  setField('customer_paid', e.target.value ? Number(e.target.value) : null)
                }
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 },
                }}
                error={Boolean(errors.customer_paid)}
                helperText={
                  errors.customer_paid ||
                  (customerQuote > 0
                    ? `Quoted amount: ${formatCurrency(customerQuote)}`
                    : undefined)
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                select
                size="small"
                label="Payment Mode"
                value={values.payment_mode || ''}
                onChange={(e) => setField('payment_mode', e.target.value as PaymentMode)}
                error={Boolean(errors.payment_mode)}
                helperText={errors.payment_mode}
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
              </TextField>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
}
