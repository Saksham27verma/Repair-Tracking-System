'use client';

import { useState } from 'react';
import { 
  Box, 
  Fab, 
  Zoom, 
  Tooltip, 
  SpeedDial, 
  SpeedDialAction, 
  SpeedDialIcon,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  HelpOutline as HelpIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface HelpSupportButtonProps {
  phoneNumber?: string;
  email?: string;
}

export default function HelpSupportButton({ 
  phoneNumber = '+919811168046', 
  email = 'hearinghope@gmail.com' 
}: HelpSupportButtonProps) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const actions = [
    { 
      icon: <PhoneIcon />, 
      name: 'Call Us', 
      tooltip: `Call: ${phoneNumber}`,
      onClick: () => window.location.href = `tel:${phoneNumber}`
    },
    { 
      icon: <EmailIcon />, 
      name: 'Email Us', 
      tooltip: `Email: ${email}`,
      onClick: () => window.location.href = `mailto:${email}`
    },
  ];

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 16, sm: 24 },
        right: { xs: 16, sm: 24 },
        zIndex: 1000,
      }}
    >
      <SpeedDial
        ariaLabel="Help and Support"
        icon={<SpeedDialIcon icon={<HelpIcon />} openIcon={<CloseIcon />} />}
        onClose={handleClose}
        onOpen={handleOpen}
        open={open}
        direction="up"
        FabProps={{
          sx: {
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          },
        }}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={
              <Box sx={{ p: 1 }}>
                <Typography variant="body2">{action.tooltip}</Typography>
              </Box>
            }
            tooltipOpen={isMobile}
            onClick={() => {
              action.onClick();
              handleClose();
            }}
          />
        ))}
      </SpeedDial>
    </Box>
  );
} 