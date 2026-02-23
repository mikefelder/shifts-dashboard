import { FormControl, Select, MenuItem, InputLabel } from '@mui/material';

interface WorkgroupItem {
  id: string;
  name: string;
}

interface WorkgroupFilterProps {
  selectedWorkgroup: string;
  onWorkgroupChange: (workgroup: string | null) => void;
  workgroups: WorkgroupItem[];
}

export const WorkgroupFilter = ({
  selectedWorkgroup,
  onWorkgroupChange,
  workgroups,
}: WorkgroupFilterProps) => {
  const sortedWorkgroups = [...workgroups].sort((a, b) => a.name.localeCompare(b.name));

  const allWorkgroups = [{ id: '', name: 'All Workgroups' }, ...sortedWorkgroups];

  return (
    <FormControl
      variant="outlined"
      size="small"
      sx={{
        minWidth: 200,
        '& .MuiInputLabel-root': {
          color: 'white',
          '&.MuiInputLabel-shrink': {
            backgroundColor: 'primary.main',
            padding: '0 8px',
            marginLeft: '-4px',
          },
        },
        '& .MuiOutlinedInput-root': {
          color: 'white',
          '& fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.5)',
            borderWidth: '1px',
          },
          '&:hover fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.8)',
          },
          '&.Mui-focused fieldset': {
            borderColor: 'white',
          },
        },
        '& .MuiSvgIcon-root': {
          color: 'white',
        },
      }}
    >
      <InputLabel
        sx={{
          '&.Mui-focused': { color: 'white' },
          '&.MuiInputLabel-shrink': {
            transform: 'translate(14px, -6px) scale(0.75)',
          },
        }}
      >
        Workgroup Filter
      </InputLabel>
      <Select
        value={selectedWorkgroup}
        onChange={(e) => onWorkgroupChange(e.target.value || null)}
        label="Workgroup Filter"
        displayEmpty
        defaultValue=""
        renderValue={(value) => {
          if (!value) return '';
          const selected = allWorkgroups.find((wg) => wg.id === value);
          return selected?.name || '';
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              backgroundColor: 'primary.main',
              '& .MuiMenuItem-root': {
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '&.Mui-selected': {
                  backgroundColor: 'primary.dark',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
              },
            },
          },
        }}
      >
        {allWorkgroups.map((workgroup) => (
          <MenuItem key={workgroup.id} value={workgroup.id}>
            {workgroup.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
