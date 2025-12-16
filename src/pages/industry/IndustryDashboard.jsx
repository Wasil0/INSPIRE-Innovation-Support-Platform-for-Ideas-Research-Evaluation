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
import Navbar from "@/components/Navbar";
import { getIndustryProfile } from "@/api/industry";
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

  // Fetch industry profile
  useEffect(() => {
    const fetchIndustryInfo = async () => {
      try {
        setLoadingProfile(true);
        setError(null);
        const profile = await getIndustryProfile();

        // Check if profile is populated (has company_name)
        const hasProfile = profile.company_name && profile.company_name.trim() !== "";
        setProfileExists(hasProfile);

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
            {/* Posting Options Card */}
            <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.01] border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    <Plus className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Post New Content</CardTitle>
                    <CardDescription>
                      Share your FYDP ideas or job opportunities with students
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => navigate("/industry/post-idea")}
                  className="w-full justify-start h-auto py-4 px-4"
                  variant="outline"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Lightbulb className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Post FYDP Idea</div>
                      <div className="text-sm text-muted-foreground">
                        Share innovative project ideas for students
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Button>

                <Button
                  onClick={() => navigate("/industry/post-job")}
                  className="w-full justify-start h-auto py-4 px-4"
                  variant="outline"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Post Job/Internship</div>
                      <div className="text-sm text-muted-foreground">
                        Post job opportunities, internships, or training programs
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* View Own Posts Card */}
            <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.01] border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    <Eye className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">My Posts</CardTitle>
                    <CardDescription>
                      View and manage your posted ideas and jobs
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => navigate("/industry/my-ideas")}
                  className="w-full justify-start h-auto py-4 px-4"
                  variant="outline"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Lightbulb className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">My Posted Ideas</div>
                      <div className="text-sm text-muted-foreground">
                        View all your submitted FYDP ideas
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Button>

                <Button
                  onClick={() => navigate("/industry/my-jobs")}
                  className="w-full justify-start h-auto py-4 px-4"
                  variant="outline"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">My Posted Jobs</div>
                      <div className="text-sm text-muted-foreground">
                        View all your job postings and internships
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Button>
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

