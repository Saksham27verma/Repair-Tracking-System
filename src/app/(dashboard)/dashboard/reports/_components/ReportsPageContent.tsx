'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Box, CircularProgress } from '@mui/material';
import ReportsCharts from './ReportsCharts';
import RepairTimingAnalytics from './RepairTimingAnalytics';
import PageShell from '@/app/components/ui/PageShell';
import { computeRepairTiming, RepairTimingRow } from '@/lib/repair-timing';
import { RepairStatus } from '@/app/types/database';

type RepairsByStatus = {
  name: string;
  value: number;
};

type RepairsByWarranty = {
  name: string;
  value: number;
};

export default function ReportsPageContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repairsByStatus, setRepairsByStatus] = useState<RepairsByStatus[]>([]);
  const [repairsByWarranty, setRepairsByWarranty] = useState<RepairsByWarranty[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [timingRows, setTimingRows] = useState<RepairTimingRow[]>([]);
  const [timingStatusFilter, setTimingStatusFilter] = useState('all');

  useEffect(() => {
    async function fetchReportsData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch repairs data
        const { data: repairs, error } = await supabase
          .from('repairs')
          .select(
            'id, repair_id, patient_name, status, created_at, customer_paid, warranty, company_billing_to_hope, courier_expenses, date_of_receipt, date_out_to_manufacturer, date_received_from_manufacturer, date_out_to_customer, receiving_center'
          );

        if (error) throw error;

        if (!repairs || repairs.length === 0) {
          setLoading(false);
          return;
        }

        // Process repairs by status
        const statusCounts = repairs.reduce((acc, repair) => {
          const status = repair.status;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const statusData = Object.entries(statusCounts).map(([status, count]) => ({
          name: status,
          value: count,
        }));

        // Calculate total revenue
        const revenue = repairs.reduce((sum, repair) => {
          return sum + (repair.customer_paid || 0);
        }, 0);

        // Calculate total profit (Generated from Repairs)
        const profit = repairs.reduce((sum, repair) => {
          const customerPaid = repair.customer_paid || 0;
          const companyBilling = repair.company_billing_to_hope || 0;
          const courierExpenses = repair.courier_expenses || 0;
          return sum + (customerPaid - companyBilling - courierExpenses);
        }, 0);

        // Process repairs by warranty status
        const warrantyCounts = repairs.reduce((acc, repair) => {
          const status = repair.warranty;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const warrantyData = Object.entries(warrantyCounts).map(([status, count]) => ({
          name: status,
          value: count,
        }));

        setRepairsByStatus(statusData);
        setRepairsByWarranty(warrantyData);
        setTotalRevenue(revenue);
        setTotalProfit(profit);

        setTimingRows(
          repairs.map((repair) => ({
            id: repair.id,
            repairId: repair.repair_id,
            patientName: repair.patient_name,
            receivingCenter: repair.receiving_center || '—',
            status: repair.status as RepairStatus,
            timing: computeRepairTiming(repair),
          }))
        );
      } catch (err) {
        console.error('Error fetching reports data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while loading reports');
      } finally {
        setLoading(false);
      }
    }

    fetchReportsData();
  }, []);

  const filteredTimingRows = useMemo(() => {
    if (timingStatusFilter === 'all') return timingRows;
    if (timingStatusFilter === 'completed') {
      return timingRows.filter((row) => row.timing.isComplete);
    }
    if (timingStatusFilter === 'in_progress') {
      return timingRows.filter((row) => !row.timing.isComplete);
    }
    return timingRows.filter((row) => row.status === timingStatusFilter);
  }, [timingRows, timingStatusFilter]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, color: 'error.main' }}>
        {error}
      </Box>
    );
  }

  return (
    <PageShell
      title="Reports"
      subtitle="Analytics and financial overview"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Reports' },
      ]}
    >
      <ReportsCharts
        repairsByStatus={repairsByStatus}
        repairsByWarranty={repairsByWarranty}
        totalRevenue={totalRevenue}
        totalProfit={totalProfit}
      />
      <RepairTimingAnalytics
        rows={filteredTimingRows}
        statusFilter={timingStatusFilter}
        onStatusFilterChange={setTimingStatusFilter}
      />
    </PageShell>
  );
} 