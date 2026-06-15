'use client';

import { Alert, Checkbox, FormControlLabel, Typography } from '@mui/material';

interface ZeroInvoiceConfirmProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  warranty: string;
}

export default function ZeroInvoiceConfirm({
  checked,
  onChange,
  warranty,
}: ZeroInvoiceConfirmProps) {
  return (
    <>
      <Alert severity="warning" sx={{ mb: 1.5 }}>
        This device is marked as <strong>{warranty}</strong>, but the customer invoice amount is
        ₹0. Please confirm this is intentional — for example, a goodwill or Free of Cost (FOC)
        repair for the patient.
      </Alert>
      <FormControlLabel
        control={
          <Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)} color="warning" />
        }
        label="I confirm this out-of-warranty repair should be invoiced at ₹0 (FOC / no charge to customer)"
      />
      {!checked && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          Check the box above to create a zero-amount invoice.
        </Typography>
      )}
    </>
  );
}
