/**
 * Demo API functions for Group Formation
 * 
 * These functions simulate backend API calls with artificial delays.
 * Replace these with real API calls when backend is ready.
 * 
 * Integration Notes:
 * - Use axios from @/api/axiosConfig for authenticated requests
 * - All endpoints should return consistent response shapes
 * - Handle errors appropriately in the UI
 */

// Simulate network delay
const delay = (ms = 800) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * TODO: Replace with real API call: POST /api/invite
 * 
 * Expected backend response shape:
 * {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     inviteId: string,
 *     studentId: string,
 *     status: 'invited'
 *   }
 * }
 * 
 * Example real implementation:
 * import api from '@/api/axiosConfig';
 * export const inviteStudent = async (studentId) => {
 *   const response = await api.post('/api/invite', { studentId });
 *   return response.data;
 * }
 */
export const inviteStudent = async (studentId) => {
  await delay(600);
  
  // Simulate 5% failure rate for realism
  if (Math.random() < 0.05) {
    throw new Error("Failed to send invite. Please try again.");
  }
  
  return {
    success: true,
    message: "Invite sent successfully",
    data: {
      inviteId: `inv_${Date.now()}_${studentId}`,
      studentId,
      status: "invited",
    },
  };
};

/**
 * TODO: Replace with real API call: DELETE /api/invite/:id
 * 
 * Expected backend response shape:
 * {
 *   success: boolean,
 *   message: string
 * }
 * 
 * Example real implementation:
 * import api from '@/api/axiosConfig';
 * export const cancelInvite = async (studentId) => {
 *   const response = await api.delete(`/api/invite/${studentId}`);
 *   return response.data;
 * }
 */
export const cancelInvite = async (studentId) => {
  await delay(500);
  
  // Simulate 3% failure rate
  if (Math.random() < 0.03) {
    throw new Error("Failed to cancel invite. Please try again.");
  }
  
  return {
    success: true,
    message: "Invite cancelled successfully",
  };
};

/**
 * TODO: Replace with real API call: POST /api/group/finalize
 * 
 * Expected backend request body:
 * {
 *   memberIds: string[]
 * }
 * 
 * Expected backend response shape:
 * {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     groupId: string,
 *     members: Array<{ id: string, name: string }>,
 *     finalizedAt: string
 *   }
 * }
 * 
 * Example real implementation:
 * import api from '@/api/axiosConfig';
 * export const finalizeGroup = async (memberIds) => {
 *   const response = await api.post('/api/group/finalize', { memberIds });
 *   return response.data;
 * }
 */
export const finalizeGroup = async (memberIds) => {
  await delay(1000);
  
  // Simulate 8% failure rate for finalization
  if (Math.random() < 0.08) {
    throw new Error("Failed to finalize group. Please try again.");
  }
  
  return {
    success: true,
    message: "Group finalized successfully",
    data: {
      groupId: `group_${Date.now()}`,
      members: memberIds.map((id) => ({ id, name: `Student ${id}` })),
      finalizedAt: new Date().toISOString(),
    },
  };
};

/**
 * TODO: Replace with real API call: GET /api/students
 * 
 * Expected backend response shape:
 * {
 *   success: boolean,
 *   data: Array<{
 *     id: string,
 *     name: string,
 *     email: string,
 *     status: 'free' | 'in_group',
 *     invitedByMe?: boolean
 *   }>
 * }
 * 
 * Example real implementation:
 * import api from '@/api/axiosConfig';
 * export const getStudents = async () => {
 *   const response = await api.get('/api/students');
 *   return response.data;
 * }
 */
export const getStudents = async () => {
  await delay(800);
  
  // This will be replaced with real API call
  // For now, return empty array - actual data comes from mockStudents
  return {
    success: true,
    data: [],
  };
};

