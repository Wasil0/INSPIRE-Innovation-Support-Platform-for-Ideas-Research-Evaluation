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
  MapPin,
  Mail,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Globe,
  AlertCircle,
  FileText,
  ChevronRight,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  // Detail panel state
  const [activeItem, setActiveItem] = useState(null); // { data, type: 'idea'|'job', isPending: bool }
  const [processingId, setProcessingId] = useState(null);

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
      setActiveItem(null);
      if (type === "idea") await fetchIdeas();
      else await fetchJobs();
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
      setActiveItem(null);
      if (type === "idea") await fetchIdeas();
      else await fetchJobs();
    } catch (error) {
      console.error("Failed to reject:", error);
      alert("Failed to reject. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  // --- Filter helpers ---
  const getUniqueValues = (items, key) => {
    const values = new Set();
    items.forEach((item) => { if (item[key]) values.add(item[key]); });
    return Array.from(values).sort();
  };

  const applyFilter = (items, searchQuery, companyTypeFilter, industryDomainFilter) => {
    let filtered = items;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.company_name?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.industry_domain?.toLowerCase().includes(q)
      );
    }
    if (companyTypeFilter) {
      filtered = filtered.filter((item) => item.company_type === companyTypeFilter);
    }
    if (industryDomainFilter) {
      filtered = filtered.filter((item) => item.industry_domain === industryDomainFilter);
    }
    return filtered;
  };

  const filteredPendingIdeas = applyFilter(pendingIdeas, ideaSearchQuery, ideaCompanyTypeFilter, ideaIndustryDomainFilter);
  const filteredApprovedIdeas = applyFilter(approvedIdeas, ideaSearchQuery, ideaCompanyTypeFilter, ideaIndustryDomainFilter);
  const filteredPendingJobs = applyFilter(pendingJobs, jobSearchQuery, jobCompanyTypeFilter, jobIndustryDomainFilter);
  const filteredApprovedJobs = applyFilter(approvedJobs, jobSearchQuery, jobCompanyTypeFilter, jobIndustryDomainFilter);

  // --- Reusable summary card ---
  const SummaryCard = ({ item, type, isPending }) => {
    const itemId = type === "idea" ? item.idea_id : item.job_id;
    return (
      <Card
        className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-md border-primary/20 cursor-pointer"
        onClick={() => setActiveItem({ data: item, type, isPending })}
      >
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start mb-2">
            {isPending ? (
              <Badge variant="secondary">
                <Clock className="w-3 h-3 mr-1" /> Pending
              </Badge>
            ) : (
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
              </Badge>
            )}
          </div>
          <CardTitle className="text-xl line-clamp-2 leading-tight">
            {item.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {item.description || "No description provided."}
          </p>

          {/* Company info */}
          {item.company_name && (
            <div className="space-y-1.5 mt-auto pt-4 border-t">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Company</p>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm font-medium truncate">{item.company_name}</p>
              </div>
            </div>
          )}

          {/* Tags row */}
          <div className="space-y-1.5 pt-4 border-t">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
              {type === "idea" ? "Domain & Tech" : "Job Details"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.industry_domain && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {item.industry_domain}
                </Badge>
              )}
              {item.company_type && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {item.company_type}
                </Badge>
              )}
              {type === "job" && item.job_type && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {item.job_type}
                </Badge>
              )}
            </div>
          </div>

          <div className="pt-4 mt-auto">
            <Button
              className="w-full"
              variant={isPending ? "default" : "outline"}
              onClick={(e) => {
                e.stopPropagation();
                setActiveItem({ data: item, type, isPending });
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              {isPending ? "Review Submission" : "View Details"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // --- Search/Filter bar (reusable) ---
  const SearchFilterBar = ({ searchQuery, setSearchQuery, companyTypeFilter, setCompanyTypeFilter, industryDomainFilter, setIndustryDomainFilter, allItems }) => (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search & Filter
        </CardTitle>
        <CardDescription>
          Find submissions by title, company, domain, or description
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, company name, domain, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Company Type</Label>
            <select
              value={companyTypeFilter}
              onChange={(e) => setCompanyTypeFilter(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Company Types</option>
              {getUniqueValues(allItems, "company_type").map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Industry Domain</Label>
            <select
              value={industryDomainFilter}
              onChange={(e) => setIndustryDomainFilter(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Domains</option>
              {getUniqueValues(allItems, "industry_domain").map((domain) => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // --- Section header ---
  const SectionHeader = ({ icon: Icon, title, count }) => (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">
          {count} {count === 1 ? "submission" : "submissions"}
        </p>
      </div>
    </div>
  );

  // --- Empty state ---
  const EmptyState = ({ icon: Icon, message }) => (
    <div className="text-center py-16 bg-card border rounded-lg shadow-sm">
      <Icon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium">Nothing Here Yet</h3>
      <p className="text-muted-foreground mt-2 max-w-sm mx-auto">{message}</p>
    </div>
  );

  // --- Detail metadata row ---
  const MetaRow = ({ icon: Icon, label, value }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3">
        <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div>
          <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-0.5">{label}</span>
          <p className="text-sm font-medium">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <Button
          variant="ghost"
          onClick={() => navigate("/faculty/committee/CommitteeDashboard")}
          className="mb-6 -ml-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Industry FYDP Ideas & Job Posts
          </h1>
          <p className="text-muted-foreground">
            Review and manage industry-submitted ideas and job postings.
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

          {/* ========== IDEAS TAB ========== */}
          <TabsContent value="ideas" className="space-y-8">
            <SearchFilterBar
              searchQuery={ideaSearchQuery}
              setSearchQuery={setIdeaSearchQuery}
              companyTypeFilter={ideaCompanyTypeFilter}
              setCompanyTypeFilter={setIdeaCompanyTypeFilter}
              industryDomainFilter={ideaIndustryDomainFilter}
              setIndustryDomainFilter={setIdeaIndustryDomainFilter}
              allItems={[...pendingIdeas, ...approvedIdeas]}
            />

            {loadingIdeas ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Loading industry ideas...</p>
              </div>
            ) : (
              <>
                {/* Pending Ideas */}
                <div>
                  <SectionHeader icon={Lightbulb} title="Pending Ideas" count={filteredPendingIdeas.length} />
                  {filteredPendingIdeas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredPendingIdeas.map((idea) => (
                        <SummaryCard key={idea.idea_id} item={idea} type="idea" isPending={true} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={Lightbulb} message="No pending ideas awaiting review." />
                  )}
                </div>

                {/* Approved Ideas */}
                <div>
                  <SectionHeader icon={CheckCircle2} title="Approved Ideas" count={filteredApprovedIdeas.length} />
                  {filteredApprovedIdeas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredApprovedIdeas.map((idea) => (
                        <SummaryCard key={idea.idea_id} item={idea} type="idea" isPending={false} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={CheckCircle2} message="No approved ideas yet." />
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* ========== JOBS TAB ========== */}
          <TabsContent value="jobs" className="space-y-8">
            <SearchFilterBar
              searchQuery={jobSearchQuery}
              setSearchQuery={setJobSearchQuery}
              companyTypeFilter={jobCompanyTypeFilter}
              setCompanyTypeFilter={setJobCompanyTypeFilter}
              industryDomainFilter={jobIndustryDomainFilter}
              setIndustryDomainFilter={setJobIndustryDomainFilter}
              allItems={[...pendingJobs, ...approvedJobs]}
            />

            {loadingJobs ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Loading industry jobs...</p>
              </div>
            ) : (
              <>
                {/* Pending Jobs */}
                <div>
                  <SectionHeader icon={Briefcase} title="Pending Jobs" count={filteredPendingJobs.length} />
                  {filteredPendingJobs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredPendingJobs.map((job) => (
                        <SummaryCard key={job.job_id} item={job} type="job" isPending={true} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={Briefcase} message="No pending jobs awaiting review." />
                  )}
                </div>

                {/* Approved Jobs */}
                <div>
                  <SectionHeader icon={CheckCircle2} title="Approved Jobs" count={filteredApprovedJobs.length} />
                  {filteredApprovedJobs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredApprovedJobs.map((job) => (
                        <SummaryCard key={job.job_id} item={job} type="job" isPending={false} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={CheckCircle2} message="No approved jobs yet." />
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ========== DETAIL PANEL DIALOG ========== */}
      <Dialog
        open={!!activeItem}
        onOpenChange={(open) => {
          if (!open) setActiveItem(null);
        }}
      >
        <DialogContent className="max-w-2xl w-full max-h-[90vh] p-0 gap-0 overflow-hidden bg-background flex flex-col">
          <DialogHeader className="px-6 py-4 border-b bg-card shrink-0">
            <DialogTitle className="flex items-center text-xl">
              {activeItem?.type === "idea" ? (
                <Lightbulb className="mr-3 h-5 w-5 text-primary" />
              ) : (
                <Briefcase className="mr-3 h-5 w-5 text-primary" />
              )}
              <span className="line-clamp-1">{activeItem?.data?.title}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
            {/* Status */}
            <div>
              {activeItem?.isPending ? (
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  <Clock className="w-3 h-3 mr-1.5" /> Pending Review
                </Badge>
              ) : (
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-sm px-3 py-1">
                  <CheckCircle2 className="w-3 h-3 mr-1.5" /> Approved
                </Badge>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-lg border-b pb-2 mb-3">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {activeItem?.data?.description || "No description provided."}
              </p>
            </div>

            {/* Company & Contact Info */}
            <div>
              <h3 className="font-semibold text-lg border-b pb-2 mb-4">Company & Contact</h3>
              <div className="space-y-3">
                <MetaRow icon={Building2} label="Company Name" value={activeItem?.data?.company_name} />
                <MetaRow icon={Globe} label="Company Type" value={activeItem?.data?.company_type} />
                <MetaRow icon={Lightbulb} label="Industry Domain" value={activeItem?.data?.industry_domain} />
                <MetaRow icon={Mail} label="Contact Email" value={activeItem?.data?.gmail} />
                <MetaRow icon={MapPin} label="Location" value={activeItem?.data?.location} />
                <MetaRow icon={Calendar} label="Founded" value={activeItem?.data?.founded_year} />
                {activeItem?.type === "job" && (
                  <>
                    <MetaRow icon={Briefcase} label="Job Type" value={activeItem?.data?.job_type} />
                    <MetaRow icon={DollarSign} label="Compensation" value={activeItem?.data?.amount} />
                    <MetaRow icon={Clock} label="Duration" value={activeItem?.data?.duration} />
                  </>
                )}
              </div>
            </div>

            {/* Company Description */}
            {activeItem?.data?.company_description && (
              <div>
                <h3 className="font-semibold text-lg border-b pb-2 mb-3">About the Company</h3>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  {activeItem.data.company_description}
                </p>
              </div>
            )}

            {/* Technology Stack */}
            {activeItem?.data?.technology_stack?.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg border-b pb-2 mb-3">Technology Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {activeItem.data.technology_stack.map((tech, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Expected Skills */}
            {activeItem?.data?.expected_skills?.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg border-b pb-2 mb-3">Expected Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {activeItem.data.expected_skills.map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons — only for pending items */}
          {activeItem?.isPending && (
            <div className="p-6 border-t bg-card/50 shadow-sm shrink-0 flex gap-3">
              <Button
                className="flex-1"
                size="lg"
                onClick={() =>
                  handleApprove(
                    activeItem.type === "idea" ? activeItem.data.idea_id : activeItem.data.job_id,
                    activeItem.type
                  )
                }
                disabled={!!processingId}
              >
                {processingId ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                )}
                Approve
              </Button>
              <Button
                className="flex-1"
                size="lg"
                variant="secondary"
                onClick={() =>
                  handleReject(
                    activeItem.type === "idea" ? activeItem.data.idea_id : activeItem.data.job_id,
                    activeItem.type
                  )
                }
                disabled={!!processingId}
              >
                {processingId ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 mr-2" />
                )}
                Reject
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IndustryManagement;
