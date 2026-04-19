import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Building2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Code,
  Heart,
  CheckCircle2,
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
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import { getApprovedIndustryIdeas, markIndustryIdeaInterested, getMyTeamIndustryInterests } from "@/api/industryIdeas";
import { getMyStages } from "@/api/student";

// Configuration
const ITEMS_PER_PAGE = 10;

const FydpIndustryIdeas = () => {
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortFilter, setSortFilter] = useState("az");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [allIdeas, setAllIdeas] = useState([]);
  const [displayedIdeas, setDisplayedIdeas] = useState([]);
  const [stages, setStages] = useState({
    stage1_completed: false,
  });
  const [loadingStages, setLoadingStages] = useState(true);
  const [interestedIdeas, setInterestedIdeas] = useState(new Set());
  const [loadingInterests, setLoadingInterests] = useState(false);
  const [markingInterest, setMarkingInterest] = useState(null);
  const [error, setError] = useState(null);

  // Fetch stage status and existing interests
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingStages(true);
        
        // Fetch stages
        const stagesResponse = await getMyStages();
        setStages(stagesResponse.stages || { stage1_completed: false });
        
        // Fetch existing interests if stage 1 is completed
        if (stagesResponse.stages?.stage1_completed) {
          try {
            setLoadingInterests(true);
            const interests = await getMyTeamIndustryInterests();
            const interestedIds = new Set(
              interests.map((interest) => {
                return typeof interest.project_id === 'string' 
                  ? interest.project_id 
                  : String(interest.project_id);
              })
            );
            setInterestedIdeas(interestedIds);
          } catch (error) {
            console.error("Failed to fetch existing interests:", error);
            setInterestedIdeas(new Set());
          } finally {
            setLoadingInterests(false);
          }
        } else {
          setInterestedIdeas(new Set());
        }
      } catch (error) {
        console.error("Failed to fetch stages:", error);
        setStages({ stage1_completed: false });
      } finally {
        setLoadingStages(false);
      }
    };

    fetchData();
  }, []);

  // Fetch all ideas on mount
  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getApprovedIndustryIdeas();
        setAllIdeas(response);
        
        // Extract unique companies
        const uniqueCompanies = new Set();
        response.forEach(idea => {
            if(idea.company_name) {
                uniqueCompanies.add(idea.company_name);
            }
        });
        setAvailableCompanies(Array.from(uniqueCompanies).sort());
      } catch (err) {
        console.error("Failed to fetch industry ideas:", err);
        setError("Failed to load industry ideas. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, []);

  // Filter, search, sort and paginate locally
  useEffect(() => {
    let result = [...allIdeas];

    // Filter by company
    if (selectedCompany !== "all") {
        result = result.filter(idea => idea.company_name === selectedCompany);
    }

    // Filter by search
    if (searchQuery.trim() !== "") {
        const searchLower = searchQuery.toLowerCase();
        result = result.filter(idea => {
            const titleMatch = idea.title?.toLowerCase().includes(searchLower);
            const descMatch = idea.description?.toLowerCase().includes(searchLower);
            const companyMatch = idea.company_name?.toLowerCase().includes(searchLower);
            const stackMatch = idea.technology_stack?.some((d) => d.toLowerCase().includes(searchLower));
            const skillsMatch = idea.expected_skills?.some((s) => s.toLowerCase().includes(searchLower));
            return titleMatch || descMatch || companyMatch || stackMatch || skillsMatch;
        });
    }

    // Sort
    if (sortFilter === "az") {
        result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortFilter === "za") {
        result.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
    }

    // Pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setDisplayedIdeas(result.slice(startIndex, endIndex));

  }, [allIdeas, searchQuery, selectedCompany, sortFilter, currentPage]);

  const filteredIdeasCount = useMemo(() => {
    let result = [...allIdeas];
    if (selectedCompany !== "all") {
        result = result.filter(idea => idea.company_name === selectedCompany);
    }
    if (searchQuery.trim() !== "") {
        const searchLower = searchQuery.toLowerCase();
        result = result.filter(idea => {
            const titleMatch = idea.title?.toLowerCase().includes(searchLower);
            const descMatch = idea.description?.toLowerCase().includes(searchLower);
            const companyMatch = idea.company_name?.toLowerCase().includes(searchLower);
            return titleMatch || descMatch || companyMatch;
        });
    }
    return result.length;
  }, [allIdeas, searchQuery, selectedCompany]);

  const totalPages = Math.ceil(filteredIdeasCount / ITEMS_PER_PAGE) || 1;

  // Handle card expand/collapse
  const handleCardClick = useCallback(
    (ideaId) => {
      if (expandedCard === ideaId) {
        setExpandedCard(null);
      } else {
        setExpandedCard(ideaId);
      }
    },
    [expandedCard]
  );

  // Handle marking interest
  const handleMarkInterested = useCallback(
    async (ideaId, e) => {
      e.stopPropagation();

      if (!stages.stage1_completed) {
        setError("You must complete Stage 1 before marking interest in projects.");
        return;
      }

      if (interestedIdeas.has(ideaId)) {
        setError("You have already marked interest in this project.");
        return;
      }

      try {
        setMarkingInterest(ideaId);
        setError(null);
        await markIndustryIdeaInterested(ideaId);
        
        setInterestedIdeas((prev) => new Set([...prev, ideaId]));
        
      } catch (error) {
        console.error("Failed to mark interest:", error);
        setError(error.message || "Failed to mark interest. Please try again.");
      } finally {
        setMarkingInterest(null);
      }
    },
    [stages.stage1_completed, interestedIdeas]
  );

  const SkeletonCard = () => (
    <Card className="border-primary/20 animate-pulse">
      <CardContent className="p-4">
        <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/student/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            FYDP Industry Ideas
          </h1>
          <p className="text-muted-foreground">
            Browse project ideas directly from Industry partners and express your interest.
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by title, description, or company..."
                  value={searchQuery}
                  onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <select
                value={selectedCompany}
                onChange={(e) => {
                  setSelectedCompany(e.target.value);
                  setCurrentPage(1);
                  setExpandedCard(null);
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-w-[180px]"
              >
                <option value="all">All Companies</option>
                {availableCompanies.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>

              <select
                value={sortFilter}
                onChange={(e) => {
                  setSortFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="az">Sort A-Z</option>
                <option value="za">Sort Z-A</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Industry Ideas</CardTitle>
                <CardDescription>
                  {loading
                    ? "Loading..."
                    : `${filteredIdeasCount} idea${filteredIdeasCount !== 1 ? "s" : ""} found`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : displayedIdeas.length > 0 ? (
              <div className="space-y-4">
                {displayedIdeas.map((idea) => {
                  const isExpanded = expandedCard === idea.idea_id;
                  const isInterested = interestedIdeas.has(idea.idea_id);

                  return (
                    <Card
                      key={idea.idea_id}
                      className="cursor-pointer transition-all duration-200 border-primary/10 hover:border-primary/30"
                      onClick={() => handleCardClick(idea.idea_id)}
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative">
                          <div className="flex-1 min-w-0 pr-8">
                            <h3 className="text-lg font-semibold text-foreground mb-1 leading-tight">
                              {idea.title}
                            </h3>
                            <div className="flex items-center text-sm text-muted-foreground mb-2">
                              <Building2 className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{idea.company_name}</span>
                            </div>
                            <p
                              className={`text-sm text-muted-foreground mt-2 ${
                                !isExpanded && "line-clamp-2"
                              }`}
                            >
                              {idea.description}
                            </p>
                          </div>

                          <div className="flex flex-col sm:items-end gap-2 shrink-0 self-start">
                            <Badge
                              variant="secondary"
                              className={
                                isInterested
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                                  : "bg-primary/10 text-primary hover:bg-primary/20"
                              }
                            >
                              {isInterested ? (
                                <>
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Interested
                                </>
                              ) : (
                                "Available"
                              )}
                            </Badge>
                            
                            <Button
                              variant={isInterested ? "outline" : "default"}
                              size="sm"
                              className="w-full sm:w-auto mt-2"
                              disabled={
                                !stages.stage1_completed ||
                                loadingInterests ||
                                isInterested ||
                                markingInterest === idea.idea_id
                              }
                              onClick={(e) => handleMarkInterested(idea.idea_id, e)}
                            >
                              {markingInterest === idea.idea_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : isInterested ? (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                  Marked
                                </>
                              ) : (
                                <>
                                  <Heart className="mr-2 h-4 w-4" />
                                  Express Interest
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Collapsible Content */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t animate-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="flex items-center text-sm font-semibold mb-2">
                                  <Code className="mr-2 h-4 w-4 text-primary" />
                                  Technology Stack
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {idea.technology_stack?.length > 0 ? (
                                    idea.technology_stack.map((tech, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="bg-accent"
                                      >
                                        {tech}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-sm text-muted-foreground">
                                      Not specified
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h4 className="flex items-center text-sm font-semibold mb-2">
                                  <Code className="mr-2 h-4 w-4 text-primary" />
                                  Expected Skills
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {idea.expected_skills?.length > 0 ? (
                                    idea.expected_skills.map((skill, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="bg-accent"
                                      >
                                        {skill}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-sm text-muted-foreground">
                                      Not specified
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Company Info */}
                            <div className="mt-4 bg-muted/50 p-3 rounded-md border text-sm">
                                <h4 className="font-semibold mb-1">About {idea.company_name} ({idea.company_type})</h4>
                                <p className="text-muted-foreground">{idea.company_description || "No description available."}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-2 flex justify-center">
                            {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-muted h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Ideas Found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search query or company filter.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6 mb-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FydpIndustryIdeas;
