import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  Code,
  BookOpen,
  X,
  Filter,
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
import { getAdvisorIdeas, getFlowchartImageUrl } from "@/api/advisorIdeas";
import { getAdvisorInfo } from "@/api/advisors";

// Configuration
const ITEMS_PER_PAGE = 10;

const ViewIdeas = () => {
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortFilter, setSortFilter] = useState("az");
  const [expandedCard, setExpandedCard] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalIdeas, setTotalIdeas] = useState(0);
  const [advisorId, setAdvisorId] = useState(null);
  const [loadingAdvisorId, setLoadingAdvisorId] = useState(true);
  const [error, setError] = useState(null);
  const [enlargedImage, setEnlargedImage] = useState(null);

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

  // Fetch ideas when advisor ID is available
  useEffect(() => {
    if (!advisorId) return;

    const fetchIdeas = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getAdvisorIdeas({
          advisor_id: advisorId,
          sort: sortFilter,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
        });
        setIdeas(response.ideas || []);
        setTotalPages(response.pages || 0);
        setTotalIdeas(response.total || 0);
      } catch (error) {
        console.error("Failed to fetch ideas:", error);
        setError("Failed to load ideas. Please try again.");
        setIdeas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, [advisorId, sortFilter, currentPage]);

  // Client-side search filtering
  const filteredIdeas = useMemo(() => {
    if (!searchQuery.trim()) {
      return ideas;
    }

    const query = searchQuery.toLowerCase();
    return ideas.filter(
      (idea) =>
        idea.title?.toLowerCase().includes(query) ||
        idea.description?.toLowerCase().includes(query) ||
        idea.flow_explanation?.toLowerCase().includes(query) ||
        idea.domain?.some((d) => d.toLowerCase().includes(query)) ||
        idea.skills_required?.some((s) => s.toLowerCase().includes(query))
    );
  }, [ideas, searchQuery]);

  // Handle card click to expand/collapse
  const handleCardClick = (ideaId) => {
    setExpandedCard(expandedCard === ideaId ? null : ideaId);
  };

  // Handle image click to enlarge
  const handleImageClick = (imageId) => {
    if (imageId) {
      setEnlargedImage(getFlowchartImageUrl(imageId));
    }
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortFilter]);

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
            Your FYDP Ideas
          </h1>
          <p className="text-muted-foreground">
            View and manage all the ideas you have posted
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-500/50 bg-red-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <X className="h-5 w-5" />
                <p className="font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="mb-6 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search ideas by title, description, domain, or skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background"
                  />
                </div>
              </div>

              {/* Sort Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={sortFilter}
                  onChange={(e) => {
                    setSortFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-w-[150px]"
                >
                  <option value="az">Sort A-Z</option>
                  <option value="za">Sort Z-A</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ideas List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredIdeas.length === 0 ? (
          <Card className="border-primary/20">
            <CardContent className="pt-12 pb-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery
                  ? "No ideas found"
                  : totalIdeas === 0
                  ? "No ideas posted yet"
                  : "No ideas match your search"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search query"
                  : totalIdeas === 0
                  ? "Start by posting your first FYDP idea"
                  : "No ideas match your current filters"}
              </p>
              {totalIdeas === 0 && (
                <Button onClick={() => navigate("/faculty/advisor/post-idea")}>
                  Post Your First Idea
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {filteredIdeas.map((idea) => {
                const isExpanded = expandedCard === idea.idea_id;
                const imageUrl = idea.flowchart_image
                  ? getFlowchartImageUrl(idea.flowchart_image)
                  : null;

                return (
                  <Card
                    key={idea.idea_id}
                    className={`transition-all duration-300 border-primary/20 cursor-pointer hover:shadow-md ${
                      isExpanded ? "shadow-lg" : ""
                    }`}
                    onClick={() => handleCardClick(idea.idea_id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <CardTitle className="text-lg">
                              {idea.title}
                            </CardTitle>
                            {idea.source_type === "industry" && (
                              <Badge variant="secondary" className="text-xs">
                                Industry: {idea.industry_name}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {idea.domain?.slice(0, 3).map((domain, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-primary/20 text-primary text-xs"
                              >
                                {domain}
                              </Badge>
                            ))}
                            {idea.domain?.length > 3 && (
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                +{idea.domain.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-0 space-y-4">
                        {/* Description */}
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Description
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {idea.description}
                          </p>
                        </div>

                        {/* Flow Explanation */}
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            Flow Explanation
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {idea.flow_explanation}
                          </p>
                        </div>

                        {/* Flowchart Image */}
                        {imageUrl && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">
                              Flowchart
                            </h4>
                            <div
                              className="relative rounded-lg border overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImageClick(idea.flowchart_image);
                              }}
                            >
                              <img
                                src={imageUrl}
                                alt="Flowchart"
                                className="w-full max-w-md max-h-96 object-contain mx-auto"
                              />
                            </div>
                          </div>
                        )}

                        {/* Domains */}
                        {idea.domain && idea.domain.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">
                              Domains
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {idea.domain.map((domain, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="bg-primary/20 text-primary"
                                >
                                  {domain}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Skills Required */}
                        {idea.skills_required &&
                          idea.skills_required.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">
                                Technical Skills Required
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {idea.skills_required.map((skill, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="bg-muted"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {!searchQuery && totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing page {currentPage} of {totalPages} (
                  {totalIdeas} total ideas)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
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

            {/* Search Results Info */}
            {searchQuery && (
              <div className="text-sm text-muted-foreground text-center">
                Found {filteredIdeas.length} idea
                {filteredIdeas.length !== 1 ? "s" : ""} matching your search
              </div>
            )}
          </>
        )}
      </div>

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative p-4 bg-card rounded-lg shadow-lg max-w-full max-h-[90vh] overflow-auto">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-foreground hover:bg-accent"
              onClick={() => setEnlargedImage(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            <img
              src={enlargedImage}
              alt="Enlarged Flowchart"
              className="max-w-full max-h-[80vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewIdeas;
