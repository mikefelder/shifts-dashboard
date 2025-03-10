/**
 * Utility functions for processing shift data
 */

/**
 * Group shifts by common attributes (same shift with different people)
 * @param {Array} shifts - Array of shift objects
 * @param {Array} accounts - Array of account objects for person name lookup
 * @returns {Array} - Array of grouped shift objects
 */
const groupShiftsByAttributes = (shifts, accounts) => {
    if (!Array.isArray(shifts)) {
        console.error('Input shifts is not an array');
        return [];
    }
    
    if (!Array.isArray(accounts)) {
        console.error('Accounts list is not an array');
        return [];
    }
    
    const shiftGroups = {};
    
    shifts.forEach(shift => {
        // Skip invalid shifts
        if (!shift || typeof shift !== 'object') return;
        
        try {
            // Ensure required properties exist
            const shiftName = shift.name || 'Unnamed Shift';
            const startDate = shift.local_start_date || new Date().toISOString();
            const endDate = shift.local_end_date || new Date().toISOString();
            const workgroup = shift.workgroup || '';
            const subject = shift.subject || '';
            const location = shift.location || '';
            
            // Create a unique key for each distinct shift (excluding who is assigned)
            const shiftKey = `${shiftName}-${startDate}-${endDate}-${workgroup}-${subject}-${location}`;
            
            // Find person name from accounts if available
            let personName = "Unassigned";
            if (shift.covering_member && Array.isArray(accounts)) {
                const personAccount = accounts.find(acc => acc.id === shift.covering_member);
                if (personAccount) {
                    personName = personAccount.screen_name || `${personAccount.first_name} ${personAccount.last_name}`;
                }
            }
            
            if (!shiftGroups[shiftKey]) {
                // Create a new group with the first person
                shiftGroups[shiftKey] = {
                    ...shift,
                    assignedPeople: shift.covering_member ? [shift.covering_member] : [],
                    // Ensure clockStatuses contains explicit boolean values (never undefined)
                    clockStatuses: shift.clocked_in !== undefined ? [!!shift.clocked_in] : [false],
                    assignedPersonNames: personName !== "Unassigned" ? [personName] : []
                };
            } else {
                // Add this person to the existing group if they're not already included
                if (shift.covering_member && 
                    !shiftGroups[shiftKey].assignedPeople.includes(shift.covering_member)) {
                    shiftGroups[shiftKey].assignedPeople.push(shift.covering_member);
                    // Ensure we push an explicit boolean (never undefined)
                    shiftGroups[shiftKey].clockStatuses.push(
                        shift.clocked_in === true
                    );
                    
                    if (personName !== "Unassigned") {
                        shiftGroups[shiftKey].assignedPersonNames.push(personName);
                    }
                }
            }
        } catch (error) {
            console.error('Error processing shift:', error);
        }
    });
    
    return Object.values(shiftGroups).map(shift => {
        // Ensure these properties are always arrays, even if empty
        if (!shift.assignedPeople) shift.assignedPeople = [];
        if (!shift.clockStatuses) shift.clockStatuses = [];
        if (!shift.assignedPersonNames) shift.assignedPersonNames = [];
        return shift;
    });
};

// Make sure the function is properly exported
module.exports = {
    groupShiftsByAttributes
};
