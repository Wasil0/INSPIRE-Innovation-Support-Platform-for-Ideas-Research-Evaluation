import axios from "./axiosConfig";

/**
 * Get advisor ideas with pagination, filtering, and sorting
 * 
 * @param {Object} params - Query parameters
 * @param {string} [params.advisor_id] - Filter by advisor ID
 * @param {string} [params.sort] - Sort option: "az" or "za"
 * @param {number} [params.page=1] - Page number (1-indexed)
 * @param {number} [params.limit=10] - Items per page (1-50)
 * @returns {Promise<Object>} Response with ideas array and pagination info
 */
export async function getAdvisorIdeas({ advisor_id = null, sort = null, page = 1, limit = 10 } = {}) {
  try {
    const params = {
      page,
      limit,
    };
    
    if (advisor_id) {
      params.advisor_id = advisor_id;
    }
    
    if (sort) {
      params.sort = sort;
    }
    
    const response = await axios.get("/advisor_ideas", { params });
    return response.data; // Returns { page, limit, total, pages, ideas: [...] }
  } catch (error) {
    console.error("Error fetching advisor ideas:", error);
    throw error;
  }
}

/**
 * Mark team as interested in an advisor project
 * 
 * @param {string} projectId - The project/idea ID
 * @returns {Promise<Object>} Response with message and team_score
 */
export async function markInterested(projectId) {
  try {
    const response = await axios.post(`/advisor-projects/${projectId}/interested`);
    return response.data; // Returns { message: "Interest recorded", team_score: <float> }
  } catch (error) {
    console.error("Error marking interest:", error);
    const errorMessage = error.response?.data?.detail || error.message || "Failed to mark interest";
    throw new Error(errorMessage);
  }
}

/**
 * Get flowchart image URL
 * 
 * @param {string} imageId - The GridFS image ID
 * @returns {string} Image URL
 */
export function getFlowchartImageUrl(imageId) {
  if (!imageId) return null;
  return `http://127.0.0.1:8000/advisor_ideas/image/${imageId}`;
}

/**
 * Get team's interested projects
 * 
 * @returns {Promise<Array>} Array of projects the team has marked interest in
 */
export async function getMyTeamInterests() {
  try {
    const response = await axios.get("/advisor-projects/team/my-interests");
    return response.data; // Returns [{ project_id, advisor_id, team_score, ... }]
  } catch (error) {
    console.error("Error fetching team interests:", error);
    throw error;
  }
}

