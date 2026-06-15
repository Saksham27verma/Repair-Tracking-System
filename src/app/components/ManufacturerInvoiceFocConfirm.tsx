'use client';

import { Alert, Checkbox, FormControlLabel, Typography } from '@mui/material';

interface ManufacturerInvoiceFocConfirmProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export default function ManufacturerInvoiceFocConfirm({
  checked,
  onChange,
  error,
}: ManufacturerInvoiceFocConfirmProps) {
  return (
    <>
      <Alert severity="info" sx={{ mb: 1 }}>
        A ₹0 company invoice means the manufacturer repaired this Free of Cost (FOC). Please
        confirm below before continuing.
      </Alert>
      <FormControlLabel
        control={
          <Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)} color="warning" />
        }
        label="I confirm this repair was done Free of Cost (FOC) by the manufacturer"
      />
      {error && (
        <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </>
  );
}

export function isExplicitZeroInvoiceTotal(total: number | null | undefined): boolean {
  return total != null && `${total}` !== '' && Number(total) === 0;
}
