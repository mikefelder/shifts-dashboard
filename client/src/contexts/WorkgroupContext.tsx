import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Workgroup } from '../types/shift.types';
import { dbService } from '../services/db.service';

// Interface for the context value
interface WorkgroupContextValue {
    selectedWorkgroup: string | null;
    setSelectedWorkgroup: (workgroupId: string | null) => void;
    workgroups: Workgroup[];
    setWorkgroups: (workgroups: Workgroup[]) => void;
    isLoading: boolean;
}

// Create the context
const WorkgroupContext = createContext<WorkgroupContextValue | undefined>(undefined);

// Props for the provider component
interface WorkgroupProviderProps {
    children: ReactNode;
}

// Provider component
export const WorkgroupProvider: React.FC<WorkgroupProviderProps> = ({ children }) => {
    const [selectedWorkgroup, setSelectedWorkgroup] = useState<string | null>(null);
    const [workgroups, setWorkgroups] = useState<Workgroup[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Load workgroups from IndexedDB on mount, if available
    React.useEffect(() => {
        async function loadCachedWorkgroups() {
            setIsLoading(true);
            try {
                const cachedWorkgroups = await dbService.getAllWorkgroups();
                if (cachedWorkgroups.length > 0) {
                    console.log('Using cached workgroups from IndexedDB');
                    setWorkgroups(cachedWorkgroups);
                }
            } catch (error) {
                console.error('Failed to load cached workgroups:', error);
            } finally {
                setIsLoading(false);
            }
        }
        
        loadCachedWorkgroups();
    }, []);

    const value = {
        selectedWorkgroup,
        setSelectedWorkgroup,
        workgroups,
        setWorkgroups,
        isLoading
    };

    return (
        <WorkgroupContext.Provider value={value}>
            {children}
        </WorkgroupContext.Provider>
    );
};

// Custom hook for using the context
export const useWorkgroup = (): WorkgroupContextValue => {
    const context = useContext(WorkgroupContext);
    if (context === undefined) {
        throw new Error('useWorkgroup must be used within a WorkgroupProvider');
    }
    return context;
};
