import {
  computeRepairTiming,
  computeStageAggregates,
  formatDurationMs,
  getStageDuration,
} from '@/lib/repair-timing';

describe('formatDurationMs', () => {
  it('formats days, hours, and minutes', () => {
    expect(formatDurationMs(3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)).toBe('3d 2h');
    expect(formatDurationMs(5 * 60 * 60 * 1000 + 30 * 60 * 1000)).toBe('5h 30m');
    expect(formatDurationMs(45 * 60 * 1000)).toBe('45m');
    expect(formatDurationMs(30 * 1000)).toBe('< 1m');
    expect(formatDurationMs(null)).toBe('—');
  });
});

describe('computeRepairTiming', () => {
  const now = new Date('2026-06-17T12:00:00.000Z');

  it('calculates per-stage and total duration from repair dates', () => {
    const report = computeRepairTiming(
      {
        status: 'Ready for Pickup',
        date_of_receipt: '2026-06-01T10:00:00.000Z',
        date_out_to_manufacturer: '2026-06-03T10:00:00.000Z',
        date_received_from_manufacturer: '2026-06-10T10:00:00.000Z',
        receiving_center: 'Rohini',
      },
      [],
      now
    );

    expect(getStageDuration(report, 'Received')).toBe(2 * 24 * 60 * 60 * 1000);
    expect(getStageDuration(report, 'Sent to Company for Repair')).toBe(
      7 * 24 * 60 * 60 * 1000
    );
    expect(getStageDuration(report, 'Ready for Pickup')).toBe(
      now.getTime() - new Date('2026-06-10T10:00:00.000Z').getTime()
    );
    expect(report.isComplete).toBe(false);
    expect(report.totalDurationMs).toBe(
      now.getTime() - new Date('2026-06-01T10:00:00.000Z').getTime()
    );
  });

  it('uses completed date for total when repair is done', () => {
    const report = computeRepairTiming(
      {
        status: 'Completed',
        date_of_receipt: '2026-06-01T10:00:00.000Z',
        date_out_to_manufacturer: '2026-06-03T10:00:00.000Z',
        date_received_from_manufacturer: '2026-06-10T10:00:00.000Z',
        date_out_to_customer: '2026-06-12T10:00:00.000Z',
      },
      [],
      now
    );

    expect(report.isComplete).toBe(true);
    expect(report.totalDurationMs).toBe(11 * 24 * 60 * 60 * 1000);
    expect(getStageDuration(report, 'Ready for Pickup')).toBe(2 * 24 * 60 * 60 * 1000);
  });

  it('prefers movement timestamps when movements are recorded', () => {
    const report = computeRepairTiming(
      {
        status: 'Sent to Company for Repair',
        date_of_receipt: '2026-06-01T10:00:00.000Z',
        date_out_to_manufacturer: '2026-06-05T10:00:00.000Z',
      },
      [
        {
          id: 'm1',
          repair_id: 'r1',
          movement_type: 'received',
          to_location_type: 'center',
          created_at: '2026-06-01T10:00:00.000Z',
          received_at: '2026-06-01T10:00:00.000Z',
        },
        {
          id: 'm2',
          repair_id: 'r1',
          movement_type: 'sent_to_manufacturer',
          from_location_type: 'center',
          to_location_type: 'manufacturer',
          created_at: '2026-06-02T10:00:00.000Z',
          shipped_at: '2026-06-02T10:00:00.000Z',
        },
      ],
      now
    );

    expect(getStageDuration(report, 'Received')).toBe(24 * 60 * 60 * 1000);
    expect(report.currentStatus).toBe('Sent to Company for Repair');
  });
});

describe('computeStageAggregates', () => {
  it('averages stage durations across repairs', () => {
    const reports = [
      computeRepairTiming({
        status: 'Completed',
        date_of_receipt: '2026-06-01T10:00:00.000Z',
        date_out_to_manufacturer: '2026-06-03T10:00:00.000Z',
        date_received_from_manufacturer: '2026-06-10T10:00:00.000Z',
        date_out_to_customer: '2026-06-12T10:00:00.000Z',
      }),
      computeRepairTiming({
        status: 'Completed',
        date_of_receipt: '2026-06-01T10:00:00.000Z',
        date_out_to_manufacturer: '2026-06-05T10:00:00.000Z',
        date_received_from_manufacturer: '2026-06-15T10:00:00.000Z',
        date_out_to_customer: '2026-06-17T10:00:00.000Z',
      }),
    ];

    const aggregates = computeStageAggregates(reports);
    const received = aggregates.find((item) => item.status === 'Received');

    expect(received?.sampleCount).toBe(2);
    expect(received?.averageMs).toBe(3 * 24 * 60 * 60 * 1000);
  });
});
