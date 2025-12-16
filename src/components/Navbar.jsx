import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Settings,
  Bell,
  LogOut,
  User,
  GraduationCap,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAdvisorInfo } from "@/api/advisors";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications] = React.useState(3); // Placeholder for notification count
  const [isCommitteeMember, setIsCommitteeMember] = useState(false);
  const [loadingCommitteeStatus, setLoadingCommitteeStatus] = useState(true);
  const role = localStorage.getItem("role");

  // Check if current user is a committee member (only for advisors)
  useEffect(() => {
    const checkCommitteeStatus = async () => {
      if (role !== "advisor") {
        setLoadingCommitteeStatus(false);
        return;
      }

      try {
        const advisorInfo = await getAdvisorInfo();
        setIsCommitteeMember(advisorInfo.committee_member || false);
      } catch (error) {
        console.error("Failed to fetch committee status:", error);
        setIsCommitteeMember(false);
      } finally {
        setLoadingCommitteeStatus(false);
      }
    };

    checkCommitteeStatus();
  }, [role]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-sm">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <a
              href="/student/dashboard"
              className="text-xl font-semibold text-foreground transition-colors hover:text-primary"
            >
              INSPIRE
            </a>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Switch to Committee Member View Button - Only show for advisors who are committee members, but not when already on committee pages */}
            {role === "advisor" && 
              !loadingCommitteeStatus && 
              isCommitteeMember && 
              !location.pathname.includes("/faculty/committee") && (
                <Button
                  variant="ghost"
                  onClick={() => navigate("/faculty/committee/CommitteeDashboard")}
                  className="h-9 transition-colors"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Switch to Committee Member View
                </Button>
              )}
            
            {/* Switch to Advisor View Button - Only show when on committee dashboard */}
            {role === "advisor" &&
              !loadingCommitteeStatus &&
              isCommitteeMember &&
              location.pathname.includes("/faculty/committee") && (
                <Button
                  variant="ghost"
                  onClick={() => navigate("/advisor/dashboard")}
                  className="h-9 transition-colors"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Switch to Advisor View
                </Button>
              )}
            
            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 transition-colors"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Preferences
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                  {notifications}
                </span>
              )}
            </Button>

            {/* Sign Out */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-9 w-9 transition-colors hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

