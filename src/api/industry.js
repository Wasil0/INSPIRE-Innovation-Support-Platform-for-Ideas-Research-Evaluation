import axios from "./axiosConfig";

/**
 * Get current industry's profile information including email
 * 
 * @returns {Promise<Object>} Industry profile with company_name, company_type, industry_domain, company_description, founded_year, location, email
 */
export async function getIndustryProfile() {
  try {
    const response = await axios.get("/industry/profile/me");
    return response.data;
  } catch (error) {
    console.error("Error fetching industry profile:", error);
    throw error;
  }
}

/**
 * Get industry's own ideas (both pending and approved)
 * 
 * @returns {Promise<Array>} Array of industry's own ideas
 */
export async function getMyIndustryIdeas() {
  try {
    // Get user_id from token
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");
    
    const payload = JSON.parse(atob(token.split(".")[1]));
    const industry_id = payload._id;
    
    // Get all approved and pending ideas, then filter by industry_id on frontend
    // TODO: Backend should provide /industry/ideas/my-ideas endpoint
    const [approvedResponse, pendingResponse] = await Promise.all([
      axios.get("/industry/ideas/approved"),
      axios.get("/industry/ideas/pending")
    ]);
    
    const allIdeas = [...(approvedResponse.data || []), ...(pendingResponse.data || [])];
    
    // Filter by current industry_id
    return allIdeas.filter(idea => idea.industry_id === industry_id);
  } catch (error) {
    console.error("Error fetching industry ideas:", error);
    throw error;
  }
}

/**
 * Get industry's own jobs (both pending and approved)
 * 
 * @returns {Promise<Array>} Array of industry's own jobs
 */
export async function getMyIndustryJobs() {
  try {
    // Get user_id from token
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");
    
    const payload = JSON.parse(atob(token.split(".")[1]));
    const industry_id = payload._id;
    
    // Get all approved and pending jobs, then filter by industry_id on frontend
    // TODO: Backend should provide /industry/jobs/my-jobs endpoint
    const [approvedResponse, pendingResponse] = await Promise.all([
      axios.get("/industry/jobs/approved"),
      axios.get("/industry/jobs/pending")
    ]);
    
    const allJobs = [...(approvedResponse.data || []), ...(pendingResponse.data || [])];
    
    // Filter by current industry_id
    return allJobs.filter(job => job.industry_id === industry_id);
  } catch (error) {
    console.error("Error fetching industry jobs:", error);
    throw error;
  }
}

/**
 * Post a new industry FYDP idea
 * 
 * @param {Object} data - Idea data containing title, description, technology_stack, expected_skills
 * @returns {Promise<Object>} Response with message and idea_id
 */
export async function postIndustryIdea(data) {
  try {
    const response = await axios.post("/industry/ideas", {
      title: data.title,
      description: data.description,
      technology_stack: data.technology_stack || [],
      expected_skills: data.expected_skills || [],
    });
    return response.data;
  } catch (error) {
    console.error("Error posting industry idea:", error);
    throw error;
  }
}

/**
 * Post a new industry job/internship/training
 * 
 * @param {Object} data - Job data containing title, description, job_type, amount, duration, technology_stack, expected_skills
 * @returns {Promise<Object>} Response with message and job_id
 */
export async function postIndustryJob(data) {
  try {
    const response = await axios.post("/industry/jobs", {
      title: data.title,
      description: data.description,
      job_type: data.job_type,
      amount: data.amount || null,
      duration: data.duration || null,
      technology_stack: data.technology_stack || [],
      expected_skills: data.expected_skills || [],
    });
    return response.data;
  } catch (error) {
    console.error("Error posting industry job:", error);
    throw error;
  }
}

