import "./App.css";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/faculty/admin/AdminDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import AdvisorDashboard from "./pages/faculty/advisor/AdvisorDashboard";
import FydpProgress from "./pages/student/FydpProgress";
import GroupFormation from "./pages/student/GroupFormation";
import PastIdeas from "./pages/student/PastIdeas";
// import Unauthorized from "./pages/Unauthorized";
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

      {/* Unauthorized Page */}
      {/* <Route path="/unauthorized" element={<Unauthorized />} /> */}
    </Routes>
  );
}

export default App;
