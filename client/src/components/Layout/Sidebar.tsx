import { Drawer, List, ListItem, ListItemIcon, ListItemText, FormControl, InputLabel, Select, MenuItem, Box, Typography, useTheme } from '@mui/material';
import { Schedule } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import ViewDayIcon from '@mui/icons-material/ViewDay';

interface SidebarProps {
  refreshInterval: number;
  onRefreshIntervalChange: (interval: number) => void;
}

const Sidebar = ({ refreshInterval, onRefreshIntervalChange }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Check which route is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          top: '64px', // Match AppBar height
          height: 'calc(100% - 64px)', // Subtract AppBar height
          paddingLeft: 0, // No extra padding
          paddingRight: 0,
        },
      }}
    >
      <List>
        <ListItem 
          onClick={() => navigate('/')}
          selected={isActive('/')}
          sx={{ 
            cursor: 'pointer', // Show pointer cursor on hover
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.12)',
              }
            }
          }}
        >
          <ListItemIcon>
            <Schedule />
          </ListItemIcon>
          <ListItemText primary="Current Shifts" />
        </ListItem>
        <ListItem 
          onClick={() => navigate('/tabular-view')}
          selected={isActive('/tabular-view')}
          sx={{ 
            cursor: 'pointer', // Show pointer cursor on hover
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.12)',
              }
            }
          }}
        >
          <ListItemIcon>
            <ViewDayIcon />
          </ListItemIcon>
          <ListItemText primary="Tabular View" />
        </ListItem>
      </List>
      
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
          Auto Refresh
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={refreshInterval}
            onChange={(e) => onRefreshIntervalChange(Number(e.target.value))}
            sx={{
              color: 'white',
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.8)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
              '.MuiSvgIcon-root': {
                color: 'white',
              }
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: theme.palette.primary.main,
                  '& .MuiMenuItem-root': {
                    color: 'white',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    },
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.dark,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                      }
                    }
                  }
                }
              }
            }}
          >
            <MenuItem value={0}>Off</MenuItem>
            <MenuItem value={5}>Every 5 minutes</MenuItem>
            <MenuItem value={10}>Every 10 minutes</MenuItem>
            <MenuItem value={15}>Every 15 minutes</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
