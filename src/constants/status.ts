export const CYCLE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  BOOKED: 'BOOKED',
  IN_USE: 'IN_USE',
  MAINTENANCE: 'MAINTENANCE',
  INACTIVE: 'INACTIVE',
} as const;

export type CycleStatus = typeof CYCLE_STATUS[keyof typeof CYCLE_STATUS];


