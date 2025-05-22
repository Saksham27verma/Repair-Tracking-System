'use client';

import { Box, Typography } from '@mui/material';
import RepairForm from '../../_components/RepairForm';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

async function getRepair(id: string) {
  const { data: repair, error } = await supabase
    .from('repairs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !repair) {
    return null;
  }

  return repair;
}

export default async function EditRepairPage({
  params,
}: {
  params: { id: string };
}) {
  const repair = await getRepair(params.id);

  if (!repair) {
    notFound();
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Edit Repair
      </Typography>
      <RepairForm repair={repair} mode="edit" />
    </Box>
  );
} 