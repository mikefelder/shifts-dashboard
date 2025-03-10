require('dotenv').config();

// Test importing the utility function
try {
    const { groupShiftsByAttributes } = require('./src/utils/shift.utils');
    
    console.log('Function exists:', typeof groupShiftsByAttributes === 'function');
    
    // Test with some sample data
    const sampleShifts = [
        {
            id: '1',
            name: 'Shift 1',
            local_start_date: '2023-01-01T09:00:00',
            local_end_date: '2023-01-01T17:00:00',
            workgroup: 'Group A',
            subject: 'Testing',
            location: 'Room 101',
            covering_member: 'user1',
            clocked_in: true
        },
        {
            id: '2',
            name: 'Shift 1', // Same shift, different person
            local_start_date: '2023-01-01T09:00:00',
            local_end_date: '2023-01-01T17:00:00',
            workgroup: 'Group A',
            subject: 'Testing',
            location: 'Room 101',
            covering_member: 'user2',
            clocked_in: false
        }
    ];
    
    const accounts = [
        { id: 'user1', first_name: 'John', last_name: 'Doe', screen_name: 'JDoe' },
        { id: 'user2', first_name: 'Jane', last_name: 'Smith', screen_name: 'JSmith' }
    ];
    
    const result = groupShiftsByAttributes(sampleShifts, accounts);
    console.log('Test grouping result:', JSON.stringify(result, null, 2));
} catch (error) {
    console.error('Error testing shift utils:', error);
}
