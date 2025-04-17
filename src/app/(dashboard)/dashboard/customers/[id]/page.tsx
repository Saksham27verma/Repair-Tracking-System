import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material'
import { Edit as EditIcon } from '@mui/icons-material'
import { createServerClient } from '@/lib/supabase/server'
import { Database } from '@/app/types/supabase'

type Customer = Database['public']['Tables']['customers']['Row']
type Repair = Database['public']['Tables']['repairs']['Row']

async function getCustomerWithRepairs(id: string) {
  const supabase = createServerClient()

  const [{ data: customer }, { data: repairs }] = await Promise.all([
    supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('repairs')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!customer) {
    return null
  }

  return {
    customer,
    repairs: repairs || [],
  }
}

export default async function CustomerDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const data = await getCustomerWithRepairs(params.id)

  if (!data) {
    notFound()
  }

  const { customer, repairs } = data

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Typography variant="h4">Customer Details</Typography>
        <Button
          component={Link}
          href={`/dashboard/customers/${customer.id}/edit`}
          variant="contained"
          startIcon={<EditIcon />}
        >
          Edit Customer
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Customer Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Customer Information
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Name"
                  secondary={customer.name}
                  primaryTypographyProps={{
                    color: 'text.secondary',
                    variant: 'body2',
                  }}
                  secondaryTypographyProps={{
                    color: 'text.primary',
                    variant: 'body1',
                  }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Phone"
                  secondary={customer.phone}
                  primaryTypographyProps={{
                    color: 'text.secondary',
                    variant: 'body2',
                  }}
                  secondaryTypographyProps={{
                    color: 'text.primary',
                    variant: 'body1',
                  }}
                />
              </ListItem>
              {customer.company && (
                <ListItem>
                  <ListItemText
                    primary="Company"
                    secondary={customer.company}
                    primaryTypographyProps={{
                      color: 'text.secondary',
                      variant: 'body2',
                    }}
                    secondaryTypographyProps={{
                      color: 'text.primary',
                      variant: 'body1',
                    }}
                  />
                </ListItem>
              )}
              <ListItem>
                <ListItemText
                  primary="Customer Since"
                  secondary={new Date(customer.created_at).toLocaleDateString(
                    'en-US',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}
                  primaryTypographyProps={{
                    color: 'text.secondary',
                    variant: 'body2',
                  }}
                  secondaryTypographyProps={{
                    color: 'text.primary',
                    variant: 'body1',
                  }}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Repair History */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6" color="primary">
                Repair History
              </Typography>
              <Button
                component={Link}
                href={`/dashboard/repairs/new?customer=${customer.id}`}
                variant="outlined"
                size="small"
              >
                New Repair
              </Button>
            </Box>
            <List>
              {repairs.map((repair, index) => (
                <Box key={repair.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    component={Link}
                    href={`/dashboard/repairs/${repair.id}`}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'grey.50' },
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography variant="body1" color="primary">
                            {repair.repair_id}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              bgcolor: 'primary.main',
                              color: 'white',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                            }}
                          >
                            {repair.status}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary">
                            {repair.product_name} - {repair.model_item_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(repair.created_at).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }
                            )}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                </Box>
              ))}
              {repairs.length === 0 && (
                <ListItem>
                  <ListItemText
                    secondary="No repairs found"
                    secondaryTypographyProps={{
                      align: 'center',
                      color: 'text.secondary',
                    }}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
} 