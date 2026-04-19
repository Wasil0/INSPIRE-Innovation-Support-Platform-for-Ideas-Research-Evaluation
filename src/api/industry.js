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
    const response = await axios.get("/industry/ideas/my-ideas");
    return response.data;
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
    const response = await axios.get("/industry/jobs/my-jobs");
    return response.data;
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

/**
 * Get groups interested in the logged-in industry's ideas
 */
export async function getInterestedGroupsForIndustry() {
  try {
    const response = await axios.get("/industry-projects/industry/interested-groups");
    return response.data;
  } catch (error) {
    console.error("Error fetching interested groups:", error);
    throw error;
  }
}

/**
 * Get individual students applied to the logged-in industry's jobs
 */
export async function getApplicantsForIndustryJobs() {
  try {
    const response = await axios.get("/student/jobs/industry-view/applicants");
    return response.data;
  } catch (error) {
    console.error("Error fetching job applicants:", error);
    throw error;
  }
}
