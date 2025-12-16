import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lightbulb,
  Users,
  UserCheck,
  Mail,
  ChevronRight,
  Plus,
  Eye,
  Settings,
  Award,
  Building2,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navbar from "@/components/Navbar";
import { getAdvisorInfo, getTop3InterestedTeams } from "@/api/advisors";
import { Loader2 } from "lucide-react";

const AdvisorDashboard = () => {
  const navigate = useNavigate();
  
  // State for advisor profile
  const [advisorData, setAdvisorData] = useState({
    name: "",
    gsuite_id: "",
    committee_member: false,
  });
  const [loadingProfile, setLoadingProfile] = useState(true);

  // State for interested groups
  const [interestedGroups, setInterestedGroups] = useState([]);
  const [loadingInterestedGroups, setLoadingInterestedGroups] = useState(true);

  // Fetch advisor info from API
  useEffect(() => {
    const fetchAdvisorInfo = async () => {
      try {
        setLoadingProfile(true);
        const profile = await getAdvisorInfo();
        console.log("Advisor profile fetched:", profile); // Debug log
        setAdvisorData({
          name: profile.name || "",
          gsuite_id: profile.gsuite_id || "",
          committee_member: profile.committee_member || false,
          department: profile.department || "",
        });
      } catch (error) {
        console.error("Failed to fetch advisor profile:", error);
        console.error("Error details:", error.response?.data || error.message); // Debug log
        // Keep default empty state on error
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

  // Fetch top 3 interested teams
  useEffect(() => {
    const fetchInterestedGroups = async () => {
      try {
        setLoadingInterestedGroups(true);
        const data = await getTop3InterestedTeams();
        setInterestedGroups(data || []);
      } catch (error) {
        console.error("Failed to fetch interested groups:", error);
        setInterestedGroups([]);
      } finally {
        setLoadingInterestedGroups(false);
      }
    };

    fetchInterestedGroups();
  }, []);

  // demo data, replace with API response
  const selectedGroups = [
    {
      id: 1,
      teamName: "AI Vision Team",
      members: ["Sarah Ali", "Ahmed Khan", "Fatima Ahmed"],
      projectTitle: "Computer Vision for Medical Diagnosis",
      status: "In Progress",
      progress: 65,
    },
    {
      id: 2,
      teamName: "Blockchain Innovators",
      members: ["Mohamed Ibrahim", "Zainab Hassan"],
      projectTitle: "Decentralized Voting System",
      status: "Planning",
      progress: 30,
    },
  ];

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
      {/* Glassmorphic Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area - Left Side (2 columns on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Your FYDP Ideas Card */}
            <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-primary/20 will-change-transform origin-center transform-gpu">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                    <Lightbulb className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle>Your FYDP Ideas</CardTitle>
                    <CardDescription>
                      Manage and post new project ideas for students
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => navigate("/faculty/advisor/post-idea")}
                    className="flex-1 transition-all duration-150"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Post New Idea
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/faculty/advisor/view-ideas")}
                    className="flex-1 transition-all duration-150"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Your Ideas
                  </Button>
                </div>
                <div className="rounded-lg border border-primary/20 bg-card p-4">
                  <p className="text-sm text-muted-foreground">
                    Share innovative project ideas with students and help guide
                    their Final Year Design Projects.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Interested Student Groups Card */}
            <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-primary/20 will-change-transform origin-center transform-gpu">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                    <Users className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle>Interested Student Groups</CardTitle>
                    <CardDescription>
                      Groups that have shown interest in your ideas
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingInterestedGroups ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : interestedGroups.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {interestedGroups.map((group, groupIdx) => (
                        <div
                          key={`${group.team_id}-${group.project_id}-${groupIdx}`}
                          className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground mb-2">
                                Interested in: {group.project_title || "Unknown Project"}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {group.members && group.members.length > 0 ? (
                                  group.members.map((member, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {member.name || `Member ${idx + 1}`}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    No members available
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        navigate("/faculty/advisor/interested-groups")
                      }
                    >
                      See All
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <p className="text-muted-foreground">
                      No student groups have shown interest yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected FYDP Groups Card */}
            <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-primary/20 will-change-transform origin-center transform-gpu">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                      <UserCheck className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle>Selected FYDP Groups</CardTitle>
                      <CardDescription>
                        Student groups you are supervising
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">
                    {selectedGroups.length} Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedGroups.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {selectedGroups.map((group) => (
                        <div
                          key={group.id}
                          className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-sm">
                                  {group.teamName}
                                </h4>
                                <Badge
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {group.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {group.projectTitle}
                              </p>
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {group.members.map((member, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {member}
                                  </Badge>
                                ))}
                              </div>
                              <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-muted-foreground">
                                    Progress
                                  </span>
                                  <span className="text-xs font-medium">
                                    {group.progress}%
                                  </span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${group.progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        navigate("/faculty/advisor/selected-groups")
                      }
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Groups
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <p className="text-muted-foreground">
                      No groups selected yet. Start supervising student
                      projects to see them here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Advisor Profile Summary Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-primary/20 will-change-transform origin-center transform-gpu">
              <CardHeader className="text-center pb-3 pt-4">
                <div className="flex justify-center mb-3">
                  <Avatar className="h-20 w-20 border-2 border-primary/30 shadow-sm">
                    {advisorData.avatar ? (
                      <AvatarImage src={advisorData.avatar} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                      {loadingProfile
                        ? "..."
                        : getInitials(advisorData.name || "Advisor")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-lg">
                  {loadingProfile
                    ? "Loading..."
                    : advisorData.name || "Advisor"}
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
                {advisorData.committee_member && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-card p-2.5">
                    <Award className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        Committee Status
                      </p>
                      <Badge className="bg-primary text-primary-foreground mt-1 text-xs">
                        Committee Member
                      </Badge>
                    </div>
                  </div>
                )}

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

export default AdvisorDashboard;
