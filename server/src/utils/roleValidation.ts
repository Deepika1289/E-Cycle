import { IUser } from '../types/index.js';

// Define the allowed email-role mappings
const ALLOWED_ROLE_EMAILS: Record<string, string[]> = {
  'ADMIN': ['harinidevi964@gmail.com'],
  'MANAGER': ['maheshmacharla2004@gmail.com']
};

// Define existing users that should maintain their access (backward compatibility)
const EXISTING_USERS: Record<string, string> = {
  'deepikanuti@gmail.com': 'ADMIN',
  'c17682084@gmail.com': 'MANAGER'
};

/**
 * Validates if a user is allowed to have a specific role based on their email
 * @param email User's email
 * @param role Requested role
 * @returns boolean indicating if the role assignment is valid
 */
export const isRoleAssignmentValid = (email: string, role: string): boolean => {
  // Allow existing users to maintain their roles (backward compatibility)
  if (EXISTING_USERS[email] === role) {
    return true;
  }
  
  // Check if the email is in the allowed list for the requested role
  const allowedEmails = ALLOWED_ROLE_EMAILS[role];
  if (allowedEmails && allowedEmails.includes(email)) {
    return true;
  }
  
  // For USER role, any email is allowed
  if (role === 'USER') {
    return true;
  }
  
  // For ADMIN and MANAGER roles, only specific emails are allowed
  return false;
};

/**
 * Validates a user's role during authentication
 * @param user The user object
 * @returns boolean indicating if the user's role is valid
 */
export const isUserRoleValid = (user: IUser): boolean => {
  const { email, role } = user;
  
  // Allow existing users to maintain their roles (backward compatibility)
  if (EXISTING_USERS[email] === role) {
    return true;
  }
  
  // Check if the email is in the allowed list for the user's role
  const allowedEmails = ALLOWED_ROLE_EMAILS[role];
  if (allowedEmails && allowedEmails.includes(email)) {
    return true;
  }
  
  // For USER role, any email is allowed
  if (role === 'USER') {
    return true;
  }
  
  // For ADMIN and MANAGER roles, only specific emails are allowed
  return false;
};