import axios from "./axiosConfig";

/**
 * Get all users (students) for group formation
 * 
 * @returns {Promise<Array>} Array of users with { user_id, name }
 */
export async function getAllUsers() {
  try {
    const response = await axios.get("/users");
    return response.data; // Returns [{ user_id: string, name: string }, ...]
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

/**
 * Send an invite to a student
 * 
 * @param {string} receiverId - The user_id of the student to invite
 * @returns {Promise<Object>} Response with { message, invite_id }
 */
export async function sendInvite(receiverId) {
  try {
    const response = await axios.post("/invite/", {
      receiver_id: receiverId,
    });
    return response.data; // Returns { message: string, invite_id: string }
  } catch (error) {
    console.error("Error sending invite:", error);
    // Extract error message from response
    const errorMessage = error.response?.data?.detail || error.message || "Failed to send invite";
    throw new Error(errorMessage);
  }
}

/**
 * Delete/Cancel an invite
 * 
 * @param {string} inviteId - The invite_id to delete
 * @returns {Promise<Object>} Response with { message }
 */
export async function deleteInvite(inviteId) {
  try {
    const response = await axios.delete(`/invite/${inviteId}`);
    return response.data; // Returns { message: string }
  } catch (error) {
    console.error("Error deleting invite:", error);
    const errorMessage = error.response?.data?.detail || error.message || "Failed to cancel invite";
    throw new Error(errorMessage);
  }
}

/**
 * Get all invites sent by current user
 * 
 * @returns {Promise<Array>} Array of sent invites with { invite_id, receiver, status, group_id }
 */
export async function getSentInvites() {
  try {
    const response = await axios.get("/sent-invites/me");
    // Handle case where response is a message object
    if (response.data.message && !Array.isArray(response.data)) {
      return [];
    }
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching sent invites:", error);
    return [];
  }
}

/**
 * Get current user's group members
 * 
 * @returns {Promise<Object>} Response with { group_id, is_locked, members: [{ user_id, name }], total_members }
 */
export async function getGroupMembers() {
  try {
    const response = await axios.get("/group/members");
    return response.data;
  } catch (error) {
    console.error("Error fetching group members:", error);
    // If user is not in a group, return empty structure
    if (error.response?.status === 404 || error.response?.status === 400) {
      return { members: [], is_locked: false, total_members: 0 };
    }
    throw error;
  }
}

/**
 * Get pending invites received by current user
 * 
 * @returns {Promise<Array>} Array of pending invites with { invite_id, sender, status, group_id }
 */
export async function getPendingInvites() {
  try {
    const response = await axios.get("/invites/me");
    // Handle case where response is a message object
    if (response.data.message && !Array.isArray(response.data)) {
      return [];
    }
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching pending invites:", error);
    return [];
  }
}

/**
 * Respond to an invite (accept or reject)
 * 
 * @param {string} inviteId - The invite_id to respond to
 * @param {string} action - Either "accepted" or "rejected"
 * @returns {Promise<Object>} Response with { message }
 */
export async function respondToInvite(inviteId, action) {
  try {
    const response = await axios.put("/invite/action/", {
      invite_id: inviteId,
      action: action,
    });
    return response.data; // Returns { message: string }
  } catch (error) {
    console.error("Error responding to invite:", error);
    const errorMessage = error.response?.data?.detail || error.message || `Failed to ${action} invite`;
    throw new Error(errorMessage);
  }
}

/**
 * Leave the temporary group
 * 
 * @returns {Promise<Object>} Response with { message, invites_removed }
 */
export async function leaveGroup() {
  try {
    const response = await axios.post("/group/leave");
    return response.data; // Returns { message: string, invites_removed: number }
  } catch (error) {
    console.error("Error leaving group:", error);
    const errorMessage = error.response?.data?.detail || error.message || "Failed to leave group";
    throw new Error(errorMessage);
  }
}

/**
 * Lock/Finalize the group
 * 
 * @returns {Promise<Object>} Response with { message, team_locked }
 */
export async function lockGroup() {
  try {
    const response = await axios.post("/group/lock");
    return response.data; // Returns { message: string, team_locked: boolean }
  } catch (error) {
    console.error("Error locking group:", error);
    const errorMessage = error.response?.data?.detail || error.message || "Failed to finalize group";
    throw new Error(errorMessage);
  }
}

