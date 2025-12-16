import axios from "./axiosConfig";

/**
 * Decode JWT token to get user ID
 * @returns {string|null} User ID from token, or null if not found
 */
function getUserIdFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    // JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Decode payload (base64url)
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    
    // The user_id is in the 'sub' field
    return decoded.sub || null;
  } catch (error) {
    console.error("Error decoding JWT token:", error);
    return null;
  }
}

/**
 * Fetch top 3 recent advisor ideas
 * 
 * @returns {Promise<string[]>} Array of idea titles
 */
export async function getTop3AdvisorIdeas() {
  try {
    const response = await axios.get("/advisor_ideas/top3");
    return response.data; // Returns array of titles: ["title1", "title2", "title3"]
  } catch (error) {
    console.error("Error fetching top 3 advisor ideas:", error);
    throw error;
  }
}

/**
 * Fetch student profile (full profile includes roll_number and section)
 * 
 * @param {string} [userId] - Optional user ID. If not provided, will extract from JWT token
 * @returns {Promise<Object>} Profile object with name, gsuite_id, batch_year, current_year, skills, semester, roll_number, section
 */
export async function getStudentProfileSummary(userId = null) {
  try {
    // Get user_id from parameter or decode from JWT token
    const user_id = userId || getUserIdFromToken();
    
    if (!user_id) {
      throw new Error("User ID not found. Please log in again.");
    }

    // Use full profile endpoint to get roll_number and section
    const response = await axios.get(`/profiles/${user_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching student profile:", error);
    throw error;
  }
}

