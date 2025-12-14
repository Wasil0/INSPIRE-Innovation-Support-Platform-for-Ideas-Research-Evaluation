import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  User,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
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
import { mockPastIdeas } from "@/api/pastideas/mockPastIdeas";

// Configuration
const ITEMS_PER_PAGE = 20;

const PastIdeas = () => {
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortFilter, setSortFilter] = useState("year_desc");
  const [selectedYear, setSelectedYear] = useState("all");
  const [expandedCard, setExpandedCard] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Get unique years from mock data
  const availableYears = useMemo(() => {
    const years = [...new Set(mockPastIdeas.map((idea) => idea.year))].sort(
      (a, b) => b - a
    );
    return years;
  }, []);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
      setExpandedCard(null); // Collapse expanded card on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter and sort ideas
  const filteredAndSortedIdeas = useMemo(() => {
    let filtered = [...mockPastIdeas];

    // TODO: Replace with backend filtering
    // Backend should handle: GET /api/fydp/past-projects?search=...&year=...&sort=...

    // Apply year filter
    if (selectedYear !== "all") {
      filtered = filtered.filter((idea) => idea.year === parseInt(selectedYear));
    }

    // Apply search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (idea) =>
          idea.title.toLowerCase().includes(query) ||
          idea.advisorName.toLowerCase().includes(query) ||
          idea.description.toLowerCase().includes(query) ||
          idea.year.toString().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortFilter) {
        case "title_asc":
          return a.title.localeCompare(b.title);
        case "title_desc":
          return b.title.localeCompare(a.title);
        case "year_desc":
          return b.year - a.year;
        case "advisor_asc":
          return a.advisorName.localeCompare(b.advisorName);
        default:
          return 0;
      }
    });

    return filtered;
  }, [debouncedSearch, selectedYear, sortFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedIdeas.length / ITEMS_PER_PAGE);
  const paginatedIdeas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredAndSortedIdeas.slice(start, end);
  }, [filteredAndSortedIdeas, currentPage]);

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

  // Handle year tab change
  const handleYearChange = useCallback((year) => {
    setSelectedYear(year);
    setCurrentPage(1);
    setExpandedCard(null);
    setLoading(true);
    // Simulate loading when switching tabs
    setTimeout(() => setLoading(false), 300);
  }, []);

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
          onClick={() => navigate("/student/fydp-progress")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to FYDP Progress
        </Button>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Past FYDP Ideas
          </h1>
          <p className="text-muted-foreground">
            Browse previously completed projects for inspiration and ideas
          </p>
        </div>

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
                  placeholder="Search by title, advisor, description, or year..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Sort Filter */}
              <select
                value={sortFilter}
                onChange={(e) => {
                  setSortFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="year_desc">Sort by Year (Latest)</option>
                <option value="title_asc">Sort A-Z</option>
                <option value="title_desc">Sort Z-A</option>
                <option value="advisor_asc">Sort by Advisor</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Batch Year Tabs */}
        <Card className="mb-6 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleYearChange("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  selectedYear === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                All
              </button>
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearChange(year.toString())}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    selectedYear === year.toString()
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Past Ideas List */}
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Past Projects</CardTitle>
                <CardDescription>
                  {filteredAndSortedIdeas.length} project
                  {filteredAndSortedIdeas.length !== 1 ? "s" : ""} found
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
            ) : paginatedIdeas.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  No matching projects found
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedIdeas.map((idea) => {
                  const isExpanded = expandedCard === idea.id;

                  return (
                    <Card
                      key={idea.id}
                      className={`border-primary/20 transition-all duration-300 cursor-pointer ${
                        isExpanded
                          ? "bg-accent/50 shadow-md"
                          : "hover:bg-accent/30 hover:shadow-sm"
                      }`}
                      onClick={() => handleCardClick(idea.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3 mb-2">
                              <h3 className="font-semibold text-foreground text-base flex-1">
                                {idea.title}
                              </h3>
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <User className="h-4 w-4" />
                                <span>{idea.advisorName}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                <span>{idea.year}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Users className="h-4 w-4" />
                                <span>{idea.teamMembers.length} members</span>
                              </div>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-border space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div>
                                  <h4 className="text-sm font-semibold text-foreground mb-2">
                                    Description
                                  </h4>
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {idea.description}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-foreground mb-2">
                                    Team Members
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {idea.teamMembers.map((member, index) => (
                                      <Badge
                                        key={index}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {member}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
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
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
    </div>
  );
};

export default PastIdeas;

