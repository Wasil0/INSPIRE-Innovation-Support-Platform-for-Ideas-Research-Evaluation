import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lightbulb,
  Briefcase,
  Eye,
  Plus,
  Building2,
  Mail,
  Calendar,
  MapPin,
  FileText,
  ChevronRight,
  AlertCircle,
  Users,
  UserCheck,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Navbar from "@/components/Navbar";
import { getIndustryProfile, getInterestedGroupsForIndustry, getApplicantsForIndustryJobs } from "@/api/industry";
import { Loader2 } from "lucide-react";

const IndustryDashboard = () => {
  const navigate = useNavigate();

  // State for industry profile
  const [industryData, setIndustryData] = useState({
    company_name: "",
    company_type: "",
    industry_domain: "",
    company_description: "",
    founded_year: "",
    location: "",
    email: "",
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState(null);
  const [profileExists, setProfileExists] = useState(false);
  const [recentGroups, setRecentGroups] = useState([]);
  const [recentApplicants, setRecentApplicants] = useState([]);

  // Fetch industry profile
  useEffect(() => {
    const fetchIndustryInfo = async () => {
      try {
        setLoadingProfile(true);
        setError(null);
        const profile = await getIndustryProfile();

        const hasProfile = profile.company_name && profile.company_name.trim() !== "";
        setProfileExists(hasProfile);

        let groupsData = [];
        let applicantsData = [];

        try {
          groupsData = await getInterestedGroupsForIndustry();
        } catch (err) {
          console.warn("Could not load recent group summaries.");
        }

        try {
          applicantsData = await getApplicantsForIndustryJobs();
        } catch (err) {
          console.warn("Could not load recent applicant summaries.");
        }

        setRecentGroups(groupsData?.slice(0, 3) || []);
        setRecentApplicants(applicantsData?.slice(0, 3) || []);

        setIndustryData({
          company_name: profile.company_name || "",
          company_type: profile.company_type || "",
          industry_domain: profile.industry_domain || "",
          company_description: profile.company_description || "",
          founded_year: profile.founded_year || "",
          location: profile.location || "",
          email: profile.email || "",
        });
      } catch (error) {
        console.error("Failed to fetch industry profile:", error);
        setError(
          error.response?.data?.detail || 
          error.message || 
          "Failed to load profile. Please try again later."
        );
        setProfileExists(false);
        setIndustryData({
          company_name: "",
          company_type: "",
          industry_domain: "",
          company_description: "",
          founded_year: "",
          location: "",
          email: "",
        });
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchIndustryInfo();
  }, []);

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return "I";
    const words = name.split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Manage Postings Card */}
            <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-primary/20 will-change-transform origin-center transform-gpu">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                    <Building2 className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle>Manage Postings</CardTitle>
                    <CardDescription>
                      Post new FYDP ideas, internships, or view existing ones
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="flex-1 transition-all duration-150">
                        <Plus className="mr-2 h-4 w-4" />
                        Post New Content
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuItem onClick={() => navigate("/industry/post-idea")} className="cursor-pointer py-2">
                        <Lightbulb className="mr-2 h-4 w-4 text-primary" />
                        <span className="font-medium">Post FYDP Idea</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/industry/post-job")} className="cursor-pointer py-2">
                        <Briefcase className="mr-2 h-4 w-4 text-primary" />
                        <span className="font-medium">Post Job / Internship</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="outline"
                    onClick={() => navigate("/industry/my-postings")}
                    className="flex-1 transition-all duration-150"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Postings
                  </Button>
                </div>
                <div className="rounded-lg border border-primary/20 bg-card p-4 mt-2">
                  <p className="text-sm text-muted-foreground">
                    Engage with students by posting real-world projects and career opportunities. View responses and applications below.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Interested FYDP Groups Card */}
            <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-primary/20 will-change-transform origin-center transform-gpu">
              <CardHeader className="pb-3 border-b border-primary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                      <Users className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Interested FYDP Groups</CardTitle>
                      <CardDescription>
                        Teams pitching for your project ideas
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {recentGroups.length > 0 ? (
                    <div className="space-y-3">
                      {recentGroups.map((g, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                          <div>
                            <p className="font-medium text-sm text-primary">{g.idea_title}</p>
                            <p className="text-xs text-muted-foreground">Team matched at {g.team_score}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-primary/20 bg-muted/5 p-6 text-center text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No recent group interests.</p>
                    </div>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => navigate("/industry/interested-groups")}
                  >
                    View All Interested Groups <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Interested Job Applicants Card */}
            <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-primary/20 will-change-transform origin-center transform-gpu">
              <CardHeader className="pb-3 border-b border-primary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                      <UserCheck className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Job Applicants</CardTitle>
                      <CardDescription>
                        Students applying for your job postings
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {recentApplicants.length > 0 ? (
                    <div className="space-y-3">
                      {recentApplicants.map((a, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                          <div>
                            <p className="font-medium text-sm text-primary">{a.student_name}</p>
                            <p className="text-xs text-muted-foreground">Applied for {a.job_title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-primary/20 bg-muted/5 p-6 text-center text-muted-foreground">
                      <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No recent job applications.</p>
                    </div>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => navigate("/industry/interested-students")}
                  >
                    View All Applicants <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-primary/20 will-change-transform origin-center transform-gpu">
              <CardHeader className="text-center pb-3 pt-4">
                <div className="flex justify-center mb-3">
                  <Avatar className="h-20 w-20 border-2 border-primary/30 shadow-sm">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                      {loadingProfile ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        getInitials(industryData.company_name || "Industry")
                      )}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-lg">
                  {loadingProfile
                    ? "Loading..."
                    : industryData.company_name || "Industry Profile"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 px-4 pb-4">
                {loadingProfile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-2 bg-muted rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : error ? (
                  <div className="text-center py-6 space-y-3">
                    <div className="flex items-center justify-center text-destructive mb-2">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <p className="text-sm font-medium">Error Loading Profile</p>
                    </div>
                    <p className="text-xs text-muted-foreground px-2">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="mt-2"
                    >
                      Retry
                    </Button>
                  </div>
                ) : !profileExists ? (
                  <div className="text-center py-6 space-y-3">
                    <div className="flex items-center justify-center text-muted-foreground mb-2">
                      <FileText className="h-5 w-5 mr-2" />
                      <p className="text-sm font-medium">Profile Not Created</p>
                    </div>
                    <p className="text-xs text-muted-foreground px-2">
                      Please create your company profile to get started.
                    </p>
                    {industryData.email && (
                      <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-card p-2.5 mt-3">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-xs font-medium truncate">
                            {industryData.email}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Email */}
                    {industryData.email && (
                      <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-card p-2.5">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-xs font-medium truncate">
                            {industryData.email}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Company Description */}
                    {industryData.company_description && (
                      <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-card p-2.5">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            Description
                          </p>
                          <p className="text-xs text-foreground leading-relaxed">
                            {industryData.company_description}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Company Type */}
                    {industryData.company_type && (
                      <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-card p-2.5">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            Company Type
                          </p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {industryData.company_type}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Industry Domain */}
                    {industryData.industry_domain && (
                      <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-card p-2.5">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            Industry Domain
                          </p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {industryData.industry_domain}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Founded Year */}
                    {industryData.founded_year && (
                      <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-card p-2.5">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            Founded Year
                          </p>
                          <p className="text-xs font-medium">
                            {industryData.founded_year}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Location */}
                    {industryData.location && (
                      <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-card p-2.5">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            Location
                          </p>
                          <p className="text-xs font-medium">
                            {industryData.location}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndustryDashboard;

