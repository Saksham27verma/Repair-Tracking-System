'use client'

import { useState, useEffect } from 'react'
import { Box, TextField, InputAdornment } from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'
import { CustomersList } from './_components/CustomersList'
import { Database } from '@/app/types/supabase'
import { supabase } from '@/lib/supabase'

type Customer = Database['public']['Tables']['customers']['Row']

interface CustomerWithRepair extends Customer {
  latest_repair?: {
    product_name: string;
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

      // For each customer, get their latest repair
      const customersWithRepairs = await Promise.all(
        (customersData || []).map(async (customer) => {
          const { data: repairData } = await supabase
            .from('repairs')
            .select('product_name')
            .eq('customer_id', customer.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          return {
            ...customer,
            latest_repair: repairData || undefined
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
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

      <CustomersList customers={customers} isLoading={loading} />
    </Box>
  )
} 