import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  Code,
  BookOpen,
  Heart,
  CheckCircle2,
  AlertCircle,
  X,
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
import { getAdvisorIdeas, markInterested, getFlowchartImageUrl, getMyTeamInterests } from "@/api/advisorIdeas";
import { getMyStages } from "@/api/student";

// Configuration
const ITEMS_PER_PAGE = 10;

const FydpAdvisorIdeas = () => {
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortFilter, setSortFilter] = useState("az");
  const [selectedAdvisor, setSelectedAdvisor] = useState("all");
  const [availableAdvisors, setAvailableAdvisors] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalIdeas, setTotalIdeas] = useState(0);
  const [filteredIdeasCount, setFilteredIdeasCount] = useState(0);
  const [stages, setStages] = useState({
    stage1_completed: false,
    stage2_completed: false,
  });
  const [loadingStages, setLoadingStages] = useState(true);
  const [interestedIdeas, setInterestedIdeas] = useState(new Set());
  const [loadingInterests, setLoadingInterests] = useState(false);
  const [markingInterest, setMarkingInterest] = useState(null);
  const [error, setError] = useState(null);
  const [enlargedImage, setEnlargedImage] = useState(null);

  // Fetch stage status and existing interests
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingStages(true);
        
        // Fetch stages
        const stagesResponse = await getMyStages();
        // getMyStages returns { user_id, stages: { stage1_completed, ... } }
        setStages(stagesResponse.stages || { stage1_completed: false, stage2_completed: false });
        
        // Fetch existing interests if stage 1 is completed
        if (stagesResponse.stages?.stage1_completed) {
          try {
            setLoadingInterests(true);
            const interests = await getMyTeamInterests();
            // Extract project_id from interests array
            // The API returns an array of interest objects with project_id field
            const interestedIds = new Set(
              interests.map((interest) => {
                // Handle both string and ObjectId formats
                return typeof interest.project_id === 'string' 
                  ? interest.project_id 
                  : String(interest.project_id);
              })
            );
            setInterestedIdeas(interestedIds);
          } catch (error) {
            console.error("Failed to fetch existing interests:", error);
            // Don't fail the whole page if interests can't be fetched
            // User might not be in a team yet
            setInterestedIdeas(new Set()); // Reset to empty set on error
          } finally {
            setLoadingInterests(false);
          }
        } else {
          setInterestedIdeas(new Set()); // Clear interests if stage 1 not completed
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

  // Fetch all advisors on mount to populate the dropdown
  useEffect(() => {
    const fetchAllAdvisors = async () => {
      try {
        // Fetch ideas with max allowed limit (50) to get advisors
        // We'll fetch multiple pages if needed
        const uniqueAdvisors = new Map();
        let page = 1;
        let hasMore = true;
        const maxLimit = 50; // Backend max limit

        while (hasMore && page <= 10) { // Limit to 10 pages to avoid infinite loops
          const response = await getAdvisorIdeas({
            sort: "az",
            page: page,
            limit: maxLimit,
          });

          // Extract unique advisors from ideas
          response.ideas.forEach((idea) => {
            if (idea.advisor_id && idea.advisor_name) {
              if (!uniqueAdvisors.has(idea.advisor_id)) {
                uniqueAdvisors.set(idea.advisor_id, {
                  id: idea.advisor_id,
                  name: idea.advisor_name,
                });
              }
            }
          });

          // Check if there are more pages
          hasMore = page < response.pages;
          page++;
        }

        setAvailableAdvisors(Array.from(uniqueAdvisors.values()));
      } catch (error) {
        console.error("Failed to fetch advisors:", error);
        // Don't fail the whole page if this fails
      }
    };

    fetchAllAdvisors();
  }, []);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
      setExpandedCard(null); // Collapse expanded card on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch ideas from API
  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Convert sort filter to API format
        let apiSort = null;
        if (sortFilter === "az") {
          apiSort = "az";
        } else if (sortFilter === "za") {
          apiSort = "za";
        }

        // If there's a search query, we need to fetch all matching ideas to filter and count
        // Otherwise, just fetch the current page
        if (debouncedSearch.trim()) {
          // Fetch all ideas matching the advisor filter to search through
          const allMatchingIdeas = [];
          let page = 1;
          let hasMore = true;
          const maxLimit = 50; // Backend max limit

          while (hasMore && page <= 20) { // Limit to 20 pages
            const pageResponse = await getAdvisorIdeas({
              advisor_id: selectedAdvisor !== "all" ? selectedAdvisor : null,
              sort: apiSort,
              page: page,
              limit: maxLimit,
            });

            allMatchingIdeas.push(...pageResponse.ideas);
            hasMore = page < pageResponse.pages;
            page++;
          }

          // Filter by search query
          const searchLower = debouncedSearch.toLowerCase();
          const filtered = allMatchingIdeas.filter((idea) => {
            const titleMatch = idea.title?.toLowerCase().includes(searchLower);
            const descMatch = idea.description?.toLowerCase().includes(searchLower);
            const domainMatch = idea.domain?.some((d) =>
              d.toLowerCase().includes(searchLower)
            );
            const skillsMatch = idea.skills_required?.some((s) =>
              s.toLowerCase().includes(searchLower)
            );
            const advisorMatch = idea.advisor_name?.toLowerCase().includes(searchLower);
            return titleMatch || descMatch || domainMatch || skillsMatch || advisorMatch;
          });

          // Paginate the filtered results
          const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
          const endIndex = startIndex + ITEMS_PER_PAGE;
          const paginatedIdeas = filtered.slice(startIndex, endIndex);

          setIdeas(paginatedIdeas);
          setFilteredIdeasCount(filtered.length);
          setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1);
          setTotalIdeas(filtered.length);
        } else {
          // No search query, use backend pagination
          const response = await getAdvisorIdeas({
            advisor_id: selectedAdvisor !== "all" ? selectedAdvisor : null,
            sort: apiSort,
            page: currentPage,
            limit: ITEMS_PER_PAGE,
          });

          setIdeas(response.ideas);
          setFilteredIdeasCount(response.total || 0);
          setTotalPages(response.pages || 1);
          setTotalIdeas(response.total || 0);
        }
      } catch (error) {
        console.error("Failed to fetch advisor ideas:", error);
        setError("Failed to load advisor ideas. Please try again.");
        setIdeas([]);
        setTotalPages(0);
        setTotalIdeas(0);
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, [debouncedSearch, currentPage, sortFilter, selectedAdvisor]);

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
      e.stopPropagation(); // Prevent card expansion

      if (!stages.stage1_completed) {
        setError("You must complete Stage 1 before marking interest in projects.");
        return;
      }
      if (stages.stage2_completed) {
        setError("You have already completed Stage 2 and cannot mark interest in new projects.");
        return;
      }

      if (interestedIdeas.has(ideaId)) {
        setError("You have already marked interest in this project.");
        return;
      }

      try {
        setMarkingInterest(ideaId);
        setError(null);
        const response = await markInterested(ideaId);
        
        // Add to interested set
        setInterestedIdeas((prev) => new Set([...prev, ideaId]));
      } catch (error) {
        console.error("Failed to mark interest:", error);
        const errorMessage = error.message || "Failed to mark interest. Please try again.";
        setError(errorMessage);
      } finally {
        setMarkingInterest(null);
      }
    },
    [stages.stage1_completed, interestedIdeas]
  );

  // Refresh interests when ideas change (in case new ideas are loaded)
  useEffect(() => {
    const refreshInterests = async () => {
      if (stages.stage1_completed && !loadingStages && !loadingInterests) {
        try {
          const interests = await getMyTeamInterests();
          const interestedIds = new Set(
            interests.map((interest) => {
              // Handle both string and ObjectId formats
              return typeof interest.project_id === 'string' 
                ? interest.project_id 
                : String(interest.project_id);
            })
          );
          setInterestedIdeas(interestedIds);
        } catch (error) {
          console.error("Failed to refresh interests:", error);
          // Silently fail - user might not be in a team
        }
      }
    };

    // Only refresh if we have ideas loaded and stage 1 is completed
    if (ideas.length > 0 && stages.stage1_completed) {
      refreshInterests();
    }
  }, [ideas.length, stages.stage1_completed, loadingStages, loadingInterests]);

  // Skeleton loader
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

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/student/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            FYDP Advisor Ideas
          </h1>
          <p className="text-muted-foreground">
            Browse project ideas from advisors and express your interest
          </p>
        </div>

        {/* Error Message */}
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

        {/* Search and Filters */}
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by title, description, domain, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Advisor Filter */}
              <select
                value={selectedAdvisor}
                onChange={(e) => {
                  setSelectedAdvisor(e.target.value);
                  setCurrentPage(1);
                  setExpandedCard(null);
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-w-[180px]"
              >
                <option value="all">All Advisors</option>
                {availableAdvisors.map((advisor) => (
                  <option key={advisor.id} value={advisor.id}>
                    {advisor.name}
                  </option>
                ))}
              </select>

              {/* Sort Filter */}
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

        {/* Advisor Ideas List */}
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Advisor Ideas</CardTitle>
                <CardDescription>
                  {loading
                    ? "Loading..."
                    : debouncedSearch.trim()
                    ? `${filteredIdeasCount} idea${filteredIdeasCount !== 1 ? "s" : ""} found`
                    : `${totalIdeas} idea${totalIdeas !== 1 ? "s" : ""} found`}
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
            ) : ideas.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  {debouncedSearch
                    ? "No matching ideas found"
                    : "No advisor ideas available"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {ideas.map((idea) => {
                  const isExpanded = expandedCard === idea.idea_id;
                  const isInterested = interestedIdeas.has(idea.idea_id);
                  const canMarkInterest =
                    !loadingStages && stages.stage1_completed;
                  const imageUrl = idea.flowchart_image
                    ? getFlowchartImageUrl(idea.flowchart_image)
                    : null;

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
                              {idea.title || "Untitled Idea"}
                            </h3>
                            <div className="flex items-center text-sm text-muted-foreground mb-2">
                              <User className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{idea.advisor_name || "Unknown Advisor"}</span>
                            </div>
                            <p
                              className={`text-sm text-muted-foreground mt-2 ${
                                !isExpanded && "line-clamp-2"
                              }`}
                            >
                              {idea.description || "No description available."}
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
                                stages.stage2_completed ||
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
                            {/* Flow Explanation */}
                            {idea.flow_explanation && (
                              <div className="mb-4">
                                <h4 className="flex items-center text-sm font-semibold mb-2">
                                  <BookOpen className="mr-2 h-4 w-4 text-primary" />
                                  Flow Explanation
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {idea.flow_explanation}
                                </p>
                              </div>
                            )}

                            {/* Flowchart Image */}
                            {imageUrl && (
                              <div className="mb-4">
                                <h4 className="flex items-center text-sm font-semibold mb-2">
                                  <BookOpen className="mr-2 h-4 w-4 text-primary" />
                                  Flowchart
                                </h4>
                                <div className="rounded-lg border border-border overflow-hidden bg-muted/50 max-w-md cursor-pointer hover:opacity-90 transition-opacity">
                                  <img
                                    src={imageUrl}
                                    alt="Flowchart"
                                    className="w-full h-auto object-contain max-h-96"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEnlargedImage(imageUrl);
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Domain Tags */}
                              <div>
                                <h4 className="flex items-center text-sm font-semibold mb-2">
                                  <Code className="mr-2 h-4 w-4 text-primary" />
                                  Domains
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {idea.domain && idea.domain.length > 0 ? (
                                    idea.domain.map((domain, index) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="bg-accent"
                                      >
                                        {domain}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-sm text-muted-foreground">
                                      Not specified
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Skills Required */}
                              <div>
                                <h4 className="flex items-center text-sm font-semibold mb-2">
                                  <Code className="mr-2 h-4 w-4 text-primary" />
                                  Expected Skills
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {idea.skills_required && idea.skills_required.length > 0 ? (
                                    idea.skills_required.map((skill, index) => (
                                      <Badge
                                        key={index}
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

                            {/* Stage Notes */}
                            {!loadingStages && !stages.stage1_completed && (
                              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium text-foreground">
                                    Note:
                                  </span>{" "}
                                  You must complete Stage 1 (Group Formation) to mark interest in advisor projects.
                                </p>
                              </div>
                            )}

                            {!loadingStages && stages.stage2_completed && (
                              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium text-foreground">
                                    Note:
                                  </span>{" "}
                                  You have already completed Stage 2. You cannot mark interest in new projects.
                                </p>
                              </div>
                            )}
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
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-background/90 hover:bg-background border border-border shadow-lg"
              onClick={() => setEnlargedImage(null)}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Enlarged Image */}
            <div className="rounded-lg border border-border overflow-hidden bg-background shadow-2xl max-w-full max-h-full">
              <img
                src={enlargedImage}
                alt="Flowchart - Enlarged"
                className="w-full h-full object-contain max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FydpAdvisorIdeas;
