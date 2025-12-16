import axios from "./axiosConfig";

/**
 * Fetch current advisor's information (name, committee member status, etc.)
 * 
 * @returns {Promise<Object>} Advisor object with advisor_id, name, gsuite_id, committee_member
 */
export async function getAdvisorInfo() {
  try {
    const response = await axios.get("/advisors/me");
    return response.data; // Returns { advisor_id, name, gsuite_id, committee_member }
  } catch (error) {
    console.error("Error fetching advisor info:", error);
    throw error;
  }
}

/**
 * Post a new FYDP idea by advisor
 * 
 * @param {Object} ideaData - Idea data object
 * @param {string} ideaData.title - Idea title
 * @param {string} ideaData.description - Idea description
 * @param {string} ideaData.flow_explanation - Flow explanation
 * @param {string} ideaData.domain - Comma-separated domain values
 * @param {string} ideaData.skills_required - Comma-separated skills
 * @param {string} ideaData.advisor_id - Advisor ID
 * @param {File} imageFile - Optional flowchart image file
 * @returns {Promise<Object>} Response with fyp_idea_id and flowchart_image_id
 */
export async function postAdvisorIdea(ideaData, imageFile = null) {
  try {
    const formData = new FormData();
    
    // Append form fields - FastAPI expects individual form fields
    formData.append("title", ideaData.title);
    formData.append("description", ideaData.description);
    formData.append("flow_explanation", ideaData.flow_explanation);
    formData.append("domain", ideaData.domain);
    formData.append("skills_required", ideaData.skills_required);
    formData.append("source_type", ideaData.source_type);
    
    // Append advisor_id or industry_name based on source_type
    if (ideaData.source_type === "advisor") {
      formData.append("advisor_id", ideaData.advisor_id || "");
      formData.append("industry_name", ""); // Empty for advisor
    } else {
      formData.append("advisor_id", ""); // Empty for industry
      formData.append("industry_name", ideaData.industry_name || "");
    }
    
    // Append image if provided
    if (imageFile) {
      formData.append("flowchart_image", imageFile);
    }
    
    const response = await axios.post("/advisor_ideas", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return response.data;
  } catch (error) {
    console.error("Error posting advisor idea:", error);
    throw error;
  }
}

/**
 * Get all teams interested in advisor's projects (sorted by recent activity)
 * 
 * @returns {Promise<Array>} Array of interested teams with project_id, team_id, team_score, etc.
 */
export async function getAdvisorInterestedTeams() {
  try {
    const response = await axios.get("/advisor-projects/advisor/interested-teams");
    return response.data; // Returns array of interest objects
  } catch (error) {
    console.error("Error fetching interested teams:", error);
    throw error;
  }
}

/**
 * Get teams interested in a specific project (sorted by matching score)
 * 
 * @param {string} projectId - The project/idea ID
 * @returns {Promise<Array>} Array of interested teams sorted by team_score
 */
export async function getProjectInterestedTeams(projectId) {
  try {
    const response = await axios.get(`/advisor-projects/${projectId}/interested-teams`);
    return response.data; // Returns array of interest objects sorted by score
  } catch (error) {
    console.error("Error fetching project interested teams:", error);
    throw error;
  }
}

/**
 * Get advisor's own ideas (for dropdown selection)
 * 
 * @param {string} advisorId - Advisor ID
 * @param {string} sourceType - "advisor" or "industry" (default: "advisor")
 * @returns {Promise<Array>} Array of ideas with idea_id and title
 */
export async function getMyIdeas(advisorId, sourceType = "advisor") {
  try {
    const response = await axios.get("/advisor_ideas/my-ideas", {
      params: {
        advisor_id: advisorId,
        source_type: sourceType,
      },
    });
    return response.data; // Returns [{ idea_id, title }, ...]
  } catch (error) {
    console.error("Error fetching my ideas:", error);
    throw error;
  }
}

/**
 * Get top 3 most recent interested teams for advisor dashboard
 * 
 * @returns {Promise<Array>} Array of top 3 interested teams with members and project title
 */
export async function getTop3InterestedTeams() {
  try {
    const response = await axios.get("/advisor-projects/advisor/interested-teams/top3");
    return response.data; // Returns array of interest objects with enriched member data
  } catch (error) {
    console.error("Error fetching top 3 interested teams:", error);
    throw error;
  }
}

