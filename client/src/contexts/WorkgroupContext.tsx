import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Workgroup } from '../types/shift.types';

// Local storage key for the selected workgroup
const STORAGE_KEY = 'hlsr-selected-workgroup';

// Define context types
interface WorkgroupContextType {
    selectedWorkgroup: string | null;
    setSelectedWorkgroup: (workgroupId: string | null) => void;
    workgroups: Workgroup[];
    setWorkgroups: (workgroups: Workgroup[]) => void;
}

// Create context with default values
const WorkgroupContext = createContext<WorkgroupContextType>({
    selectedWorkgroup: null,
    setSelectedWorkgroup: () => {},
    workgroups: [],
    setWorkgroups: () => {},
});

// Provider component that wraps app and provides context
export const WorkgroupProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    // Get saved workgroup from localStorage if available
    const getSavedWorkgroupId = (): string | null => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved;
        } catch (error) {
            console.error("Error reading from localStorage:", error);
            return null;
        }
    };

    const [selectedWorkgroup, setSelectedWorkgroupState] = useState<string | null>(getSavedWorkgroupId());
    const [workgroups, setWorkgroups] = useState<Workgroup[]>([]);

    // Custom setter that updates both state and localStorage
    const setSelectedWorkgroup = (workgroupId: string | null) => {
        try {
            // Save to localStorage
            if (workgroupId === null || workgroupId === '') {
                localStorage.removeItem(STORAGE_KEY);
            } else {
                localStorage.setItem(STORAGE_KEY, workgroupId);
            }
            
            // Update state
            setSelectedWorkgroupState(workgroupId);
            
            console.log(`Workgroup filter set to: ${workgroupId || 'All'}`);
        } catch (error) {
            console.error("Error saving to localStorage:", error);
            // Still update state even if localStorage fails
            setSelectedWorkgroupState(workgroupId);
        }
    };

    // Validate the stored workgroup exists when workgroups change
    useEffect(() => {
        if (selectedWorkgroup && workgroups.length > 0) {
            const workgroupExists = workgroups.some(wg => wg.id === selectedWorkgroup);
            
            if (!workgroupExists) {
                console.log(`Selected workgroup ${selectedWorkgroup} no longer exists, resetting filter`);
                setSelectedWorkgroup(null);
            }
        }
    }, [workgroups, selectedWorkgroup]);

    const value = {
        selectedWorkgroup,
        setSelectedWorkgroup,
        workgroups,
        setWorkgroups,
    };

    return (
        <WorkgroupContext.Provider value={value}>
            {children}
        </WorkgroupContext.Provider>
    );
};

// Custom hook for easy context use
export const useWorkgroup = () => useContext(WorkgroupContext);
