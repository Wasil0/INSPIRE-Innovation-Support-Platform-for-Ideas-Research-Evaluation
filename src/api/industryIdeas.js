import axios from "./axiosConfig";

/**
 * Get all approved industry ideas
 * 
 * @returns {Promise<Array>} Response with array of industry ideas
 */
export async function getApprovedIndustryIdeas() {
  try {
    const response = await axios.get("/industry/ideas/approved");
    return response.data; // Returns array of ApprovedIdeaResponse
  } catch (error) {
    console.error("Error fetching approved industry ideas:", error);
    throw error;
  }
}

/**
 * Mark team as interested in an industry project
 * 
 * @param {string} projectId - The industry project/idea ID
 * @returns {Promise<Object>} Response with message and team_score
 */
export async function markIndustryIdeaInterested(projectId) {
  try {
    const response = await axios.post(`/industry-projects/${projectId}/interested`);
    return response.data; // Returns { message: "Interest recorded", team_score: <float> }
  } catch (error) {
    console.error("Error marking interest in industry idea:", error);
    const errorMessage = error.response?.data?.detail || error.message || "Failed to mark interest";
    throw new Error(errorMessage);
  }
}

/**
 * Get team's interested industry projects
 * 
 * @returns {Promise<Array>} Array of industry projects the team has marked interest in
 */
export async function getMyTeamIndustryInterests() {
  try {
    const response = await axios.get("/industry-projects/team/my-interests");
    return response.data;
  } catch (error) {
    console.error("Error fetching team industry interests:", error);
    throw error;
  }
}
