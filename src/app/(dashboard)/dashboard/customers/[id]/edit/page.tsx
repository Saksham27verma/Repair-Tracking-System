import { notFound } from 'next/navigation'
import { Box, Typography } from '@mui/material'
import { createServerClient } from '@/lib/supabase/server'
import CustomerForm from '../../_components/CustomerForm'
import { Database } from '@/app/types/supabase'

type Customer = Database['public']['Tables']['customers']['Row']

async function getCustomer(id: string): Promise<Customer | null> {
  const supabase = createServerClient()
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  return customer
}

export default async function EditCustomerPage({
  params,
}: {
  params: { id: string }
}) {
  const customer = await getCustomer(params.id)

  if (!customer) {
    notFound()
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Edit Customer
      </Typography>
      <CustomerForm customer={customer} mode="edit" />
    </Box>
  )
} 