import {
  formatEarLabel,
  formatSerialNumbers,
  getDeviceFormatLabel,
  inferDeviceFormat,
} from '@/lib/device-format';
import type { RepairRecord } from '@/app/types/database';
import { INVOICE_DEFAULTS } from './invoice-template.config';

export function buildLineItemDescription(
  repair: Pick<
    RepairRecord,
    'model_item_name' | 'serial_no' | 'serial_no_2' | 'device_format' | 'ear' | 'company'
  >
): string {
  const format = inferDeviceFormat(repair);
  const serialInfo =
    format === 'kit' && repair.serial_no_2
      ? `Left: ${repair.serial_no}, Right: ${repair.serial_no_2}`
      : formatSerialNumbers(repair);
  const earInfo = formatEarLabel(repair.ear, format);
  const parts = [
    INVOICE_DEFAULTS.serviceDescription,
    repair.model_item_name,
    getDeviceFormatLabel(format),
    serialInfo ? `S/N: ${serialInfo}` : null,
    earInfo ? `Ear: ${earInfo}` : null,
    repair.company ? `Manufacturer: ${repair.company}` : null,
  ].filter(Boolean);
  return parts.join(' — ');
}
