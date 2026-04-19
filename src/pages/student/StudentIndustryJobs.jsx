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
  Briefcase,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck2
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
import { getApprovedIndustryJobs, applyForIndustryJob, getMyAppliedJobs } from "@/api/industryJobs";

// Configuration
const ITEMS_PER_PAGE = 10;

const StudentIndustryJobs = () => {
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortFilter, setSortFilter] = useState("az");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [applicationFilter, setApplicationFilter] = useState("all"); // 'all', 'applied', 'not_applied'
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [allJobs, setAllJobs] = useState([]);
  const [displayedJobs, setDisplayedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [loadingApps, setLoadingApps] = useState(false);
  const [submittingApp, setSubmittingApp] = useState(null);
  const [error, setError] = useState(null);

  // Fetch all jobs and current user's applications
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadingApps(true);
        setError(null);
        
        // Fetch Parallel
        const [jobsResponse, appsResponse] = await Promise.all([
            getApprovedIndustryJobs(),
            getMyAppliedJobs().catch(e => {
                console.error("Failed to fetch applications:", e);
                return [];
            })
        ]);

        setAllJobs(jobsResponse);
        
        const appliedIds = new Set(
            appsResponse.map((app) => {
              return typeof app.job_id === 'string' 
                ? app.job_id 
                : String(app.job_id);
            })
        );
        setAppliedJobs(appliedIds);
        
        // Extract unique companies
        const uniqueCompanies = new Set();
        jobsResponse.forEach(job => {
            if(job.company_name) {
                uniqueCompanies.add(job.company_name);
            }
        });
        setAvailableCompanies(Array.from(uniqueCompanies).sort());
      } catch (err) {
        console.error("Failed to fetch industry jobs:", err);
        setError("Failed to load industry jobs. Please try again.");
      } finally {
        setLoading(false);
        setLoadingApps(false);
      }
    };

    fetchData();
  }, []);

  // Filter, search, sort and paginate locally
  useEffect(() => {
    let result = [...allJobs];

    // Filter by Application Status
    if (applicationFilter === "applied") {
        result = result.filter(job => appliedJobs.has(job.job_id));
    } else if (applicationFilter === "not_applied") {
        result = result.filter(job => !appliedJobs.has(job.job_id));
    }

    // Filter by company
    if (selectedCompany !== "all") {
        result = result.filter(job => job.company_name === selectedCompany);
    }

    // Filter by search
    if (searchQuery.trim() !== "") {
        const searchLower = searchQuery.toLowerCase();
        result = result.filter(job => {
            const titleMatch = job.title?.toLowerCase().includes(searchLower);
            const descMatch = job.description?.toLowerCase().includes(searchLower);
            const companyMatch = job.company_name?.toLowerCase().includes(searchLower);
            const jobTypeMatch = job.job_type?.toLowerCase().includes(searchLower);
            const stackMatch = job.technology_stack?.some((d) => d.toLowerCase().includes(searchLower));
            const skillsMatch = job.expected_skills?.some((s) => s.toLowerCase().includes(searchLower));
            return titleMatch || descMatch || companyMatch || stackMatch || skillsMatch || jobTypeMatch;
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
    setDisplayedJobs(result.slice(startIndex, endIndex));

  }, [allJobs, searchQuery, selectedCompany, sortFilter, currentPage, applicationFilter, appliedJobs]);

  const filteredJobsCount = useMemo(() => {
    let result = [...allJobs];

    if (applicationFilter === "applied") {
        result = result.filter(job => appliedJobs.has(job.job_id));
    } else if (applicationFilter === "not_applied") {
        result = result.filter(job => !appliedJobs.has(job.job_id));
    }

    if (selectedCompany !== "all") {
        result = result.filter(job => job.company_name === selectedCompany);
    }
    if (searchQuery.trim() !== "") {
        const searchLower = searchQuery.toLowerCase();
        result = result.filter(job => {
            const titleMatch = job.title?.toLowerCase().includes(searchLower);
            const descMatch = job.description?.toLowerCase().includes(searchLower);
            const companyMatch = job.company_name?.toLowerCase().includes(searchLower);
            return titleMatch || descMatch || companyMatch;
        });
    }
    return result.length;
  }, [allJobs, searchQuery, selectedCompany, applicationFilter, appliedJobs]);

  const totalPages = Math.ceil(filteredJobsCount / ITEMS_PER_PAGE) || 1;

  // Handle card expand/collapse
  const handleCardClick = useCallback(
    (jobId) => {
      if (expandedCard === jobId) {
        setExpandedCard(null);
      } else {
        setExpandedCard(jobId);
      }
    },
    [expandedCard]
  );

  // Handle apply logic
  const handleApply = useCallback(
    async (jobId, e) => {
      e.stopPropagation();

      if (appliedJobs.has(jobId)) {
        setError("You have already applied to this job.");
        return;
      }

      try {
        setSubmittingApp(jobId);
        setError(null);
        await applyForIndustryJob(jobId);
        
        setAppliedJobs((prev) => new Set([...prev, jobId]));
        
      } catch (error) {
        console.error("Failed to apply:", error);
        setError(error.message || "Failed to submit application. Please try again.");
      } finally {
        setSubmittingApp(null);
      }
    },
    [appliedJobs]
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
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
             Job Opportunities
          </h1>
          <p className="text-muted-foreground">
            Explore and apply to careers directly from Industry partners.
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <select
                value={applicationFilter}
                onChange={(e) => {
                  setApplicationFilter(e.target.value);
                  setCurrentPage(1);
                  setExpandedCard(null);
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All Postings</option>
                <option value="applied">Already Applied</option>
                <option value="not_applied">Not Applied</option>
              </select>

              <select
                value={selectedCompany}
                onChange={(e) => {
                  setSelectedCompany(e.target.value);
                  setCurrentPage(1);
                  setExpandedCard(null);
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                <CardTitle>Open Positions</CardTitle>
                <CardDescription>
                  {loading
                    ? "Loading..."
                    : `${filteredJobsCount} job${filteredJobsCount !== 1 ? "s" : ""} found`}
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
            ) : displayedJobs.length > 0 ? (
              <div className="space-y-4">
                {displayedJobs.map((job) => {
                  const isExpanded = expandedCard === job.job_id;
                  const isApplied = appliedJobs.has(job.job_id);

                  return (
                    <Card
                      key={job.job_id}
                      className="cursor-pointer transition-all duration-200 border-primary/10 hover:border-primary/30"
                      onClick={() => handleCardClick(job.job_id)}
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative">
                          <div className="flex-1 min-w-0 pr-8">
                            <h3 className="text-lg font-semibold text-foreground mb-1 leading-tight flex items-center gap-2">
                              {job.title}
                              <Badge variant="outline" className="text-xs ml-2 font-normal">
                                {job.job_type}
                              </Badge>
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2 mt-1">
                              <span className="flex items-center">
                                  <Building2 className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="truncate">{job.company_name}</span>
                              </span>
                              {job.duration && (
                                <span className="flex items-center">
                                  <Clock className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
                                  {job.duration}
                                </span>
                              )}
                              {job.amount && (
                                <span className="flex items-center">
                                  <DollarSign className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
                                  {job.amount}
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-sm text-muted-foreground mt-2 ${
                                !isExpanded && "line-clamp-2"
                              }`}
                            >
                              {job.description}
                            </p>
                          </div>

                          <div className="flex flex-col sm:items-end gap-2 shrink-0 self-start">
                            <Badge
                              variant="secondary"
                              className={
                                isApplied
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                                  : "bg-primary/10 text-primary hover:bg-primary/20"
                              }
                            >
                              {isApplied ? (
                                <>
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Applied
                                </>
                              ) : (
                                "Open"
                              )}
                            </Badge>
                            
                            <Button
                              variant={isApplied ? "outline" : "default"}
                              size="sm"
                              className="w-full sm:w-auto mt-2"
                              disabled={
                                loadingApps ||
                                isApplied ||
                                submittingApp === job.job_id
                              }
                              onClick={(e) => handleApply(job.job_id, e)}
                            >
                              {submittingApp === job.job_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : isApplied ? (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                  Application Submitted
                                </>
                              ) : (
                                <>
                                  <FileCheck2 className="mr-2 h-4 w-4" />
                                  Apply Now
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
                                  {job.technology_stack?.length > 0 ? (
                                    job.technology_stack.map((tech, idx) => (
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
                                  <Briefcase className="mr-2 h-4 w-4 text-primary" />
                                  Required Skills
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {job.expected_skills?.length > 0 ? (
                                    job.expected_skills.map((skill, idx) => (
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
                                <h4 className="font-semibold mb-1">About {job.company_name} ({job.company_type || 'Company'})</h4>
                                <p className="text-muted-foreground">{job.company_description || "No description available."}</p>
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
                <h3 className="text-lg font-semibold mb-2">No Jobs Found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search query, filters, or company.
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

export default StudentIndustryJobs;
