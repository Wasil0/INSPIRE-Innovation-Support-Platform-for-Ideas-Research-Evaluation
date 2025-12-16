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

