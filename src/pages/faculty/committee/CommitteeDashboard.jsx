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

  // Demo data for Proposal Review (Card D)
  const [proposalData] = useState({
    pending: 5,
    approved: 12,
    pendingList: [
      { id: 1, groupName: "AI Vision Team", submittedDate: "2024-01-15" },
      { id: 2, groupName: "Blockchain Innovators", submittedDate: "2024-01-12" },
      { id: 3, groupName: "IoT Solutions", submittedDate: "2024-01-10" },
    ],
    approvedList: [
      { id: 1, groupName: "ML Research Group", approvedDate: "2024-01-08" },
      { id: 2, groupName: "Cloud Computing Team", approvedDate: "2024-01-05" },
    ],
  });

  // Fetch advisor info from API
  useEffect(() => {
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
                <div className="rounded-lg border border-primary/20 bg-card p-4 mb-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Access comprehensive student information including names, roll
                    numbers, and their current FYDP stage progress.
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => navigate("/faculty/committee/students")}
                >
                  View All Students
                  <ChevronRight className="ml-2 h-4 w-4" />
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
                <div className="rounded-lg border border-primary/20 bg-card p-4 mb-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    View all FYDP groups with member details, stage completion
                    status, and assigned advisors.
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => navigate("/faculty/committee/groups")}
                >
                  View All Groups
                  <ChevronRight className="ml-2 h-4 w-4" />
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
                <div className="rounded-lg border border-primary/20 bg-card p-4 mb-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage industry submissions including FYDP ideas and job
                    postings. Review pending items and approve or reject them.
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => navigate("/faculty/committee/industry-management")}
                >
                  Manage Industry Posts
                  <ChevronRight className="ml-2 h-4 w-4" />
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
                <Tabs defaultValue="pending" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending">
                      Pending ({proposalData.pending})
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                      Approved ({proposalData.approved})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="pending" className="mt-4">
                    <div className="space-y-3">
                      {proposalData.pendingList.length > 0 ? (
                        proposalData.pendingList.map((proposal) => (
                          <div
                            key={proposal.id}
                            className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">
                                  {proposal.groupName}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Submitted: {proposal.submittedDate}
                                </p>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                Pending
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No pending proposals
                        </p>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="approved" className="mt-4">
                    <div className="space-y-3">
                      {proposalData.approvedList.length > 0 ? (
                        proposalData.approvedList.map((proposal) => (
                          <div
                            key={proposal.id}
                            className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">
                                  {proposal.groupName}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Approved: {proposal.approvedDate}
                                </p>
                              </div>
                              <Badge
                                variant="default"
                                className="bg-primary text-primary-foreground text-xs"
                              >
                                Approved
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No approved proposals
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                    Backend integration pending - using demo data
                  </p>
                </div>
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
