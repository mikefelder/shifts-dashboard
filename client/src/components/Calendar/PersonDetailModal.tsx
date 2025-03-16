import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Divider, Box, Chip, Grid, IconButton, ButtonGroup } from '@mui/material';
import { Account } from '../../types/shift.types';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import SmsIcon from '@mui/icons-material/Sms';

interface PersonDetailModalProps {
  open: boolean;
  onClose: () => void;
  account: Account | null;
  isClocked?: boolean;
}

export const PersonDetailModal = ({ open, onClose, account, isClocked }: PersonDetailModalProps) => {
  if (!account) return null;
  
  console.log("Account data in modal:", account); // Debug log to verify account data

  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return 'No phone number';
    
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if we have enough digits for a US phone number
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
    
    // Return original if it doesn't match expected format
    return phone;
  };

  // Format dates in a readable way
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not specified';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }).format(date);
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ 
        sx: { borderRadius: 2, overflow: 'hidden' } 
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: 'primary.main', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BadgeIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="span">
            {account.screen_name || `${account.first_name} ${account.last_name}`}
          </Typography>
          {isClocked !== undefined && (
            <Chip 
              label={isClocked ? "Clocked In" : "Not Clocked In"} 
              color={isClocked ? "success" : "default"} 
              size="small" 
              sx={{ ml: 2 }}
              icon={isClocked ? <AccessTimeIcon /> : undefined}
            />
          )}
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Basic Information Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 2 }}>
              Basic Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                <Typography variant="body1">{account.first_name} {account.last_name}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Display Name</Typography>
                <Typography variant="body1">{account.screen_name || 'Not set'}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Mobile Phone</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SmartphoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography 
                    variant="body1" 
                    component="div"
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    {formatPhoneNumber(account.mobile_phone)}
                    {account.mobile_phone && (
                      <ButtonGroup size="small" sx={{ ml: 1 }}>
                        <Button 
                          variant="outlined" 
                          href={`tel:${account.mobile_phone}`}
                          startIcon={<PhoneIcon fontSize="small" />}
                        >
                          Call
                        </Button>
                        <Button 
                          variant="outlined" 
                          href={`sms:${account.mobile_phone}`}
                          startIcon={<SmsIcon fontSize="small" />}
                        >
                          Text
                        </Button>
                      </ButtonGroup>
                    )}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, backgroundColor: 'grey.50' }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
