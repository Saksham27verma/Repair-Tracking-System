'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  OpenInNew as PreviewIcon,
  Refresh as ResetIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import PageShell from '@/app/components/ui/PageShell';
import ContentCard from '@/app/components/ui/ContentCard';

const RECEIPT_PLACEHOLDERS = [
  '{{LOGO_SRC}}',
  '{{COMPANY_NAME}}',
  '{{COMPANY_ADDRESS}}',
  '{{COMPANY_PHONE}}',
  '{{COMPANY_WEBSITE}}',
  '{{DOCUMENT_TYPE}}',
  '{{RECEIPT_DATE}}',
  '{{RECEIPT_NUMBER}}',
  '{{PATIENT_NAME}}',
  '{{PATIENT_CONTACT}}',
  '{{RECEIVING_CENTER}}',
  '{{WARRANTY_STATUS}}',
  '{{MANUFACTURER}}',
  '{{DEVICE_ROWS}}',
  '{{INTAKE_SUMMARY_ROWS}}',
  '{{TERMS_TITLE}}',
  '{{TERMS_ITEMS}}',
  '{{TRACKING_INSTRUCTIONS}}',
  '{{REPAIR_ID}}',
  '{{FOOTER_DISCLAIMER}}',
  '{{FOOTER_TAG}}',
];

const INVOICE_PLACEHOLDERS = [
  '{{LOGO_SRC}}',
  '{{COMPANY_NAME}}',
  '{{COMPANY_ADDRESS}}',
  '{{COMPANY_PHONE}}',
  '{{COMPANY_WEBSITE}}',
  '{{COMPANY_GSTIN}}',
  '{{COMPANY_STATE}}',
  '{{COMPANY_STATE_CODE}}',
  '{{DOCUMENT_TYPE}}',
  '{{INVOICE_NUMBER}}',
  '{{INVOICE_DATE}}',
  '{{REPAIR_ID}}',
  '{{PLACE_OF_SUPPLY}}',
  '{{BUYER_NAME}}',
  '{{BUYER_CONTACT}}',
  '{{RECEIVING_CENTER}}',
  '{{LINE_ITEMS}}',
  '{{CGST_RATE}}',
  '{{SGST_RATE}}',
  '{{NET_AMOUNT}}',
  '{{CGST_AMOUNT}}',
  '{{SGST_AMOUNT}}',
  '{{TAX_AMOUNT}}',
  '{{GROSS_AMOUNT}}',
  '{{AMOUNT_IN_WORDS}}',
  '{{PAYMENT_SECTION}}',
  '{{FOOTER_DISCLAIMER}}',
];

interface TemplateEditorProps {
  apiPath: string;
  placeholders: string[];
  previewHref: string | undefined;
  previewLabel: string;
  infoText: React.ReactNode;
}

function TemplateEditor({
  apiPath,
  placeholders,
  previewHref,
  previewLabel,
  infoText,
}: TemplateEditorProps) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiPath, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load template');
      setHtml(data.html || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
    } finally {
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      load();
    }
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(apiPath, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      toast.success('Template saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset to the default template? Your changes will be lost.')) return;
    setSaving(true);
    try {
      const res = await fetch(apiPath, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset');
      setHtml(data.html || '');
      toast.success('Template reset to default');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PreviewIcon />}
          component="a"
          href={previewHref}
          target="_blank"
          rel="noopener noreferrer"
          disabled={!previewHref}
          size="small"
        >
          {previewLabel}
        </Button>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<ResetIcon />}
          onClick={handleReset}
          disabled={saving || loading}
          size="small"
        >
          Reset Default
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving || loading}
          size="small"
        >
          {saving ? 'Saving…' : 'Save Template'}
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        {infoText}
      </Alert>

      <ContentCard title="Available Placeholders" sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          These tags are replaced with live data when generating a document.
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {placeholders.map((p) => (
            <Chip key={p} label={p} size="small" variant="outlined" />
          ))}
        </Box>
      </ContentCard>

      <ContentCard title="HTML Template">
        <TextField
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          multiline
          minRows={28}
          fullWidth
          disabled={loading}
          placeholder="Loading template…"
          sx={{
            '& .MuiInputBase-input': {
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              lineHeight: 1.5,
            },
          }}
        />
      </ContentCard>
    </Box>
  );
}

export default function TemplatesSettingsPage() {
  const [tab, setTab] = useState(0);
  const [receiptPreviewId, setReceiptPreviewId] = useState<string | null>(null);
  const [invoicePreviewId, setInvoicePreviewId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/receipt-template?sampleRepair=1', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => d.repairId && setReceiptPreviewId(d.repairId))
      .catch(() => null);

    fetch('/api/invoice-template?sampleRepair=1', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => d.repairId && setInvoicePreviewId(d.repairId))
      .catch(() => null);
  }, []);

  return (
    <PageShell
      title="Document Templates"
      subtitle="Edit the HTML templates used when generating drop-off receipts and tax invoices."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Document Templates' },
      ]}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Drop-Off Receipt" />
          <Tab label="Tax Invoice" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <TemplateEditor
          apiPath="/api/receipt-template"
          placeholders={RECEIPT_PLACEHOLDERS}
          previewHref={
            receiptPreviewId
              ? `/api/repairs/${receiptPreviewId}/receipt?format=html`
              : undefined
          }
          previewLabel="Preview Receipt"
          infoText={
            <>
              Tracking instructions use{' '}
              <strong>{'{{TRACKING_INSTRUCTIONS}}'}</strong> — patients are
              directed to log in with their phone number. Edit wording in{' '}
              <code>src/lib/receipt/receipt-template.config.ts</code> or
              replace the placeholder directly in the HTML below.
            </>
          }
        />
      )}

      {tab === 1 && (
        <TemplateEditor
          apiPath="/api/invoice-template"
          placeholders={INVOICE_PLACEHOLDERS}
          previewHref={
            invoicePreviewId
              ? `/api/repairs/${invoicePreviewId}/invoice?format=html`
              : undefined
          }
          previewLabel="Preview Invoice"
          infoText={
            <>
              Financial placeholders like{' '}
              <strong>{'{{GROSS_AMOUNT}}'}</strong>,{' '}
              <strong>{'{{CGST_AMOUNT}}'}</strong>, and{' '}
              <strong>{'{{SGST_AMOUNT}}'}</strong> are computed from the stored
              invoice snapshot. Update your real GSTIN in{' '}
              <code>src/lib/receipt/receipt-template.config.ts</code>.
            </>
          }
        />
      )}
    </PageShell>
  );
}
