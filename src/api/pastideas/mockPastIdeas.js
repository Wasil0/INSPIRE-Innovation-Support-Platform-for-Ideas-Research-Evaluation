/**
 * Mock data for Past FYDP Ideas
 * 
 * TODO: Replace mockPastIdeas with GET /api/fydp/past-projects
 * Backend should support query params for:
 * - search: string (searches title, advisor, description)
 * - year: number (filters by batch year)
 * - sort: 'title_asc' | 'title_desc' | 'year_desc' | 'advisor_asc'
 * 
 * Expected backend response shape:
 * {
 *   success: boolean,
 *   data: Array<{
 *     id: string,
 *     title: string,
 *     advisorName: string,
 *     year: number,
 *     description: string,
 *     teamMembers: string[]
 *   }>,
 *   total: number,
 *   page?: number,
 *   limit?: number
 * }
 */

const advisors = [
  "Dr. Sarah Ahmed",
  "Dr. Mohamed Hassan",
  "Dr. Fatima Ali",
  "Dr. Omar Ibrahim",
  "Dr. Layla Mahmoud",
  "Dr. Youssef Khalil",
  "Dr. Aisha Mohamed",
  "Dr. Khaled Ali",
];

const projectTitles = [
  "AI-Powered Learning Management System",
  "Smart Campus Navigation App",
  "Blockchain-Based Voting System",
  "IoT Home Automation Platform",
  "E-commerce Analytics Dashboard",
  "Healthcare Appointment Scheduler",
  "Social Media Analytics Tool",
  "Online Exam Proctoring System",
  "Food Delivery Optimization Platform",
  "Student Performance Tracker",
  "Library Management System",
  "Parking Space Finder App",
  "Weather Prediction System",
  "Budget Management Application",
  "Task Management Platform",
];

const descriptions = [
  "A comprehensive learning management system that uses artificial intelligence to personalize learning paths for students. The system analyzes student performance, identifies learning gaps, and recommends tailored content. Features include automated grading, progress tracking, and interactive quizzes. Built with React, Node.js, and machine learning algorithms.",
  
  "A mobile application that helps students navigate the university campus efficiently. The app provides real-time directions, shows available facilities, and includes features like room finder and event notifications. Uses GPS tracking and indoor positioning systems for accurate navigation.",
  
  "A secure voting system built on blockchain technology to ensure transparency and prevent fraud. The system allows for anonymous voting while maintaining a verifiable record of all votes. Features include voter authentication, real-time results, and audit trails.",
  
  "An Internet of Things platform that allows users to control home appliances remotely. The system includes sensors for temperature, lighting, and security. Users can monitor and control their homes through a mobile app with features like scheduling, energy monitoring, and alerts.",
  
  "A data analytics dashboard for e-commerce businesses to track sales, customer behavior, and inventory. The platform provides real-time insights, predictive analytics, and customizable reports. Helps businesses make data-driven decisions to improve sales and customer satisfaction.",
];

const generateMockPastIdeas = () => {
  const ideas = [];
  const years = [2021, 2022, 2023, 2024];
  
  years.forEach((year) => {
    // Generate ~50 projects per year
    for (let i = 0; i < 50; i++) {
      const title = projectTitles[Math.floor(Math.random() * projectTitles.length)];
      const advisor = advisors[Math.floor(Math.random() * advisors.length)];
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      
      // Generate 2-5 team members
      const teamSize = Math.floor(Math.random() * 4) + 2;
      const teamMembers = [];
      const firstNames = ["Ahmed", "Mohamed", "Ali", "Fatima", "Sarah", "Omar", "Layla", "Youssef"];
      const lastNames = ["Hassan", "Ali", "Ibrahim", "Ahmed", "Mahmoud", "Khalil"];
      
      for (let j = 0; j < teamSize; j++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        teamMembers.push(`${firstName} ${lastName}`);
      }
      
      ideas.push({
        id: `project_${year}_${i + 1}`,
        title,
        advisorName: advisor,
        year,
        description,
        teamMembers,
      });
    }
  });
  
  return ideas;
};

export const mockPastIdeas = generateMockPastIdeas();

