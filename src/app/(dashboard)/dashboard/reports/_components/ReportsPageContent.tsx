'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/app/types/supabase';
import { Box, CircularProgress } from '@mui/material';
import ReportsCharts from './ReportsCharts';

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

  useEffect(() => {
    async function fetchReportsData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch repairs data
        const { data: repairs, error } = await supabase
          .from('repairs')
          .select('status, created_at, customer_paid, warranty, company_billing_to_hope, courier_expenses');

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
      } catch (err) {
        console.error('Error fetching reports data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while loading reports');
      } finally {
        setLoading(false);
      }
    }

    fetchReportsData();
  }, []);

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
    <Box sx={{ p: 4 }}>
      <ReportsCharts
        repairsByStatus={repairsByStatus}
        repairsByWarranty={repairsByWarranty}
        totalRevenue={totalRevenue}
        totalProfit={totalProfit}
      />
    </Box>
  );
} 