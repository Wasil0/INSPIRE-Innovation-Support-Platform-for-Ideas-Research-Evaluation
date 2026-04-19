import axios from "./axiosConfig";

/**
 * Get all approved industry jobs
 * 
 * @returns {Promise<Array>} Response with array of industry jobs
 */
export async function getApprovedIndustryJobs() {
  try {
    const response = await axios.get("/industry/jobs/approved");
    return response.data; // Returns array of IndustryJobResponse
  } catch (error) {
    console.error("Error fetching approved industry jobs:", error);
    throw error;
  }
}

/**
 * Single student apply for an industry job
 * 
 * @param {string} jobId - The industry job ID
 * @returns {Promise<Object>} Response with message
 */
export async function applyForIndustryJob(jobId) {
  try {
    const response = await axios.post(`/student/jobs/${jobId}/apply`);
    return response.data;
  } catch (error) {
    console.error("Error applying to industry job:", error);
    const errorMessage = error.response?.data?.detail || error.message || "Failed to submit application";
    throw new Error(errorMessage);
  }
}

/**
 * Get the current student's applied jobs
 * 
 * @returns {Promise<Array>} Array of jobs the student has applied to
 */
export async function getMyAppliedJobs() {
  try {
    const response = await axios.get("/student/jobs/my-applications");
    return response.data;
  } catch (error) {
    console.error("Error fetching applied jobs:", error);
    throw error;
  }
}
