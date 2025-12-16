import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  Briefcase,
  Lightbulb,
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import {
  getPendingIndustryIdeas,
  getApprovedIndustryIdeas,
  getPendingIndustryJobs,
  getApprovedIndustryJobs,
  updateIndustryIdeaStatus,
  updateIndustryJobStatus,
} from "@/api/committee";

const IndustryManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ideas");

  // Ideas state
  const [pendingIdeas, setPendingIdeas] = useState([]);
  const [approvedIdeas, setApprovedIdeas] = useState([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [ideaSearchQuery, setIdeaSearchQuery] = useState("");
  const [ideaCompanyTypeFilter, setIdeaCompanyTypeFilter] = useState("");
  const [ideaIndustryDomainFilter, setIdeaIndustryDomainFilter] = useState("");

  // Jobs state
  const [pendingJobs, setPendingJobs] = useState([]);
  const [approvedJobs, setApprovedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [jobCompanyTypeFilter, setJobCompanyTypeFilter] = useState("");
  const [jobIndustryDomainFilter, setJobIndustryDomainFilter] = useState("");

  // Action states
  const [processingId, setProcessingId] = useState(null);

  // Fetch data
  useEffect(() => {
    fetchIdeas();
    fetchJobs();
  }, []);

  const fetchIdeas = async () => {
    try {
      setLoadingIdeas(true);
      const [pending, approved] = await Promise.all([
        getPendingIndustryIdeas(),
        getApprovedIndustryIdeas(),
      ]);
      setPendingIdeas(pending || []);
      setApprovedIdeas(approved || []);
    } catch (error) {
      console.error("Failed to fetch ideas:", error);
    } finally {
      setLoadingIdeas(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      const [pending, approved] = await Promise.all([
        getPendingIndustryJobs(),
        getApprovedIndustryJobs(),
      ]);
      setPendingJobs(pending || []);
      setApprovedJobs(approved || []);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleApprove = async (id, type) => {
    try {
      setProcessingId(`${type}-${id}`);
      if (type === "idea") {
        await updateIndustryIdeaStatus(id, "approved");
      } else {
        await updateIndustryJobStatus(id, "approved");
      }
      // Refresh data
      if (type === "idea") {
        await fetchIdeas();
      } else {
        await fetchJobs();
      }
    } catch (error) {
      console.error("Failed to approve:", error);
      alert("Failed to approve. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id, type) => {
    try {
      setProcessingId(`${type}-${id}`);
      if (type === "idea") {
        await updateIndustryIdeaStatus(id, "rejected");
      } else {
        await updateIndustryJobStatus(id, "rejected");
      }
      // Refresh data
      if (type === "idea") {
        await fetchIdeas();
      } else {
        await fetchJobs();
      }
    } catch (error) {
      console.error("Failed to reject:", error);
      alert("Failed to reject. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  // Get unique filter values
  const getUniqueCompanyTypes = (items) => {
    const types = new Set();
    items.forEach((item) => {
      if (item.company_type) types.add(item.company_type);
    });
    return Array.from(types).sort();
  };

  const getUniqueIndustryDomains = (items) => {
    const domains = new Set();
    items.forEach((item) => {
      if (item.industry_domain) domains.add(item.industry_domain);
    });
    return Array.from(domains).sort();
  };

  // Filter functions
  const filterIdeas = (ideas) => {
    let filtered = ideas;

    // Search filter
    if (ideaSearchQuery) {
      const query = ideaSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (idea) =>
          idea.title?.toLowerCase().includes(query) ||
          idea.company_name?.toLowerCase().includes(query) ||
          idea.description?.toLowerCase().includes(query) ||
          idea.industry_domain?.toLowerCase().includes(query)
      );
    }

    // Company type filter
    if (ideaCompanyTypeFilter) {
      filtered = filtered.filter(
        (idea) => idea.company_type === ideaCompanyTypeFilter
      );
    }

    // Industry domain filter
    if (ideaIndustryDomainFilter) {
      filtered = filtered.filter(
        (idea) => idea.industry_domain === ideaIndustryDomainFilter
      );
    }

    return filtered;
  };

  const filterJobs = (jobs) => {
    let filtered = jobs;

    // Search filter
    if (jobSearchQuery) {
      const query = jobSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title?.toLowerCase().includes(query) ||
          job.company_name?.toLowerCase().includes(query) ||
          job.description?.toLowerCase().includes(query) ||
          job.industry_domain?.toLowerCase().includes(query)
      );
    }

    // Company type filter
    if (jobCompanyTypeFilter) {
      filtered = filtered.filter(
        (job) => job.company_type === jobCompanyTypeFilter
      );
    }

    // Industry domain filter
    if (jobIndustryDomainFilter) {
      filtered = filtered.filter(
        (job) => job.industry_domain === jobIndustryDomainFilter
      );
    }

    return filtered;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/faculty/committee/CommitteeDashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Industry FYDP Ideas & Job Posts
          </h1>
          <p className="text-muted-foreground">
            Review and manage industry-submitted ideas and job postings
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="ideas" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Ideas
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Jobs
            </TabsTrigger>
          </TabsList>

          {/* Ideas Tab */}
          <TabsContent value="ideas" className="space-y-6">
            {/* Search and Filters Card */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search & Filter
                </CardTitle>
                <CardDescription>
                  Find ideas by title, company, domain, or description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, company name, domain, or description..."
                    value={ideaSearchQuery}
                    onChange={(e) => setIdeaSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="idea-company-type">Company Type</Label>
                    <select
                      id="idea-company-type"
                      value={ideaCompanyTypeFilter}
                      onChange={(e) => setIdeaCompanyTypeFilter(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">All Company Types</option>
                      {getUniqueCompanyTypes([...pendingIdeas, ...approvedIdeas]).map(
                        (type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idea-industry-domain">Industry Domain</Label>
                    <select
                      id="idea-industry-domain"
                      value={ideaIndustryDomainFilter}
                      onChange={(e) => setIdeaIndustryDomainFilter(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">All Domains</option>
                      {getUniqueIndustryDomains([...pendingIdeas, ...approvedIdeas]).map(
                        (domain) => (
                          <option key={domain} value={domain}>
                            {domain}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {loadingIdeas ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Pending Ideas */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Lightbulb className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Pending Ideas</h2>
                      <p className="text-sm text-muted-foreground">
                        {filterIdeas(pendingIdeas).length} idea{filterIdeas(pendingIdeas).length !== 1 ? 's' : ''} awaiting review
                      </p>
                    </div>
                  </div>
                  {filterIdeas(pendingIdeas).length > 0 ? (
                    <div className="space-y-4">
                      {filterIdeas(pendingIdeas).map((idea) => (
                        <Card key={idea.idea_id} className="border-primary/20 transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
                          <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg mb-2">
                                  {idea.title}
                                </CardTitle>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {idea.company_name && (
                                    <Badge variant="outline" className="text-xs">
                                      {idea.company_name}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Badge variant="secondary" className="shrink-0">Pending</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4 pt-6">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {idea.description}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {idea.company_type && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Company Type:</span> {idea.company_type}
                                </p>
                              )}
                              {idea.industry_domain && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Industry Domain:</span> {idea.industry_domain}
                                </p>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {idea.gmail && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Contact:</span> {idea.gmail}
                                </p>
                              )}
                              {idea.location && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Location:</span> {idea.location}
                                </p>
                              )}
                              {idea.founded_year && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Founded:</span> {idea.founded_year}
                                </p>
                              )}
                            </div>
                            {idea.company_description && (
                              <p className="text-xs text-muted-foreground italic">
                                {idea.company_description}
                              </p>
                            )}
                            {idea.technology_stack?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold mb-1">
                                  Technology Stack:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {idea.technology_stack.map((tech, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {tech}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {idea.expected_skills?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold mb-1">
                                  Expected Skills:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {idea.expected_skills.map((skill, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(idea.idea_id, "idea")}
                                disabled={processingId === `idea-${idea.idea_id}`}
                                className="flex-1"
                              >
                                {processingId === `idea-${idea.idea_id}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(idea.idea_id, "idea")}
                                disabled={processingId === `idea-${idea.idea_id}`}
                                className="flex-1"
                              >
                                {processingId === `idea-${idea.idea_id}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-2" />
                                )}
                                Reject
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">
                          No pending ideas found
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Approved Ideas */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Approved Ideas</h2>
                      <p className="text-sm text-muted-foreground">
                        {filterIdeas(approvedIdeas).length} approved idea{filterIdeas(approvedIdeas).length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {filterIdeas(approvedIdeas).length > 0 ? (
                    <div className="space-y-4">
                      {filterIdeas(approvedIdeas).map((idea) => (
                        <Card key={idea.idea_id} className="border-primary/20 transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg">
                                  {idea.title}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {idea.company_name && (
                                    <Badge variant="outline" className="text-xs">
                                      {idea.company_name}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Badge className="bg-primary text-primary-foreground shrink-0">
                                Approved
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4 pt-6">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {idea.description}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {idea.company_type && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Company Type:</span> {idea.company_type}
                                </p>
                              )}
                              {idea.industry_domain && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Industry Domain:</span> {idea.industry_domain}
                                </p>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {idea.gmail && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Contact:</span> {idea.gmail}
                                </p>
                              )}
                              {idea.location && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Location:</span> {idea.location}
                                </p>
                              )}
                              {idea.founded_year && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Founded:</span> {idea.founded_year}
                                </p>
                              )}
                            </div>
                            {idea.company_description && (
                              <p className="text-xs text-muted-foreground italic">
                                {idea.company_description}
                              </p>
                            )}
                            {idea.technology_stack?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold mb-1">
                                  Technology Stack:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {idea.technology_stack.map((tech, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {tech}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {idea.expected_skills?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold mb-1">
                                  Expected Skills:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {idea.expected_skills.map((skill, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">
                          No approved ideas found
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            {/* Search and Filters Card */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search & Filter
                </CardTitle>
                <CardDescription>
                  Find job postings by title, company, domain, or description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, company name, domain, or description..."
                    value={jobSearchQuery}
                    onChange={(e) => setJobSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-company-type">Company Type</Label>
                    <select
                      id="job-company-type"
                      value={jobCompanyTypeFilter}
                      onChange={(e) => setJobCompanyTypeFilter(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">All Company Types</option>
                      {getUniqueCompanyTypes([...pendingJobs, ...approvedJobs]).map(
                        (type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-industry-domain">Industry Domain</Label>
                    <select
                      id="job-industry-domain"
                      value={jobIndustryDomainFilter}
                      onChange={(e) => setJobIndustryDomainFilter(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">All Domains</option>
                      {getUniqueIndustryDomains([...pendingJobs, ...approvedJobs]).map(
                        (domain) => (
                          <option key={domain} value={domain}>
                            {domain}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {loadingJobs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Pending Jobs */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Pending Jobs</h2>
                      <p className="text-sm text-muted-foreground">
                        {filterJobs(pendingJobs).length} job{filterJobs(pendingJobs).length !== 1 ? 's' : ''} awaiting review
                      </p>
                    </div>
                  </div>
                  {filterJobs(pendingJobs).length > 0 ? (
                    <div className="space-y-4">
                      {filterJobs(pendingJobs).map((job) => (
                        <Card key={job.job_id} className="border-primary/20 transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg">
                                  {job.title}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {job.company_name && (
                                    <Badge variant="outline" className="text-xs">
                                      {job.company_name}
                                    </Badge>
                                  )}
                                  {job.job_type && (
                                    <Badge variant="secondary" className="text-xs">
                                      {job.job_type}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Badge variant="secondary">Pending</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4 pt-6">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {job.description}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {job.company_type && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Company Type:</span> {job.company_type}
                                </p>
                              )}
                              {job.industry_domain && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Industry Domain:</span> {job.industry_domain}
                                </p>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {job.gmail && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Contact:</span> {job.gmail}
                                </p>
                              )}
                              {job.location && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Location:</span> {job.location}
                                </p>
                              )}
                              {job.amount && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Amount:</span> {job.amount}
                                </p>
                              )}
                              {job.duration && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Duration:</span> {job.duration}
                                </p>
                              )}
                              {job.founded_year && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Founded:</span> {job.founded_year}
                                </p>
                              )}
                            </div>
                            {job.company_description && (
                              <p className="text-xs text-muted-foreground italic">
                                {job.company_description}
                              </p>
                            )}
                            {job.technology_stack?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold mb-1">
                                  Technology Stack:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {job.technology_stack.map((tech, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {tech}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {job.expected_skills?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold mb-1">
                                  Expected Skills:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {job.expected_skills.map((skill, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(job.job_id, "job")}
                                disabled={processingId === `job-${job.job_id}`}
                                className="flex-1"
                              >
                                {processingId === `job-${job.job_id}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(job.job_id, "job")}
                                disabled={processingId === `job-${job.job_id}`}
                                className="flex-1"
                              >
                                {processingId === `job-${job.job_id}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-2" />
                                )}
                                Reject
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">
                          No pending jobs found
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Approved Jobs */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Approved Jobs</h2>
                      <p className="text-sm text-muted-foreground">
                        {filterJobs(approvedJobs).length} approved job{filterJobs(approvedJobs).length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {filterJobs(approvedJobs).length > 0 ? (
                    <div className="space-y-4">
                      {filterJobs(approvedJobs).map((job) => (
                        <Card key={job.job_id} className="border-primary/20 transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg">
                                  {job.title}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {job.company_name && (
                                    <Badge variant="outline" className="text-xs">
                                      {job.company_name}
                                    </Badge>
                                  )}
                                  {job.job_type && (
                                    <Badge variant="secondary" className="text-xs">
                                      {job.job_type}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Badge className="bg-primary text-primary-foreground shrink-0">
                                Approved
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4 pt-6">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {job.description}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {job.company_type && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Company Type:</span> {job.company_type}
                                </p>
                              )}
                              {job.industry_domain && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Industry Domain:</span> {job.industry_domain}
                                </p>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {job.gmail && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Contact:</span> {job.gmail}
                                </p>
                              )}
                              {job.location && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Location:</span> {job.location}
                                </p>
                              )}
                              {job.amount && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Amount:</span> {job.amount}
                                </p>
                              )}
                              {job.duration && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Duration:</span> {job.duration}
                                </p>
                              )}
                              {job.founded_year && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold">Founded:</span> {job.founded_year}
                                </p>
                              )}
                            </div>
                            {job.company_description && (
                              <p className="text-xs text-muted-foreground italic">
                                {job.company_description}
                              </p>
                            )}
                            {job.technology_stack?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold mb-1">
                                  Technology Stack:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {job.technology_stack.map((tech, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {tech}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {job.expected_skills?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold mb-1">
                                  Expected Skills:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {job.expected_skills.map((skill, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">
                          No approved jobs found
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default IndustryManagement;

