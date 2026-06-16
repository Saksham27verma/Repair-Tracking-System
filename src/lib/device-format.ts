import type { DeviceFormat, Ear, RepairRecord } from '@/app/types/database';

export function inferDeviceFormat(repair: Pick<RepairRecord, 'device_format' | 'quantity' | 'serial_no_2'>): DeviceFormat {
  if (repair.device_format) return repair.device_format;
  if (repair.serial_no_2 || (repair.quantity ?? 1) >= 2) return 'kit';
  return 'piece';
}

/** Pair kit, or two single pieces (left + right) sold separately. */
export function hasDualSerialIntake(format: DeviceFormat, ear?: Ear | null): boolean {
  return format === 'kit' || (format === 'piece' && ear === 'both');
}

export function computeRepairQuantity(format: DeviceFormat, ear?: Ear | null): number {
  return hasDualSerialIntake(format, ear) ? 2 : 1;
}

export function getDeviceFormatLabel(format: DeviceFormat): string {
  return format === 'kit' ? 'Kit (Pair)' : 'Single Device';
}

export function formatSerialNumbers(
  repair: Pick<RepairRecord, 'device_format' | 'quantity' | 'serial_no' | 'serial_no_2' | 'ear'>
): string {
  const format = inferDeviceFormat(repair);
  if (hasDualSerialIntake(format, repair.ear) && repair.serial_no_2) {
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
