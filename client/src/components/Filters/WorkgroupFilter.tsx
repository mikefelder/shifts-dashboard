import { useEffect, useState } from 'react';
import { FormControl, Select, MenuItem, InputLabel, Tooltip, Badge } from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { Workgroup } from '../../types/shift.types';

interface WorkgroupFilterProps {
    selectedWorkgroup: string;
    onWorkgroupChange: (workgroup: string) => void;
    workgroups: Workgroup[];
}

export const WorkgroupFilter = ({ selectedWorkgroup, onWorkgroupChange, workgroups }: WorkgroupFilterProps) => {
    // Track whether a filter is actively applied
    const [filterActive, setFilterActive] = useState(false);
    
    // Sort workgroups alphabetically
    const sortedWorkgroups = [...workgroups].sort((a, b) => 
        a.name.localeCompare(b.name)
    );
    
    const allWorkgroups = [
        { id: '', name: 'All Workgroups' },
        ...sortedWorkgroups
    ];
    
    // Update filterActive when selectedWorkgroup changes
    useEffect(() => {
        setFilterActive(!!selectedWorkgroup); 
    }, [selectedWorkgroup]);
    
    // Find the display name for the current workgroup
    const getDisplayName = () => {
        if (!selectedWorkgroup) return 'All Workgroups';
        
        const selected = workgroups.find(wg => wg.id === selectedWorkgroup);
        return selected ? selected.name : 'All Workgroups';
    };

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
                        marginLeft: '-4px'
                    }
                },
                '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                        borderColor: filterActive ? 'white' : 'rgba(255, 255, 255, 0.5)',
                        borderWidth: filterActive ? '2px' : '1px',
                    },
                    '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.8)',
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: 'white',
                    }
                },
                '& .MuiSvgIcon-root': {
                    color: 'white',
                }
            }}
        >
            <InputLabel 
                sx={{ 
                    '&.Mui-focused': { color: 'white' },
                    '&.MuiInputLabel-shrink': {
                        transform: 'translate(14px, -6px) scale(0.75)'
                    }
                }}
            >
                Workgroup Filter
            </InputLabel>
            <Select
                value={selectedWorkgroup}
                onChange={(e) => onWorkgroupChange(e.target.value)}
                label="Workgroup"
                displayEmpty
                startAdornment={
                    <Badge 
                        color="warning" 
                        variant="dot" 
                        invisible={!filterActive} 
                        sx={{ mr: 1 }}
                    >
                        <FilterAltIcon fontSize="small" />
                    </Badge>
                }
                renderValue={() => getDisplayName()}
                MenuProps={{
                    PaperProps: {
                        sx: {
                            backgroundColor: 'white',
                            maxHeight: 400,
                            '& .MuiMenuItem-root': {
                                minHeight: '38px',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                },
                                '&.Mui-selected': {
                                    backgroundColor: 'rgba(33, 150, 243, 0.12)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(33, 150, 243, 0.18)',
                                    }
                                }
                            }
                        }
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
