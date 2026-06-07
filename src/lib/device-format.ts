import type { DeviceFormat, Ear, RepairRecord } from '@/app/types/database';

export function inferDeviceFormat(repair: Pick<RepairRecord, 'device_format' | 'quantity' | 'serial_no_2'>): DeviceFormat {
  if (repair.device_format) return repair.device_format;
  if (repair.serial_no_2 || (repair.quantity ?? 1) >= 2) return 'kit';
  return 'piece';
}

export function getDeviceFormatLabel(format: DeviceFormat): string {
  return format === 'kit' ? 'Kit (Pair)' : 'Single Device';
}

export function formatSerialNumbers(repair: Pick<RepairRecord, 'device_format' | 'quantity' | 'serial_no' | 'serial_no_2'>): string {
  const format = inferDeviceFormat(repair);
  if (format === 'kit' && repair.serial_no_2) {
    return `Left: ${repair.serial_no} · Right: ${repair.serial_no_2}`;
  }
  return repair.serial_no;
}

export function formatEarLabel(ear?: Ear | null, format?: DeviceFormat): string | null {
  if (!ear) return null;
  if (format === 'kit') return 'Both (pair kit)';
  const labels: Record<Ear, string> = { left: 'Left', right: 'Right', both: 'Both' };
  return labels[ear];
}
