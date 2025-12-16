import axios from "./axiosConfig";

/**
 * Get all pending industry ideas
 * 
 * @returns {Promise<Array>} Array of pending industry ideas
 */
export async function getPendingIndustryIdeas() {
  try {
    const response = await axios.get("/industry/ideas/pending");
    return response.data; // Returns array of pending ideas
  } catch (error) {
    console.error("Error fetching pending industry ideas:", error);
    throw error;
  }
}

/**
 * Get all approved industry ideas
 * 
 * @returns {Promise<Array>} Array of approved industry ideas
 */
export async function getApprovedIndustryIdeas() {
  try {
    const response = await axios.get("/industry/ideas/approved");
    return response.data; // Returns array of approved ideas
  } catch (error) {
    console.error("Error fetching approved industry ideas:", error);
    throw error;
  }
}

/**
 * Get all pending industry jobs
 * 
 * @returns {Promise<Array>} Array of pending industry jobs with company profile
 */
export async function getPendingIndustryJobs() {
  try {
    const response = await axios.get("/industry/jobs/pending");
    return response.data || []; // Returns array directly
  } catch (error) {
    console.error("Error fetching pending industry jobs:", error);
    throw error;
  }
}

/**
 * Get all approved industry jobs
 * 
 * @returns {Promise<Array>} Array of approved industry jobs with company profile
 */
export async function getApprovedIndustryJobs() {
  try {
    const response = await axios.get("/industry/jobs/approved");
    return response.data || []; // Returns array directly
  } catch (error) {
    console.error("Error fetching approved industry jobs:", error);
    throw error;
  }
}

/**
 * Approve or reject an industry idea
 * 
 * @param {string} ideaId - The idea ID
 * @param {string} status - "approved" or "rejected"
 * @returns {Promise<Object>} Response message
 */
export async function updateIndustryIdeaStatus(ideaId, status) {
  try {
    const response = await axios.patch(`/industry/ideas/${ideaId}/status`, {
      status: status,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating industry idea status:", error);
    throw error;
  }
}

/**
 * Approve or reject an industry job
 * 
 * @param {string} jobId - The job ID
 * @param {string} status - "approved" or "rejected"
 * @returns {Promise<Object>} Response message
 */
export async function updateIndustryJobStatus(jobId, status) {
  try {
    const response = await axios.patch(`/industry/jobs/${jobId}/status`, {
      status: status,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating industry job status:", error);
    throw error;
  }
}

/**
 * Get all students with pagination, search, and filtering
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @param {string} params.search - Search by name or roll number
 * @param {string} params.group_filter - Filter by group status: 'formed', 'not_formed'
 * @returns {Promise<Object>} Response with students array and pagination info
 */
export async function getAllStudents({ page = 1, limit = 20, search = "", group_filter = "" } = {}) {
  try {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (search) params.append("search", search);
    if (group_filter) params.append("group_filter", group_filter);
    
    const response = await axios.get(`/profiles/students/all?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
}

/**
 * Get all locked FYDP groups with pagination, search, and filtering
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @param {string} params.search - Search by member name or roll number
 * @param {string} params.stage_filter - Filter by stage: 'stage1', 'stage2', 'stage3', 'stage4'
 * @param {string} params.advisor_filter - Filter by advisor ID
 * @returns {Promise<Object>} Response with groups array and pagination info
 */
export async function getAllLockedGroups({ page = 1, limit = 20, search = "", stage_filter = "", advisor_sort = "" } = {}) {
  try {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (search) params.append("search", search);
    if (stage_filter) params.append("stage_filter", stage_filter);
    if (advisor_sort) params.append("advisor_sort", advisor_sort);
    
    const response = await axios.get(`/profiles/groups/all?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching locked groups:", error);
    throw error;
  }
}

