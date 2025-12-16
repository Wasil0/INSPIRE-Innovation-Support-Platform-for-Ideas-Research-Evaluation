import axios from "./axiosConfig";

/**
 * Create a new chat session or resume an existing one
 * 
 * @param {string} [sessionId] - Optional session ID to resume. If not provided, creates a new session.
 * @returns {Promise<Object>} Object with session_id and history array
 */
export async function createOrResumeSession(sessionId = null) {
  try {
    const params = sessionId ? { session_id: sessionId } : {};
    const response = await axios.post("/chat/session", {}, { params });
    return response.data; // Returns { session_id, history: [{ role, content }] }
  } catch (error) {
    console.error("Error creating/resuming session:", error);
    throw error;
  }
}

/**
 * Send a message and get AI response
 * 
 * @param {string} sessionId - The session ID
 * @param {string} message - The user's message
 * @returns {Promise<Object>} Object with assistant response
 */
export async function sendMessage(sessionId, message) {
  try {
    const response = await axios.post("/chat/message", {}, {
      params: {
        session_id: sessionId,
        message: message
      }
    });
    return response.data; // Returns { assistant: "response text" }
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/**
 * Get full chat history for a session
 * 
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} Object with history array
 */
export async function getChatHistory(sessionId) {
  try {
    const response = await axios.get(`/chat/history/${sessionId}`);
    return response.data; // Returns { history: [{ role, content }] }
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
}

/**
 * List all user sessions
 * 
 * @returns {Promise<Array>} Array of session objects with session_id, created_at, and title
 */
export async function listUserSessions() {
  try {
    const response = await axios.get("/chat/sessions");
    return response.data; // Returns [{ session_id, created_at, title }]
  } catch (error) {
    console.error("Error fetching sessions:", error);
    throw error;
  }
}

