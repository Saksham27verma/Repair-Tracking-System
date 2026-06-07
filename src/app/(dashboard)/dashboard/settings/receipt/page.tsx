'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
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

const PLACEHOLDERS = [
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

export default function ReceiptTemplateSettingsPage() {
  const [html, setHtml] = useState('');
  const [previewRepairId, setPreviewRepairId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/receipt-template', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load template');
      }
      setHtml(data.html || '');

      const sampleResponse = await fetch('/api/receipt-template?sampleRepair=1', {
        cache: 'no-store',
      }).catch(() => null);
      if (sampleResponse?.ok) {
        const sampleData = await sampleResponse.json();
        if (sampleData.repairId) {
          setPreviewRepairId(sampleData.repairId);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/receipt-template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save template');
      }
      toast.success('Receipt template saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset the receipt template to the default version?')) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/receipt-template', { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset template');
      }
      setHtml(data.html || '');
      toast.success('Receipt template reset to default');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Receipt Template"
      subtitle="Edit the HTML receipt layout and wording. Use Preview HTML to see the exact layout. PDF downloads use the same data, logo, and tracking instructions."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Receipt Template' },
      ]}
      actions={
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            component="a"
            href={
              previewRepairId
                ? `/api/repairs/${previewRepairId}/receipt?format=html`
                : undefined
            }
            target="_blank"
            rel="noopener noreferrer"
            disabled={!previewRepairId}
          >
            Preview HTML
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<ResetIcon />}
            onClick={handleReset}
            disabled={saving || loading}
          >
            Reset Default
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? 'Saving…' : 'Save Template'}
          </Button>
        </Stack>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        Tracking instructions use <strong>{'{{TRACKING_INSTRUCTIONS}}'}</strong> and tell patients to
        ask staff for the tracking link and log in with their phone number. Edit wording in{' '}
        <code>src/lib/receipt/receipt-template.config.ts</code> or replace the placeholder directly
        in the HTML below.
      </Alert>

      <ContentCard title="Available Placeholders" sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Keep these tags in the template. They are replaced with live repair data when generating a
          receipt preview or PDF.
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {PLACEHOLDERS.map((placeholder) => (
            <Chip key={placeholder} label={placeholder} size="small" variant="outlined" />
          ))}
        </Box>
      </ContentCard>

      <ContentCard title="HTML Template">
        <TextField
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          multiline
          minRows={24}
          fullWidth
          disabled={loading}
          placeholder="Loading receipt template…"
          sx={{
            '& .MuiInputBase-input': {
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              lineHeight: 1.5,
            },
          }}
        />
      </ContentCard>
    </PageShell>
  );
}
