import "./App.css";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/faculty/admin/AdminDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import AdvisorDashboard from "./pages/faculty/advisor/AdvisorDashboard";
import PostIdea from "./pages/faculty/advisor/PostIdea";
import ViewIdeas from "./pages/faculty/advisor/ViewIdeas";
import InterestedGroups from "./pages/faculty/advisor/InterestedGroups";
import SelectedGroups from "./pages/faculty/advisor/SelectedGroups";
import CommitteeDashboard from "./pages/faculty/committee/CommitteeDashboard";
import StudentsOverview from "./pages/faculty/committee/StudentsOverview";
import GroupsOverview from "./pages/faculty/committee/GroupsOverview";
import IndustryManagement from "./pages/faculty/committee/IndustryManagement";
import FydpProgress from "./pages/student/FydpProgress";
import GroupFormation from "./pages/student/GroupFormation";
import PastIdeas from "./pages/student/PastIdeas";
import FydpAdvisorIdeas from "./pages/student/FydpAdvisorIdeas";
import AiChat from "./pages/student/AiChat";
import IndustryDashboard from "./pages/industry/IndustryDashboard";
import PostIndustryIdea from "./pages/industry/PostIndustryIdea";
import PostIndustryJob from "./pages/industry/PostIndustryJob";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./routes/ProtectedRoutes";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />}></Route>
      <Route
        path="/committee/dashboard"
        element={<ProtectedRoute allowedRoles={["committee"]}></ProtectedRoute>}
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advisor/dashboard"
        element={
          <ProtectedRoute allowedRoles={["advisor"]}>
            <AdvisorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/advisor/post-idea"
        element={
          <ProtectedRoute allowedRoles={["advisor"]}>
            <PostIdea />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/advisor/view-ideas"
        element={
          <ProtectedRoute allowedRoles={["advisor"]}>
            <ViewIdeas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/advisor/interested-groups"
        element={
          <ProtectedRoute allowedRoles={["advisor"]}>
            <InterestedGroups />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/advisor/selected-groups"
        element={
          <ProtectedRoute allowedRoles={["advisor"]}>
            <SelectedGroups />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/committee/CommitteeDashboard"
        element={
          <ProtectedRoute allowedRoles={["advisor", "committee"]}>
            <CommitteeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/committee/students"
        element={
          <ProtectedRoute allowedRoles={["advisor", "committee"]}>
            <StudentsOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/committee/groups"
        element={
          <ProtectedRoute allowedRoles={["advisor", "committee"]}>
            <GroupsOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/committee/industry-management"
        element={
          <ProtectedRoute allowedRoles={["advisor", "committee"]}>
            <IndustryManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/fydp-progress"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <FydpProgress />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/group-formation"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <GroupFormation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/past-ideas"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <PastIdeas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/fydp-advisor-ideas"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <FydpAdvisorIdeas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/ai-chat"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <AiChat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/industry/dashboard"
        element={
          <ProtectedRoute allowedRoles={["industry"]}>
            <IndustryDashboard />
          </ProtectedRoute>
        }
      />
      {/* Industry routes */}
      <Route
        path="/industry/post-idea"
        element={
          <ProtectedRoute allowedRoles={["industry"]}>
            <PostIndustryIdea />
          </ProtectedRoute>
        }
      />
      <Route
        path="/industry/post-job"
        element={
          <ProtectedRoute allowedRoles={["industry"]}>
            <PostIndustryJob />
          </ProtectedRoute>
        }
      />
      <Route
        path="/industry/my-ideas"
        element={
          <ProtectedRoute allowedRoles={["industry"]}>
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">My Ideas</h1>
                <p className="text-muted-foreground">This page is under construction.</p>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/industry/my-jobs"
        element={
          <ProtectedRoute allowedRoles={["industry"]}>
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">My Jobs</h1>
                <p className="text-muted-foreground">This page is under construction.</p>
              </div>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Unauthorized Page */}
      <Route path="/unauthorized" element={<Unauthorized />} />
    </Routes>
  );
}

export default App;
