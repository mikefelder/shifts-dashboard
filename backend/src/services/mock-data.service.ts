/**
 * Mock Data Service
 *
 * Provides realistic mock data for development and UI testing.
 * Activated via ENABLE_MOCK_DATA=true environment variable.
 *
 * Features:
 * - Realistic shift data covering various scenarios
 * - Multiple workgroups, locations, and roles
 * - Mix of clocked in/out statuses
 * - Different time windows (morning, afternoon, evening)
 * - Overlapping shifts for testing grouping
 */

import { ShiftboardShift, ShiftboardAccount, ShiftboardWorkgroup } from './shiftboard.service';

// ============================================================================
// Configuration
// ============================================================================

const MOCK_ENABLED = process.env.ENABLE_MOCK_DATA === 'true';

// ============================================================================
// Mock Data - Accounts
// ============================================================================

// Generate 40 mock accounts for larger shift assignments
const firstNames = [
  'Alice',
  'Bob',
  'Carol',
  'David',
  'Emma',
  'Frank',
  'Grace',
  'Henry',
  'Iris',
  'Jack',
  'Kate',
  'Liam',
  'Maya',
  'Noah',
  'Olivia',
  'Paul',
  'Quinn',
  'Rachel',
  'Sam',
  'Tara',
  'Uma',
  'Victor',
  'Wendy',
  'Xavier',
  'Yara',
  'Zack',
  'Ava',
  'Ben',
  'Chloe',
  'Dan',
  'Ella',
  'Finn',
  'Gina',
  'Hank',
  'Isla',
  'Jake',
  'Luna',
  'Max',
  'Nina',
  'Owen',
];
const lastNames = [
  'Anderson',
  'Baker',
  'Chen',
  'Davis',
  'Evans',
  'Foster',
  'Garcia',
  'Harris',
  'Ivanov',
  'Jones',
  'Kim',
  'Lopez',
  'Martinez',
  'Nelson',
  "O'Brien",
  'Patel',
  'Quinn',
  'Rodriguez',
  'Smith',
  'Taylor',
  'Underwood',
  'Vasquez',
  'Williams',
  'Xu',
  'Young',
  'Zhang',
  'Allen',
  'Brown',
  'Clark',
  'Diaz',
  'Edwards',
  'Fisher',
  'Green',
  'Hill',
  'Jackson',
  'King',
  'Lee',
  'Miller',
  'Nguyen',
  'Ortiz',
];

export const MOCK_ACCOUNTS: ShiftboardAccount[] = firstNames.map((firstName, idx) => {
  const lastName = lastNames[idx];
  const id = `acc-${String(idx + 1).padStart(3, '0')}`;
  const lastInitial = lastName.charAt(0);
  return {
    id,
    first_name: firstName,
    last_name: lastName,
    screen_name: `${firstName} ${lastInitial}.`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    mobile_phone: `+1-555-${String(idx + 1).padStart(4, '0')}`,
    seniority_order: String(idx + 1),
    clocked_in: Math.random() > 0.3, // Random clock-in status (70% clocked in)
  };
});

// ============================================================================
// Mock Data - Workgroups
// ============================================================================

export const MOCK_WORKGROUPS: ShiftboardWorkgroup[] = [
  {
    id: 'wg-001',
    name: 'Security Team',
    description: 'Site security and access control',
  },
  {
    id: 'wg-002',
    name: 'Medical Staff',
    description: 'First aid and medical response',
  },
  {
    id: 'wg-003',
    name: 'Operations',
    description: 'General operations and logistics',
  },
  {
    id: 'wg-004',
    name: 'Guest Services',
    description: 'Guest relations and information',
  },
];

// ============================================================================
// Mock Data - Shifts
// ============================================================================

/**
 * Generate mock shifts with 3-4 active shifts, each with 6-10 people
 * Randomizes clock-in statuses for realistic testing
 */
export function generateMockShifts(): ShiftboardShift[] {
  const now = new Date();
  const currentHour = now.getHours();

  // Helper to create ISO datetime
  const makeDateTime = (hour: number, minute: number = 0): string => {
    const d = new Date(now);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  // Helper to get random clocked-in status and time
  const getClockStatus = (shiftStartHour: number) => {
    const isClockedIn = Math.random() > 0.3; // 70% chance of being clocked in
    if (isClockedIn) {
      const minutesEarly = Math.floor(Math.random() * 10); // 0-10 minutes early
      return {
        clocked_in: true,
        clock_in_time: makeDateTime(shiftStartHour, -minutesEarly),
      };
    }
    return { clocked_in: false };
  };

  // Helper to shuffle array and take n items
  const getRandomAccounts = (count: number, usedIds: Set<string>): string[] => {
    const available = MOCK_ACCOUNTS.filter((acc) => !usedIds.has(acc.id));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, available.length));
    selected.forEach((acc) => usedIds.add(acc.id));
    return selected.map((acc) => acc.id);
  };

  const shifts: ShiftboardShift[] = [];
  const usedAccountIds = new Set<string>();

  // =========================================================================
  // Define 3-4 Shift Templates (Always Active)
  // =========================================================================

  const shiftTemplates = [
    {
      name: 'Security - Main Entrance',
      subject: 'Access Control & Monitoring',
      location: 'Main Gate',
      workgroup: 'wg-001',
      startHour: 6,
      endHour: 18,
      peopleCount: Math.floor(Math.random() * 5) + 6, // 6-10 people
    },
    {
      name: 'Operations - Equipment Management',
      subject: 'Equipment Setup & Maintenance',
      location: 'Operations Center',
      workgroup: 'wg-003',
      startHour: 7,
      endHour: 19,
      peopleCount: Math.floor(Math.random() * 5) + 6, // 6-10 people
    },
    {
      name: 'Guest Services - Information Desk',
      subject: 'Guest Assistance & Information',
      location: 'Main Hall',
      workgroup: 'wg-004',
      startHour: 8,
      endHour: 20,
      peopleCount: Math.floor(Math.random() * 5) + 6, // 6-10 people
    },
  ];

  // Randomly add a 4th shift (75% chance)
  if (Math.random() > 0.25) {
    shiftTemplates.push({
      name: 'Medical - First Aid Station',
      subject: 'Medical Response & First Aid',
      location: 'Medical Tent A',
      workgroup: 'wg-002',
      startHour: 8,
      endHour: 20,
      peopleCount: Math.floor(Math.random() * 5) + 6, // 6-10 people
    });
  }

  // =========================================================================
  // Generate Shifts with Random People Assignments
  // =========================================================================

  shiftTemplates.forEach((template, templateIdx) => {
    const accountIds = getRandomAccounts(template.peopleCount, usedAccountIds);

    accountIds.forEach((accountId, personIdx) => {
      const clockStatus = getClockStatus(template.startHour);

      shifts.push({
        id: `shift-${templateIdx + 1}-${personIdx + 1}`,
        name: template.name,
        subject: template.subject,
        location: template.location,
        workgroup: template.workgroup,
        local_start_date: makeDateTime(template.startHour, 0),
        local_end_date: makeDateTime(template.endHour, 0),
        members: [
          {
            member: accountId,
            account: accountId,
            ...clockStatus,
          },
        ],
      });
    });
  });

  return shifts;
}

// ============================================================================
// Public API
// ============================================================================

export function isMockEnabled(): boolean {
  return MOCK_ENABLED;
}

export function getMockAccounts(): ShiftboardAccount[] {
  return MOCK_ACCOUNTS;
}

export function getMockWorkgroups(): ShiftboardWorkgroup[] {
  return MOCK_WORKGROUPS;
}

export function getMockShifts(): ShiftboardShift[] {
  return generateMockShifts();
}
