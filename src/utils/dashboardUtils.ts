// Utility functions for dashboard data processing

/**
 * Safely get the length of an array or 0 if not an array
 */
export const safeArrayLength = (data: any): number => {
  return Array.isArray(data) ? data.length : 0;
};

/**
 * Safely calculate sum from an array of objects with a specific property
 */
export const safeArraySum = (data: any[], property: string): number => {
  if (!Array.isArray(data)) return 0;
  
  return data.reduce((sum, item) => {
    const value = typeof item === 'object' && item !== null ? item[property] : 0;
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
};

/**
 * Safely count items in an array that match a condition
 */
export const safeArrayCount = (data: any[], condition: (item: any) => boolean): number => {
  if (!Array.isArray(data)) return 0;
  
  return data.filter(condition).length;
};

/**
 * Extract date from ISO string and format as YYYY-MM-DD
 */
export const extractDate = (isoString: string): string => {
  try {
    return new Date(isoString).toISOString().split('T')[0];
  } catch (error) {
    return new Date().toISOString().split('T')[0]; // fallback to today
  }
};

/**
 * Group payments by date and sum amounts
 */
export const groupPaymentsByDate = (payments: any[]): { [key: string]: number } => {
  const grouped: { [key: string]: number } = {};
  
  if (!Array.isArray(payments)) return grouped;
  
  payments.forEach((payment: any) => {
    if (!payment || typeof payment !== 'object') return;
    
    const date = extractDate(payment.createdAt || payment.date || new Date().toISOString());
    const amount = typeof payment.amount === 'number' ? payment.amount : 0;
    
    if (!grouped[date]) {
      grouped[date] = 0;
    }
    grouped[date] += amount;
  });
  
  return grouped;
};

/**
 * Process ride data to get total and active rides
 */
export const processRideData = (ridesData: any) => {
  const allRides = ridesData?.rides || ridesData || [];
  const totalRides = safeArrayLength(allRides);
  
  // Handle case where rides might not have status field or different status values
  const activeRides = safeArrayCount(
    Array.isArray(allRides) ? allRides : [], 
    (ride: any) => {
      if (!ride || typeof ride !== 'object') return false;
      
      // Check multiple possible status values (case insensitive)
      const status = typeof ride.status === 'string' ? ride.status.toUpperCase() : '';
      return status === 'ACTIVE' || status === 'IN_PROGRESS' || status === 'ONGOING';
    }
  );
  
  return { totalRides, activeRides };
};

/**
 * Process payment data to get total revenue
 */
export const processPaymentData = (paymentsData: any) => {
  const payments = paymentsData?.payments || paymentsData || [];
  const totalRevenue = safeArraySum(
    Array.isArray(payments) ? payments : [], 
    'amount'
  );
  
  return totalRevenue;
};