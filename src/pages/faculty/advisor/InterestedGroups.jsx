import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Loader2,
  TrendingUp,
  Clock,
  Award,
  Code,
  ChevronDown,
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
import Navbar from "@/components/Navbar";
import {
  getAdvisorInfo,
  getAdvisorInterestedTeams,
  getProjectInterestedTeams,
  getMyIdeas,
} from "@/api/advisors";
import { getAdvisorIdeas } from "@/api/advisorIdeas";

const InterestedGroups = () => {
  const navigate = useNavigate();

  // State
  const [advisorId, setAdvisorId] = useState(null);
  const [loadingAdvisorId, setLoadingAdvisorId] = useState(true);
  const [viewMode, setViewMode] = useState("all"); // "all" or "project"
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [myIdeas, setMyIdeas] = useState([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projectTitles, setProjectTitles] = useState({}); // Map project_id to title

  // Fetch advisor ID on mount
  useEffect(() => {
    const fetchAdvisorId = async () => {
      try {
        setLoadingAdvisorId(true);
        const advisor = await getAdvisorInfo();
        setAdvisorId(advisor.advisor_id || null);
      } catch (error) {
        console.error("Failed to fetch advisor info:", error);
        setError("Failed to load advisor information. Please try again.");
      } finally {
        setLoadingAdvisorId(false);
      }
    };

    fetchAdvisorId();
  }, []);

  // Fetch advisor's ideas for dropdown
  useEffect(() => {
    if (!advisorId) return;

    const fetchMyIdeas = async () => {
      try {
        setLoadingIdeas(true);
        // Fetch both advisor and industry ideas
        const [advisorIdeas, industryIdeas] = await Promise.all([
          getMyIdeas(advisorId, "advisor"),
          getMyIdeas(advisorId, "industry"),
        ]);
        
        const allIdeas = [...advisorIdeas, ...industryIdeas];
        setMyIdeas(allIdeas);
        
        // Create a map of project_id to title for quick lookup
        const titlesMap = {};
        allIdeas.forEach((idea) => {
          titlesMap[idea.idea_id] = idea.title;
        });
        setProjectTitles(titlesMap);
      } catch (error) {
        console.error("Failed to fetch my ideas:", error);
        // Don't fail the whole page, just show empty dropdown
        setMyIdeas([]);
      } finally {
        setLoadingIdeas(false);
      }
    };

    fetchMyIdeas();
  }, [advisorId]);

  // Fetch interested teams based on view mode
  useEffect(() => {
    if (!advisorId) return;

    const fetchInterests = async () => {
      try {
        setLoading(true);
        setError(null);

        let data = [];
        if (viewMode === "all") {
          // Fetch all teams interested in advisor's projects (sorted by recent)
          data = await getAdvisorInterestedTeams();
        } else if (viewMode === "project" && selectedProjectId) {
          // Fetch teams for specific project (sorted by score)
          data = await getProjectInterestedTeams(selectedProjectId);
        }

        setInterests(data || []);
      } catch (error) {
        console.error("Failed to fetch interested teams:", error);
        setError("Failed to load interested teams. Please try again.");
        setInterests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
  }, [advisorId, viewMode, selectedProjectId]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Format team score as percentage
  const formatScore = (score) => {
    if (score === null || score === undefined) return "N/A";
    return `${(score * 100).toFixed(1)}%`;
  };

  if (loadingAdvisorId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/advisor/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Interested Student Groups
          </h1>
          <p className="text-muted-foreground">
            View teams that have shown interest in your FYDP ideas
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-500/50 bg-red-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Mode Toggle and Project Selector */}
        <Card className="mb-6 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "all" ? "default" : "outline"}
                  onClick={() => {
                    setViewMode("all");
                    setSelectedProjectId("");
                  }}
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  All Projects (Recent)
                </Button>
                <Button
                  variant={viewMode === "project" ? "default" : "outline"}
                  onClick={() => setViewMode("project")}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  By Project (Score)
                </Button>
              </div>

              {/* Project Selector (only when in "project" mode) */}
              {viewMode === "project" && (
                <div className="flex-1 sm:flex-initial">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="h-9 w-full sm:w-[300px] rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    disabled={loadingIdeas}
                  >
                    <option value="">
                      {loadingIdeas
                        ? "Loading projects..."
                        : "Select a project..."}
                    </option>
                    {myIdeas.map((idea) => (
                      <option key={idea.idea_id} value={idea.idea_id}>
                        {idea.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Teams List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : interests.length === 0 ? (
          <Card className="border-primary/20">
            <CardContent className="pt-12 pb-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {viewMode === "project" && !selectedProjectId
                  ? "Select a project to view interested teams"
                  : "No interested teams yet"}
              </h3>
              <p className="text-muted-foreground">
                {viewMode === "project" && !selectedProjectId
                  ? "Choose a project from the dropdown above"
                  : "Student teams will appear here when they show interest in your ideas"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {interests.map((interest, index) => {
              const projectTitle =
                projectTitles[interest.project_id] || "Unknown Project";

              return (
                <Card
                  key={`${interest.team_id}-${interest.project_id}-${index}`}
                  className="border-primary/20 transition-all duration-300 hover:shadow-md"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <CardTitle className="text-lg">
                            Interested Team
                          </CardTitle>
                          <Badge
                            variant={
                              interest.status === "pending"
                                ? "secondary"
                                : "default"
                            }
                            className="text-xs"
                          >
                            {interest.status || "pending"}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          Interested in: {projectTitle}
                        </CardDescription>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Award className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-primary">
                            {formatScore(interest.team_score)}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Match Score
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Team Members */}
                    {interest.members && interest.members.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Team Members
                        </h4>
                        <div className="space-y-2">
                          {interest.members.map((member, idx) => {
                            const memberName = 
                              typeof member === "object" && member.name
                                ? member.name
                                : `Member ${idx + 1}`;
                            const rollNumber = 
                              typeof member === "object" && member.roll_number
                                ? member.roll_number
                                : null;
                            
                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-3 p-2 rounded-md bg-muted/30 border border-border/50"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-foreground">
                                    {memberName}
                                  </div>
                                  {rollNumber && (
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                      Roll No: {rollNumber}
                                    </div>
                                  )}
                                </div>
                                {typeof member === "object" && member.individual_score !== undefined && (
                                  <div className="text-right">
                                    <Badge variant="outline" className="text-xs">
                                      Skills matched: {member.individual_score}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Matched Skills */}
                    {interest.matched_skills &&
                      interest.matched_skills.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            Matched Skills
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {interest.matched_skills.map((skill, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-primary/20 text-primary text-xs"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Interest Date */}
                    {interest.created_at && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                        <Clock className="h-3 w-3" />
                        <span>
                          Interest shown on: {formatDate(interest.created_at)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        {interests.length > 0 && (
          <Card className="mt-6 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {interests.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total {interests.length === 1 ? "Team" : "Teams"}
                  </div>
                </div>
                {viewMode === "project" && interests.length > 0 && (
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {formatScore(
                        interests.reduce(
                          (sum, i) => sum + (i.team_score || 0),
                          0
                        ) / interests.length
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Average Match Score
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InterestedGroups;
