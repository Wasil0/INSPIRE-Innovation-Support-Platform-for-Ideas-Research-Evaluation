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
  FileText,
  Users
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import { getMyIndustryIdeas, getMyIndustryJobs, getInterestedGroupsForIndustry, getApplicantsForIndustryJobs } from "@/api/industry";

const MyPostings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ideas");

  // Ideas state
  const [ideas, setIdeas] = useState([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [ideaSearchQuery, setIdeaSearchQuery] = useState("");
  const [ideaStatusFilter, setIdeaStatusFilter] = useState("all");

  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [jobStatusFilter, setJobStatusFilter] = useState("all");

  // Detail panel state
  const [activeItem, setActiveItem] = useState(null); // { data, type: 'idea'|'job' }

  useEffect(() => {
    fetchIdeas();
    fetchJobs();
  }, []);

  const fetchIdeas = async () => {
    try {
      setLoadingIdeas(true);
      const [data, groupsData] = await Promise.all([
        getMyIndustryIdeas(),
        getInterestedGroupsForIndustry()
      ]);
      const groups = groupsData || [];
      const enhancedIdeas = (data || []).map(idea => ({
        ...idea,
        interested_count: groups.filter(g => g.project_id === idea.idea_id).length
      }));
      setIdeas(enhancedIdeas);
    } catch (error) {
      console.error("Failed to fetch ideas:", error);
    } finally {
      setLoadingIdeas(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      const [data, appsData] = await Promise.all([
        getMyIndustryJobs(),
        getApplicantsForIndustryJobs()
      ]);
      const applications = appsData || [];
      const enhancedJobs = (data || []).map(job => ({
        ...job,
        interested_count: applications.filter(a => a.job_id === job.job_id).length
      }));
      setJobs(enhancedJobs);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoadingJobs(false);
    }
  };

  // --- Filter helpers ---
  const applyFilterAndSort = (items, searchQuery, statusFilter) => {
    let filtered = items;
    
    // Applying text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.industry_domain?.toLowerCase().includes(q)
      );
    }
    
    // Applying quick status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => (item.status || "pending").toLowerCase() === statusFilter);
    }

    // Sort order: Pending -> Approved -> Rejected
    const statusPriority = {
      "pending": 1,
      "approved": 2,
      "rejected": 3
    };

    return filtered.sort((a, b) => {
      const statusA = (a.status || "pending").toLowerCase();
      const statusB = (b.status || "pending").toLowerCase();
      return (statusPriority[statusA] || 4) - (statusPriority[statusB] || 4);
    });
  };

  const filteredIdeas = applyFilterAndSort(ideas, ideaSearchQuery, ideaStatusFilter);
  const filteredJobs = applyFilterAndSort(jobs, jobSearchQuery, jobStatusFilter);

  const getStatusBadge = (status) => {
    switch ((status || "pending").toLowerCase()) {
      case "approved":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 mb-2">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="mb-2">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="mb-2">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
    }
  };

  // --- Reusable summary card ---
  const SummaryCard = ({ item, type }) => {
    const itemId = type === "idea" ? item.idea_id : item.job_id;
    const isPending = (item.status || "pending").toLowerCase() === "pending";
    
    return (
      <Card
        className="flex flex-col overflow-hidden h-full transition-all duration-300 hover:shadow-md border-primary/20 cursor-pointer"
        onClick={() => setActiveItem({ data: item, type })}
      >
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start mb-2">
            {getStatusBadge(item.status)}
            
            <Badge variant="outline" className="flex items-center gap-1 border-primary/20 text-primary bg-primary/5">
              <Users className="w-3 h-3" />
              {item.interested_count || 0} {type === "idea" ? "Groups" : "Students"}
            </Badge>
          </div>
          <CardTitle className="text-xl line-clamp-2 leading-tight">
            {item.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {item.description || "No description provided."}
          </p>

          {/* Tags row */}
          <div className="space-y-1.5 pt-4 mt-auto border-t">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
              {type === "idea" ? "Domain & Tech" : "Job Details"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.industry_domain && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {item.industry_domain}
                </Badge>
              )}
              {type === "idea" && item.technology_stack?.slice(0,2).map(skill => (
                <Badge key={skill} variant="secondary" className="text-xs font-normal">
                  {skill}
                </Badge>
              ))}
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
                setActiveItem({ data: item, type });
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const StatusFilters = ({ activeFilter, setFilter }) => (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button 
        variant={activeFilter === "all" ? "default" : "outline"} 
        size="sm" 
        onClick={() => setFilter("all")}
      >
        All Postings
      </Button>
      <Button 
        variant={activeFilter === "pending" ? "default" : "outline"} 
        size="sm"
        onClick={() => setFilter("pending")}
      >
        <Clock className="w-4 h-4 mr-2" /> Pending
      </Button>
      <Button 
        variant={activeFilter === "approved" ? "default" : "outline"} 
        size="sm"
        onClick={() => setFilter("approved")}
      >
        <CheckCircle2 className="w-4 h-4 mr-2" /> Approved
      </Button>
      <Button 
        variant={activeFilter === "rejected" ? "default" : "outline"} 
        size="sm"
        onClick={() => setFilter("rejected")}
      >
        <XCircle className="w-4 h-4 mr-2" /> Rejected
      </Button>
    </div>
  );

  // --- Search/Filter bar (reusable) ---
  const SearchFilterBar = ({ searchQuery, setSearchQuery, activeFilter, setFilter }) => (
    <Card className="border-primary/20 mb-6">
      <CardContent className="pt-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, description, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <StatusFilters activeFilter={activeFilter} setFilter={setFilter} />
      </CardContent>
    </Card>
  );

  // --- Empty state ---
  const EmptyState = ({ icon: Icon, message }) => (
    <div className="text-center py-16 bg-card border rounded-lg shadow-sm">
      <Icon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium">Nothing Here</h3>
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
          onClick={() => navigate("/industry/dashboard")}
          className="mb-6 -ml-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            My Postings
          </h1>
          <p className="text-muted-foreground">
            Manage your submitted FYDP ideas and job postings.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="ideas" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              FYDP Ideas
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Jobs/Internships
            </TabsTrigger>
          </TabsList>

          {/* ========== IDEAS TAB ========== */}
          <TabsContent value="ideas" className="space-y-8">
            <SearchFilterBar
              searchQuery={ideaSearchQuery}
              setSearchQuery={setIdeaSearchQuery}
              activeFilter={ideaStatusFilter}
              setFilter={setIdeaStatusFilter}
            />

            {loadingIdeas ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Loading your ideas...</p>
              </div>
            ) : filteredIdeas.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredIdeas.map((idea) => (
                   <SummaryCard key={idea.idea_id} item={idea} type="idea" />
                 ))}
               </div>
            ) : (
                <EmptyState icon={Lightbulb} message="No ideas found matching your criteria. Try adjusting your filters." />
            )}
          </TabsContent>

          {/* ========== JOBS TAB ========== */}
          <TabsContent value="jobs" className="space-y-8">
            <SearchFilterBar
              searchQuery={jobSearchQuery}
              setSearchQuery={setJobSearchQuery}
              activeFilter={jobStatusFilter}
              setFilter={setJobStatusFilter}
            />

            {loadingJobs ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Loading your jobs...</p>
              </div>
            ) : filteredJobs.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredJobs.map((job) => (
                   <SummaryCard key={job.job_id} item={job} type="job" />
                 ))}
               </div>
            ) : (
                <EmptyState icon={Briefcase} message="No jobs found matching your criteria. Try adjusting your filters." />
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
            {/* Status & Stats */}
            <div className="flex gap-4">
              {getStatusBadge(activeItem?.data?.status)}
              <Badge variant="outline" className="flex items-center gap-1 border-primary/20 text-primary bg-primary/5 mb-2">
                <Users className="w-3 h-3" />
                {activeItem?.data?.interested_count || 0} {activeItem?.type === "idea" ? "Interested Groups" : "Applicants"}
              </Badge>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-lg border-b pb-2 mb-3">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {activeItem?.data?.description || "No description provided."}
              </p>
            </div>

            {/* Post Info */}
            <div>
              <h3 className="font-semibold text-lg border-b pb-2 mb-4">Details</h3>
              <div className="space-y-3">
                <MetaRow icon={Lightbulb} label="Industry Domain" value={activeItem?.data?.industry_domain} />
                {activeItem?.type === "job" && (
                  <>
                    <MetaRow icon={Briefcase} label="Job Type" value={activeItem?.data?.job_type} />
                    <MetaRow icon={DollarSign} label="Compensation" value={activeItem?.data?.amount} />
                    <MetaRow icon={Clock} label="Duration" value={activeItem?.data?.duration} />
                  </>
                )}
              </div>
            </div>

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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyPostings;
