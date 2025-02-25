import { Drawer, List, ListItem, ListItemIcon, ListItemText, FormControl, InputLabel, Select, MenuItem, Box, Typography, useTheme } from '@mui/material';
import { Schedule } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  refreshInterval: number;
  onRefreshIntervalChange: (interval: number) => void;
}

const Sidebar = ({ refreshInterval, onRefreshIntervalChange }: SidebarProps) => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          mt: '64px',
        },
      }}
    >
      <List>
        <ListItem button onClick={() => navigate('/')}>
          <ListItemIcon>
            <Schedule />
          </ListItemIcon>
          <ListItemText primary="Current Shift" />
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
