import { createContext, useContext, useState, ReactNode } from 'react';
import { Workgroup } from '../types/shift.types';

interface WorkgroupContextType {
    selectedWorkgroup: string;
    setSelectedWorkgroup: (workgroup: string) => void;
    workgroups: Workgroup[];
    setWorkgroups: (workgroups: Workgroup[]) => void;
}

const WorkgroupContext = createContext<WorkgroupContextType | undefined>(undefined);

export function WorkgroupProvider({ children }: { children: ReactNode }) {
    const [selectedWorkgroup, setSelectedWorkgroup] = useState('');
    const [workgroups, setWorkgroups] = useState<Workgroup[]>([]);

    return (
        <WorkgroupContext.Provider value={{
            selectedWorkgroup,
            setSelectedWorkgroup,
            workgroups,
            setWorkgroups
        }}>
            {children}
        </WorkgroupContext.Provider>
    );
}

export function useWorkgroup() {
    const context = useContext(WorkgroupContext);
    if (context === undefined) {
        throw new Error('useWorkgroup must be used within a WorkgroupProvider');
    }
    return context;
}
