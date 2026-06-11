import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Mail,
  Building2,
  Calendar,
  Globe,
  FileText,
  Users,
  Eye,
  Github,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import { getApprovedStudentProjects } from "@/api/industry";
import axios from "@/api/axiosConfig";
import { toast } from "sonner";

const ApprovedProjects = () => {
  const navigate = useNavigate();

  // State
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 });
  const [error, setError] = useState(null);

  // Modal State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState(null);

  useEffect(() => {
    fetchProjects(pagination.page);
  }, [pagination.page]);

  const fetchProjects = async (page) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getApprovedStudentProjects(page, pagination.limit);
      setProjects(data.data || []);
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        pages: data.pages
      });
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load approved projects.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openProfileModal = async (userId) => {
    setProfileModalOpen(true);
    setLoadingProfile(true);
    try {
      // In the backend, GET /profiles/{user_id} is open to authenticated users
      const response = await axios.get(`/profiles/${userId}`);
      setSelectedStudent(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load student profile");
      setProfileModalOpen(false);
    } finally {
      setLoadingProfile(false);
    }
  };
  
  const openProposalModal = (fileId) => {
      if (!fileId) {
          toast.error("No proposal file available for this project");
          return;
      }
      setSelectedProposalId(fileId);
      setProposalModalOpen(true);
  };

  const handleCollaborate = () => {
    toast.info("Collaboration feature coming soon!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/industry/dashboard")}
              className="h-10 w-10 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Globe className="h-8 w-8 text-primary" />
                Approved FYDP Projects
              </h1>
              <p className="text-muted-foreground mt-1">
                Explore final year projects currently underway by student teams
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading approved projects...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => fetchProjects(pagination.page)} variant="outline">
              Try Again
            </Button>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 border rounded-lg bg-muted/10 border-dashed">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No Projects Found</h3>
            <p className="text-muted-foreground mt-2">
              There are currently no approved projects to display.
            </p>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.proposal_id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <CardTitle className="text-xl line-clamp-2 leading-tight">
                          {project.project_title}
                        </CardTitle>
                        <CardDescription className="mt-2 flex items-center gap-1.5 text-primary/80 font-medium">
                          <Users className="h-4 w-4" />
                          Supervisor: {project.advisor_name}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-6">
                      {project.project_summary || "No description provided."}
                    </p>
                    
                    <div className="mt-auto space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
                        <Users className="h-4 w-4" />
                        Team Members
                      </h4>
                      <div className="space-y-2">
                        {project.members && project.members.map((member, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-muted/30 p-2 rounded-md">
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium truncate">{member.name}</span>
                              <span className="text-xs text-muted-foreground">{member.roll_number}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors shrink-0"
                              onClick={() => openProfileModal(member.user_id)}
                              title="View Profile"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-4 border-t flex justify-between gap-3">
                    <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => openProposalModal(project.file_id)}
                        disabled={!project.file_id}
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        View Proposal
                    </Button>
                    <Button 
                        onClick={handleCollaborate}
                        className="flex-1"
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Collaborate
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-10">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm font-medium text-muted-foreground">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Student Profile Modal */}
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden flex flex-col gap-0 bg-background border-border/50 shadow-2xl">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5 text-primary" />
              Student Profile
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-background">
            {loadingProfile ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium animate-pulse">Loading student profile...</p>
              </div>
            ) : selectedStudent ? (
              <>
                {/* Left side - Resume PDF */}
                <div className="w-full md:w-3/5 h-1/2 md:h-full border-b md:border-b-0 md:border-r bg-muted/10 relative">
                  {selectedStudent.resume_pdf_id ? (
                    <iframe
                      src={`http://localhost:8000/profiles/pdf/${selectedStudent.resume_pdf_id}`}
                      className="w-full h-full rounded-bl-lg"
                      title="Resume PDF"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/5">
                      <FileText className="h-16 w-16 mb-4 opacity-20" />
                      <p className="font-medium text-lg text-foreground/70">No resume uploaded</p>
                      <p className="text-sm mt-1">This student has not provided a resume document.</p>
                    </div>
                  )}
                </div>

                {/* Right side - Profile details */}
                <div className="w-full md:w-2/5 h-1/2 md:h-full overflow-y-auto custom-scrollbar bg-background">
                  <div className="p-6 space-y-6">
                    {/* Header Info */}
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
                        {selectedStudent.name}
                      </h2>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Badge variant="secondary" className="font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                          {selectedStudent.roll_number || "No Roll Number"}
                        </Badge>
                        <span className="text-sm flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          {selectedStudent.section ? `Section ${selectedStudent.section}` : ""}
                        </span>
                      </div>
                    </div>

                    {/* Contact & Links */}
                    <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                      {selectedStudent.gsuite_id && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center border shadow-sm shrink-0">
                            <Mail className="h-4 w-4 text-primary" />
                          </div>
                          <span className="truncate font-medium">{selectedStudent.gsuite_id}</span>
                        </div>
                      )}
                      {selectedStudent.github_link && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center border shadow-sm shrink-0">
                            <Github className="h-4 w-4 text-primary" />
                          </div>
                          <a
                            href={selectedStudent.github_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate font-medium text-primary hover:underline"
                          >
                            GitHub Profile
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    {selectedStudent.bio && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          About
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 p-4 rounded-lg border border-border/50">
                          {selectedStudent.bio}
                        </p>
                      </div>
                    )}

                    {/* Academic Info */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        Academic Details
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">Semester</p>
                          <p className="font-semibold">{selectedStudent.semester || "N/A"}</p>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">Batch</p>
                          <p className="font-semibold">{selectedStudent.batch_year || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Skills */}
                    {selectedStudent.skills && selectedStudent.skills.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          Technical Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedStudent.skills.map((skill, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="px-3 py-1 bg-background border-primary/20 hover:border-primary hover:bg-primary/5 transition-colors"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full p-8 text-center text-destructive">
                Failed to load profile data.
              </div>
            )}
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-muted/30 sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Proposal Modal */}
      <Dialog open={proposalModalOpen} onOpenChange={setProposalModalOpen}>
        <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden flex flex-col gap-0 bg-background border-border/50 shadow-2xl">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-primary" />
              Approved Proposal Document
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden bg-background">
            {selectedProposalId ? (
                <iframe
                    src={`http://localhost:8000/project_proposals/download/${selectedProposalId}`}
                    className="w-full h-full"
                    title="Project Proposal"
                    loading="lazy"
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/5">
                    <FileText className="h-16 w-16 mb-4 opacity-20" />
                    <p className="font-medium text-lg text-foreground/70">No proposal document available</p>
                </div>
            )}
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-muted/30 sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovedProjects;
