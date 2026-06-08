'use client'

import { useState, useEffect } from 'react'
import { Box, TextField, InputAdornment } from '@mui/material'
import PageShell from '@/app/components/ui/PageShell'
import ContentCard from '@/app/components/ui/ContentCard'
import { Search as SearchIcon } from '@mui/icons-material'
import { CustomersList } from './_components/CustomersList'
import { Database } from '@/app/types/supabase'
import { supabase } from '@/lib/supabase'

type Customer = Database['public']['Tables']['customers']['Row']

interface CustomerWithRepair extends Customer {
  total_visits: number;
  latest_repair?: {
    model_item_name: string;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithRepair[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchCustomers = async (query: string = '') => {
    setLoading(true)

    try {
      // First, get all customers
      let supabaseQuery = supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (query) {
        supabaseQuery = supabaseQuery.or(
          `name.ilike.%${query}%,phone.ilike.%${query}%`
        )
      }

      const { data: customersData, error: customersError } = await supabaseQuery

      if (customersError) throw customersError

      const customersWithRepairs = await Promise.all(
        (customersData || []).map(async (customer) => {
          const { data: repairData, count } = await supabase
            .from('repairs')
            .select('model_item_name', { count: 'exact' })
            .eq('customer_id', customer.id)
            .order('created_at', { ascending: false })
            .limit(1)

          return {
            ...customer,
            total_visits: count ?? 0,
            latest_repair: repairData?.[0] || undefined,
          }
        })
      )

      setCustomers(customersWithRepairs)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchCustomers()
  }, [])

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    fetchCustomers(query)
  }

  return (
    <PageShell
      title="Customers"
      subtitle="View and manage customer records"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Customers' },
      ]}
    >
      <ContentCard sx={{ mb: 3 }} noPadding>
        <Box sx={{ p: 2.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 500 }}
          />
        </Box>
      </ContentCard>
      <ContentCard noPadding>
        <CustomersList customers={customers} isLoading={loading} />
      </ContentCard>
    </PageShell>
  )
} 