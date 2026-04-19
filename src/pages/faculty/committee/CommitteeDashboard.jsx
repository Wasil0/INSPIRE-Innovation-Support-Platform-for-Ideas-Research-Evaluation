import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  GraduationCap,
  Briefcase,
  FileText,
  Mail,
  Award,
  Building2,
  Loader2,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import { getAdvisorInfo } from "@/api/advisors";
import { getCommitteeDashboardStats } from "@/api/committee";

const CommitteeDashboard = () => {
  const navigate = useNavigate();

  // State for advisor profile
  const [advisorData, setAdvisorData] = useState({
    name: "",
    gsuite_id: "",
    committee_member: false,
    department: "",
  });
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [dashboardStats, setDashboardStats] = useState({
    students: { total_enrolled: 0 },
    groups: { total_registered: 0 },
    industry: { pending_ideas: 0, pending_jobs: 0 },
    proposals: { pending_count: 0, approved_count: 0, pending_list: [], approved_list: [] }
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch advisor info from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingStats(true);
        const stats = await getCommitteeDashboardStats();
        setDashboardStats(stats);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchAdvisorInfo = async () => {
      try {
        setLoadingProfile(true);
        const profile = await getAdvisorInfo();
        setAdvisorData({
          name: profile.name || "",
          gsuite_id: profile.gsuite_id || "",
          committee_member: profile.committee_member || false,
          department: profile.department || "",
        });
      } catch (error) {
        console.error("Failed to fetch advisor profile:", error);
        setAdvisorData({
          name: "",
          gsuite_id: "",
          committee_member: false,
          department: "",
        });
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchAdvisorInfo();
    fetchDashboardData();
  }, []);

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area - Left Side (2 columns on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card A - Students Overview */}
            <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-primary/20 will-change-transform origin-center transform-gpu">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                    <Users className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle>Students Overview</CardTitle>
                    <CardDescription>
                      View and manage all student profiles and stage information
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50 transition-colors hover:bg-accent/50 cursor-default">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Total Active Students</span>
                    </div>
                    <Badge variant="secondary" className="font-normal">
                      {loadingStats ? "..." : dashboardStats.students.total_enrolled} Enrolled
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/faculty/committee/students")}
                >
                  Manage Student Directory
                </Button>
              </CardContent>
            </Card>

            {/* Card B - FYDP Groups Overview */}
            <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-primary/20 will-change-transform origin-center transform-gpu">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                    <GraduationCap className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle>FYDP Groups Overview</CardTitle>
                    <CardDescription>
                      Manage all student groups and their project status
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50 transition-colors hover:bg-accent/50 cursor-default">
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Registered Groups</span>
                    </div>
                    <Badge variant="secondary" className="font-normal">
                      {loadingStats ? "..." : dashboardStats.groups.total_registered} Groups
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/faculty/committee/groups")}
                >
                  Manage FYDP Groups
                </Button>
              </CardContent>
            </Card>

            {/* Card C - Industry FYDP Ideas & Job Posts */}
            <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-primary/20 will-change-transform origin-center transform-gpu">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                    <Briefcase className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle>Industry FYDP Ideas & Job Posts</CardTitle>
                    <CardDescription>
                      Review and approve industry-submitted ideas and job postings
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50 transition-colors hover:bg-accent/50 cursor-default">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Pending Ideas</span>
                    </div>
                    <Badge variant="secondary" className="font-normal">
                      {loadingStats ? "..." : dashboardStats.industry.pending_ideas} pending
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50 transition-colors hover:bg-accent/50 cursor-default">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Pending Jobs</span>
                    </div>
                    <Badge variant="secondary" className="font-normal">
                      {loadingStats ? "..." : dashboardStats.industry.pending_jobs} pending
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/faculty/committee/industry-management")}
                >
                  Review Industry Ideas
                </Button>
              </CardContent>
            </Card>

            {/* Card D - FYDP Proposal Review (Frontend Only) */}
            <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-primary/20 will-change-transform origin-center transform-gpu">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                    <FileText className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle>FYDP Proposal Review</CardTitle>
                    <CardDescription>
                      Review submitted FYDP proposals from student groups
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                  {/* Pending Proposals Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3 border-b pb-2">
                      <h4 className="text-sm font-semibold text-muted-foreground flex items-center">
                        <Loader2 className="w-4 h-4 mr-2" /> Pending Reviews
                      </h4>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {loadingStats ? "..." : dashboardStats.proposals.pending_count}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {!loadingStats && dashboardStats.proposals.pending_list.length > 0 ? (
                        dashboardStats.proposals.pending_list.map((proposal) => (
                          <div key={proposal.id} className="rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50 cursor-pointer" onClick={() => navigate("/faculty/committee/proposals")}>
                            <h4 className="font-medium text-sm truncate">{proposal.groupName}</h4>
                            <p className="text-xs text-muted-foreground mt-1">Submitted: {proposal.submittedDate}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-6 bg-card/50 rounded-lg border border-dashed">
                          {loadingStats ? "Loading..." : "No pending proposals"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Approved Proposals Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3 border-b pb-2">
                      <h4 className="text-sm font-semibold text-muted-foreground flex items-center">
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Recently Approved
                      </h4>
                      <Badge variant="outline" className="text-xs font-normal text-green-700 bg-green-50 border-green-200">
                        {loadingStats ? "..." : dashboardStats.proposals.approved_count}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {!loadingStats && dashboardStats.proposals.approved_list.length > 0 ? (
                        dashboardStats.proposals.approved_list.map((proposal) => (
                          <div key={proposal.id} className="rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50 cursor-pointer" onClick={() => navigate("/faculty/committee/proposals")}>
                            <h4 className="font-medium text-sm truncate">{proposal.groupName}</h4>
                            <p className="text-xs text-muted-foreground mt-1">Approved: {proposal.approvedDate}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-6 bg-card/50 rounded-lg border border-dashed">
                          {loadingStats ? "Loading..." : "No approved proposals"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full mt-6" onClick={() => navigate("/faculty/committee/proposals")}>
                  Manage All Proposals
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Profile Summary Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-primary/20 will-change-transform origin-center transform-gpu">
              <CardHeader className="text-center pb-3 pt-4">
                <div className="flex justify-center mb-3">
                  <Avatar className="h-20 w-20 border-2 border-primary/30 shadow-sm">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                      {loadingProfile
                        ? "..."
                        : getInitials(advisorData.name || "Committee")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-lg">
                  {loadingProfile
                    ? "Loading..."
                    : advisorData.name || "Committee Member"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 px-4 pb-4">
                {/* Email (GSuite ID) */}
                {advisorData.gsuite_id && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-card p-2.5">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-xs font-medium truncate">
                        {advisorData.gsuite_id}
                      </p>
                    </div>
                  </div>
                )}

                {/* Committee Member Badge */}
                <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-card p-2.5">
                  <Award className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Role</p>
                    <Badge className="bg-primary text-primary-foreground mt-1 text-xs">
                      Committee Member
                    </Badge>
                  </div>
                </div>

                {/* Department (if available) */}
                {advisorData.department && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-card p-2.5">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        Department
                      </p>
                      <p className="text-xs font-medium">
                        {advisorData.department}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitteeDashboard;
