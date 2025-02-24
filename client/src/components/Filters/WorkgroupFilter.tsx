import { FormControl, Select, MenuItem, InputLabel } from '@mui/material';
import { Workgroup } from '../../types/shift.types';

interface WorkgroupFilterProps {
    selectedWorkgroup: string;
    onWorkgroupChange: (workgroup: string) => void;
    workgroups: Workgroup[];
}

export const WorkgroupFilter = ({ selectedWorkgroup, onWorkgroupChange, workgroups }: WorkgroupFilterProps) => {
    const filteredWorkgroups = workgroups
        .filter(wg => wg.name.includes('Information Technology'))
        .sort((a, b) => a.name.localeCompare(b.name));
    
    const allWorkgroups = [
        { id: '', name: 'All IT Workgroups' },
        ...filteredWorkgroups
    ];

    return (
        <FormControl 
            variant="outlined" 
            size="small" 
            sx={{ 
                minWidth: 200, 
                mb: 2,
                '& .MuiInputLabel-root': {
                    backgroundColor: 'white',
                    px: 0.5,
                    transform: 'translate(14px, -9px) scale(0.75) !important'
                },
                '& .MuiInputLabel-shrink': {
                    backgroundColor: 'white',
                    transform: 'translate(14px, -9px) scale(0.75) !important'
                }
            }}
        >
            <InputLabel>Workgroup</InputLabel>
            <Select
                value={selectedWorkgroup}
                onChange={(e) => onWorkgroupChange(e.target.value)}
                label="Workgroup"
                displayEmpty
                defaultValue=""
                renderValue={(value) => {
                    const selected = allWorkgroups.find(wg => wg.id === value);
                    return selected ? selected.name : 'All IT Workgroups';
                }}
                sx={{
                    '& .MuiSelect-select': {
                        color: 'text.primary',
                        fontWeight: 500
                    }
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
