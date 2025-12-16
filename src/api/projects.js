import axios from "./axiosConfig";

/**
 * Fetch past projects with pagination and filters
 * 
 * @param {Object} params - Query parameters
 * @param {string} [params.q] - Search query (searches in title/description)
 * @param {string} [params.batch] - Filter by batch year
 * @param {string} [params.advisor] - Filter by advisor name
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=10] - Items per page
 * @returns {Promise<Object>} Response with { page, limit, total, pages, data: [...] }
 */
export async function getProjects({ q = null, batch = null, advisor = null, page = 1, limit = 10 } = {}) {
  try {
    const params = new URLSearchParams();
    
    if (q) params.append("q", q);
    if (batch) params.append("batch", batch);
    if (advisor) params.append("advisor", advisor);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    const response = await axios.get(`/projects/?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
}

/**
 * Fetch metadata for projects (available batches and advisors)
 * 
 * @returns {Promise<Object>} Response with { batches: [...], advisors: [...] }
 */
export async function getProjectsMeta() {
  try {
    const response = await axios.get("/projects/meta");
    return response.data;
  } catch (error) {
    console.error("Error fetching projects metadata:", error);
    throw error;
  }
}

