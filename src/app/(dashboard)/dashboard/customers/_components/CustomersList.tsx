'use client'

import { Database } from '@/app/types/supabase'
import { Button } from '@/components/ui/button'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Stack,
} from '@mui/material'
import { Add as AddIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Customer = Database['public']['Tables']['customers']['Row']
type Repair = Database['public']['Tables']['repairs']['Row']

interface CustomerWithRepair extends Customer {
  latest_repair?: {
    product_name: string;
  };
}

interface CustomersListProps {
  customers: CustomerWithRepair[]
  isLoading?: boolean
}

export function CustomersList({ customers, isLoading = false }: CustomersListProps) {
  const router = useRouter()

  const handleRowClick = (customerId: string) => {
    router.push(`/dashboard/customers/${customerId}`)
  }

  const exportToCSV = () => {
    // Convert customers data to CSV format
    const headers = ['Name', 'Phone', 'Latest Product']
    const csvData = customers.map(customer => [
      customer.name,
      customer.phone,
      customer.latest_repair?.product_name || '-'
    ])

    // Add headers to the beginning of the CSV data
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 4,
        }}
      >
        <Typography variant="h4">Customers</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={exportToCSV}
            disabled={isLoading || customers.length === 0}
            startIcon={<FileDownloadIcon />}
          >
            Export CSV
          </Button>
          <Button asChild>
            <Link href="/dashboard/customers/new">
              <AddIcon sx={{ mr: 1 }} />
              New Customer
            </Link>
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.100' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.100' }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.100' }}>Latest Product</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 8 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : customers.length > 0 ? (
              customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  onClick={() => handleRowClick(customer.id)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'grey.50' },
                    transition: 'background-color 0.2s',
                  }}
                >
                  <TableCell>
                    <Typography color="primary.main">{customer.name}</Typography>
                  </TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.latest_repair?.product_name || '-'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 8 }}>
                  <Typography color="text.secondary">
                    No customers found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
} 