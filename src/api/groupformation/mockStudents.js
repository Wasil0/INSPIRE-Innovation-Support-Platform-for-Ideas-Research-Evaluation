/**
 * Mock student data for Group Formation page
 * 
 * TODO: Replace this with real API call to GET /api/students
 * The backend should return students with status: 'free' | 'in_group'
 */

// Generate 150+ mock students
const firstNames = [
  "Ahmed", "Mohamed", "Ali", "Hassan", "Omar", "Youssef", "Khaled", "Ibrahim",
  "Fatima", "Aisha", "Mariam", "Zainab", "Sarah", "Layla", "Noor", "Hana",
  "John", "Michael", "David", "James", "Robert", "William", "Richard", "Joseph",
  "Emily", "Emma", "Olivia", "Sophia", "Isabella", "Charlotte", "Amelia", "Mia"
];

const lastNames = [
  "Hassan", "Ali", "Mohamed", "Ibrahim", "Ahmed", "Omar", "Khalil", "Mahmoud",
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Anderson", "Taylor", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson"
];

const generateMockStudents = () => {
  const students = [];
  let id = 1;

  for (let i = 0; i < 150; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    
    // Mix of statuses: ~60% free, ~40% in group
    const status = Math.random() < 0.6 ? "free" : "in_group";
    
    students.push({
      id: `student_${id++}`,
      name,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@university.edu`,
      status,
      invitedByMe: false, // Will be updated when user invites
    });
  }

  return students;
};

export const mockStudents = generateMockStudents();

