import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit,
  Mail,
  Calendar,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Users,
  Briefcase,
  Lightbulb,
  User,
  Hash,
  Building2,
  X,
  Eye,
  Plus,
  Loader2,
  FileText
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TECHNICAL_SKILLS } from "@/assets/technicalSkills";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { 
  getTop3AdvisorIdeas, 
  getStudentProfileSummary,
  getMyStages,
  getGroupMembers,
  getMyTeamMembers,
  updateStudentProfile
} from "@/api/student";
import api from "@/api/axiosConfig";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [notifications] = useState(3); // Placeholder for notification count
  const [advisorIdeas, setAdvisorIdeas] = useState([]);
  const [loadingAdvisorIdeas, setLoadingAdvisorIdeas] = useState(true);
  const [industryIdeas, setIndustryIdeas] = useState([]);
  const [loadingIndustryIdeas, setLoadingIndustryIdeas] = useState(true);
  const [industryJobs, setIndustryJobs] = useState([]);
  const [loadingIndustryJobs, setLoadingIndustryJobs] = useState(true);
  const [studentData, setStudentData] = useState({
    name: "",
    gsuite_id: "",
    batch_year: "",
    current_year: "",
    semester: "",
    roll_number: "",
    section: "",
    skills: [],
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  // FYDP Progress state
  const [stages, setStages] = useState({
    stage1_completed: false,
    stage2_completed: false,
    stage3_completed: false,
    stage4_completed: false,
  });
  const [loadingStages, setLoadingStages] = useState(true);
  
  // Group members state
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingGroupMembers, setLoadingGroupMembers] = useState(true);
  const [groupInfo, setGroupInfo] = useState({
    isLocked: false,
  });

  // Edit Profile States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [skillSearch, setSkillSearch] = useState("");
  const [resumeFile, setResumeFile] = useState(null);

  const handleOpenEditModal = () => {
    setEditFormData({
      name: studentData.name || "",
      roll_number: studentData.roll_number || "",
      section: studentData.section || "",
      batch_year: studentData.batch_year || "",
      current_year: studentData.current_year || "",
      semester: studentData.semester || "",
      skills: studentData.skills ? [...studentData.skills] : [],
    });
    setSkillSearch("");
    setResumeFile(null);
    setIsEditModalOpen(true);
  };

  const handleAddSkill = (skill) => {
    if (!editFormData.skills?.includes(skill)) {
      setEditFormData(prev => ({ ...prev, skills: [...(prev.skills || []), skill] }));
    }
    setSkillSearch("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    setEditFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      const dataToUpdate = { ...editFormData };
      if (resumeFile) {
        dataToUpdate.resume_pdf = resumeFile;
      }
      
      const res = await updateStudentProfile(dataToUpdate);
      setStudentData(res.profile); // Backend returns the full updated profile directly
      
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const filteredSkills = TECHNICAL_SKILLS.filter(skill => 
    skill.toLowerCase().includes(skillSearch.toLowerCase()) &&
    !(editFormData.skills || []).includes(skill)
  ).slice(0, 5);

  // Fetch top 3 advisor ideas on component mount
  useEffect(() => {
    const fetchAdvisorIdeas = async () => {
      try {
        setLoadingAdvisorIdeas(true);
        const titles = await getTop3AdvisorIdeas();
        const ideas = titles.map((title, index) => ({
          id: index + 1,
          title: title,
        }));
        setAdvisorIdeas(ideas);
      } catch (error) {
        console.error("Failed to fetch advisor ideas:", error);
        setAdvisorIdeas([]);
      } finally {
        setLoadingAdvisorIdeas(false);
      }
    };

    fetchAdvisorIdeas();
  }, []);

  // Fetch industry ideas on component mount
  useEffect(() => {
    const fetchIndustryIdeas = async () => {
      try {
        setLoadingIndustryIdeas(true);
        const { getApprovedIndustryIdeas } = await import("@/api/industryIdeas");
        const ideas = await getApprovedIndustryIdeas();
        setIndustryIdeas(ideas || []);
      } catch (error) {
        console.error("Failed to fetch industry ideas:", error);
        setIndustryIdeas([]);
      } finally {
        setLoadingIndustryIdeas(false);
      }
    };

    fetchIndustryIdeas();
  }, []);

  // Fetch industry jobs on component mount
  useEffect(() => {
    const fetchIndustryJobs = async () => {
      try {
        setLoadingIndustryJobs(true);
        const { getApprovedIndustryJobs } = await import("@/api/industryJobs");
        const jobs = await getApprovedIndustryJobs();
        setIndustryJobs(jobs || []);
      } catch (error) {
        console.error("Failed to fetch industry jobs:", error);
        setIndustryJobs([]);
      } finally {
        setLoadingIndustryJobs(false);
      }
    };

    fetchIndustryJobs();
  }, []);

  // Fetch student profile summary on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const profile = await getStudentProfileSummary();
        setStudentData(profile);
      } catch (error) {
        console.error("Failed to fetch student profile:", error);
        // Keep default empty state on error
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  // Fetch stages status on component mount
  useEffect(() => {
    const fetchStages = async () => {
      try {
        setLoadingStages(true);
        const response = await getMyStages();
        setStages(response.stages || {
          stage1_completed: false,
          stage2_completed: false,
          stage3_completed: false,
          stage4_completed: false,
        });
      } catch (error) {
        console.error("Failed to fetch stages:", error);
        // Keep default empty state on error
        setStages({
          stage1_completed: false,
          stage2_completed: false,
          stage3_completed: false,
          stage4_completed: false,
        });
      } finally {
        setLoadingStages(false);
      }
    };

    fetchStages();
  }, []);

  // Fetch group members based on stage1_completed
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoadingGroupMembers(true);
        
        if (stages.stage1_completed) {
          // Stage 1 completed - fetch permanent team members
          try {
            const response = await getMyTeamMembers();
            setGroupMembers(
              response.members?.map((m) => ({
                id: m.user_id,
                name: m.name,
                avatar: null,
              })) || []
            );
            setGroupInfo({
              isLocked: true,
              isTemporary: false,
            });
          } catch (error) {
            // If stage1 is true but team not found, show empty
            if (error.response?.status === 404 || error.response?.status === 403) {
              setGroupMembers([]);
              setGroupInfo({
                isLocked: false,
                isTemporary: false,
              });
            } else {
              throw error;
            }
          }
        } else {
          // Stage 0 - fetch temporary group members
          try {
            const response = await getGroupMembers();
            if (response.members && response.members.length > 0) {
              setGroupMembers(
                response.members.map((m) => ({
                  id: m.user_id,
                  name: m.name,
                  avatar: null,
                }))
              );
              setGroupInfo({
                isLocked: response.is_locked || false,
                isTemporary: !response.is_locked,
              });
            } else {
              // No group members
              setGroupMembers([]);
              setGroupInfo({
                isLocked: false,
                isTemporary: true,
              });
            }
          } catch (error) {
            // If no group found, show empty
            if (error.response?.status === 404) {
              setGroupMembers([]);
              setGroupInfo({
                isLocked: false,
                isTemporary: true,
              });
            } else {
              throw error;
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch group members:", error);
        setGroupMembers([]);
        setGroupInfo({
          isLocked: false,
          isTemporary: true,
        });
      } finally {
        setLoadingGroupMembers(false);
      }
    };

    if (!loadingStages) {
      fetchMembers();
    }
  }, [stages.stage1_completed, loadingStages]);

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate FYDP progress based on stages
  const calculateProgress = () => {
    const stageCount = [
      stages.stage1_completed,
      stages.stage2_completed,
      stages.stage3_completed,
      stages.stage4_completed,
    ].filter(Boolean).length;
    
    return {
      completed: stageCount,
      total: 4,
      percentage: (stageCount / 4) * 100,
    };
  };

  const fydpProgress = calculateProgress();

  return (
    <div className="min-h-screen bg-background">
      {/* Glassmorphic Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area - Left Side (2 columns on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            {/* FYDP Progress Card */}
            <Card
              className="transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-primary/20 will-change-transform origin-center transform-gpu cursor-pointer"
              onClick={() => navigate("/student/fydp-progress")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                      <GraduationCap className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle>FYDP Progress</CardTitle>
                      <CardDescription>
                        Track your project completion status
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">
                    {loadingStages ? "..." : `${fydpProgress.completed}/${fydpProgress.total} Steps`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingStages ? (
                  <div className="space-y-2">
                    <div className="h-2 bg-muted rounded-full animate-pulse" />
                    <p className="text-sm text-muted-foreground">Loading progress...</p>
                  </div>
                ) : (
                  <>
                    <Progress
                      value={fydpProgress.percentage}
                      className="h-2 [&>div]:bg-primary"
                    />
                    <p className="text-sm text-muted-foreground">
                      {fydpProgress.completed === 0
                        ? "Start your FYDP journey by completing Stage 1: Group Formation"
                        : fydpProgress.completed === 4
                        ? "Congratulations! You have completed all FYDP stages"
                        : `Complete ${fydpProgress.total - fydpProgress.completed} more stage${fydpProgress.total - fydpProgress.completed !== 1 ? "s" : ""} to finish your FYDP`}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Group Members Card */}
            <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-primary/20 will-change-transform origin-center transform-gpu">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                    <Users className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle>Group Members</CardTitle>
                    <CardDescription>
                      Your FYDP project team members
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingGroupMembers ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading group members...</p>
                  </div>
                ) : groupMembers.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-3">
                      {groupMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
                        >
                          <Avatar className="h-10 w-10">
                            {member.avatar ? (
                              <AvatarImage src={member.avatar} />
                            ) : null}
                            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {member.name}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Show appropriate caption based on group status */}
                    {stages.stage1_completed ? (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Permanent Team:</span> Your group has been locked and finalized. This is your official FYDP team.
                        </p>
                      </div>
                    ) : groupInfo.isLocked ? (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Temporary Group (Locked):</span> All members have locked the group. Complete Stage 1 to make it permanent.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-primary/20 bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Temporary Group:</span> This is a temporary group. Lock the group with all members to proceed to Stage 1.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    {stages.stage1_completed ? (
                      <>
                        <p className="text-muted-foreground">
                          You are not in a permanent team yet. Contact your advisor for team assignment.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground">
                          No group members yet. Create or join a group to get started with your FYDP project.
                        </p>
                        <Button 
                          variant="default"
                          onClick={() => navigate("/student/group-formation")}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Form Group
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job Opportunities Card */}
            <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-primary/20 will-change-transform origin-center transform-gpu">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                      <Briefcase className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle>Job Opportunities</CardTitle>
                      <CardDescription>
                        Explore career opportunities
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">
                    {loadingIndustryJobs ? "..." : `${industryJobs.length} New`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {loadingIndustryJobs ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">Loading job opportunities...</p>
                    </div>
                  ) : industryJobs.length > 0 ? (
                    industryJobs.slice(0, 3).map((job) => (
                      <div
                        key={job.job_id || job.id}
                        className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent cursor-pointer"
                        onClick={() => navigate("/student/industry-jobs")}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{job.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {job.company_name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {job.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No jobs available right now.</p>
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/student/industry-jobs")}
                >
                  See More
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* FYDP Ideas Card */}
            <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-primary/20 will-change-transform origin-center transform-gpu">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                    <Lightbulb className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle>FYDP Ideas</CardTitle>
                    <CardDescription>
                      Explore project ideas from advisors and industry
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Ideas from Advisors */}
                <div 
                  className="rounded-lg border border-primary/20 bg-card p-4 cursor-pointer hover:bg-accent hover:border-primary/60 transition-all duration-150 hover:shadow-sm"
                  onClick={() => navigate("/student/fydp-advisor-ideas")}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                      From Advisors
                    </h4>
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      {loadingAdvisorIdeas ? "..." : advisorIdeas.length} available
                    </Badge>
                  </div>
                  <ul className="space-y-2">
                    {loadingAdvisorIdeas ? (
                      <li className="text-sm text-muted-foreground">
                        Loading ideas...
                      </li>
                    ) : advisorIdeas.length > 0 ? (
                      advisorIdeas.map((idea) => (
                        <li
                          key={idea.id}
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {idea.title}
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-muted-foreground">
                        No advisor ideas available
                      </li>
                    )}
                  </ul>
                </div>

                {/* Ideas from Industry */}
                <div 
                  className="rounded-lg border border-primary/20 bg-card p-4 cursor-pointer hover:bg-accent hover:border-primary/60 transition-all duration-150 hover:shadow-sm"
                  onClick={() => navigate("/student/fydp-industry-ideas")}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <Briefcase className="h-4 w-4 text-primary-foreground" />
                      </div>
                      From Industry
                    </h4>
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      {loadingIndustryIdeas ? "..." : industryIdeas.length} available
                    </Badge>
                  </div>
                  <ul className="space-y-2">
                    {loadingIndustryIdeas ? (
                      <li className="text-sm text-muted-foreground">
                        Loading ideas...
                      </li>
                    ) : industryIdeas.length > 0 ? (
                      industryIdeas.slice(0, 3).map((idea) => (
                        <li
                          key={idea.idea_id || idea.id}
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                          <span className="truncate">{idea.title}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-muted-foreground">
                        No industry ideas available
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Student Summary Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-primary/20 will-change-transform origin-center transform-gpu">
              <CardHeader className="text-center pb-2 pt-3">
                <div className="flex justify-center mb-2">
                  <Avatar className="h-16 w-16 border-2 border-primary/30 shadow-sm">
                    {studentData.avatar ? (
                      <AvatarImage src={studentData.avatar} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                      {loadingProfile ? "..." : getInitials(studentData.name || "Student")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-base">
                  {loadingProfile ? "Loading..." : studentData.name || "Student"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 px-4 pb-3">
                {/* Email (GSuite ID) */}
                {studentData.gsuite_id && (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-card p-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground leading-none">Email</p>
                      <p className="text-xs font-medium truncate mt-0.5">
                        {studentData.gsuite_id}
                      </p>
                    </div>
                  </div>
                )}

                {/* Roll Number */}
                {studentData.roll_number && (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-card p-1.5">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground leading-none">Roll Number</p>
                      <p className="text-xs font-medium mt-0.5">
                        {studentData.roll_number}
                      </p>
                    </div>
                  </div>
                )}

                {/* Section */}
                {studentData.section && (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-card p-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground leading-none">Section</p>
                      <p className="text-xs font-medium mt-0.5">
                        {studentData.section}
                      </p>
                    </div>
                  </div>
                )}

                {/* Batch Year */}
                {studentData.batch_year && (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-card p-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground leading-none">Batch Year</p>
                      <p className="text-xs font-medium mt-0.5">
                        {studentData.batch_year}
                      </p>
                    </div>
                  </div>
                )}

                {/* Current Year */}
                {studentData.current_year && (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-card p-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 flex justify-between items-center">
                      <p className="text-[10px] text-muted-foreground">Current Year</p>
                      <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] px-1 py-0 h-4">
                        {studentData.current_year} Year
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Current Semester */}
                {studentData.semester && (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-card p-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground leading-none">Semester</p>
                      <p className="text-xs font-medium mt-0.5">
                        {studentData.semester}
                      </p>
                    </div>
                  </div>
                )}

                {/* Technical Skills */}
                {studentData.skills && studentData.skills.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[10px] font-medium text-muted-foreground mb-1">
                      Technical Skills
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {studentData.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          className="bg-primary text-primary-foreground text-[10px] font-medium border-0 px-1.5 py-0 h-4"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Edit Profile & Action Buttons */}
                <div className="flex flex-col gap-1.5 pt-1 mt-1 border-t border-border/50">
                  <Button variant="default" className="w-full h-8 text-xs font-medium" onClick={handleOpenEditModal}>
                    <Edit className="mr-2 h-3.5 w-3.5" />
                    Edit Profile
                  </Button>
                  {studentData.resume_pdf_id && (
                    <Button variant="outline" className="w-full h-8 text-xs font-medium border-primary/30 hover:bg-primary/5" onClick={() => setIsPreviewModalOpen(true)}>
                      <Eye className="mr-2 h-3.5 w-3.5 text-primary" />
                      Preview My CV
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={editFormData.name || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roll_number">Roll Number</Label>
                <Input
                  id="roll_number"
                  value={editFormData.roll_number || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, roll_number: e.target.value })}
                  placeholder="20L-1234"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch_year">Batch Year</Label>
                <Input
                  id="batch_year"
                  value={editFormData.batch_year || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, batch_year: e.target.value })}
                  placeholder="2020"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_year">Current Year</Label>
                <Input
                  id="current_year"
                  value={editFormData.current_year || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, current_year: e.target.value })}
                  placeholder="4th"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Input
                  id="semester"
                  value={editFormData.semester || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, semester: e.target.value })}
                  placeholder="8th"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={editFormData.section || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, section: e.target.value })}
                  placeholder="A"
                />
              </div>
            </div>

            {/* Technical Skills Search & Selection */}
            <div className="space-y-2">
              <Label>Technical Skills</Label>
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <Input
                    placeholder="Search and add skills..."
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                  />
                  {skillSearch && filteredSkills.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg">
                      {filteredSkills.map(skill => (
                        <div
                          key={skill}
                          className="px-4 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm flex justify-between items-center"
                          onClick={() => handleAddSkill(skill)}
                        >
                          {skill}
                          <Plus className="h-3 w-3 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(editFormData.skills || []).map((skill, idx) => (
                    <Badge
                      key={idx}
                      className="bg-primary/20 text-primary hover:bg-primary/30 border-0 pl-3 pr-2 py-1 flex items-center justify-between"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {(!editFormData.skills || editFormData.skills.length === 0) && (
                    <span className="text-sm text-muted-foreground">No skills added yet.</span>
                  )}
                </div>
              </div>
            </div>

            {/* CV Upload */}
            <div className="space-y-2">
              <Label htmlFor="resume">CV / Resume (PDF only)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="resume"
                  type="file"
                  accept="application/pdf"
                  className="cursor-pointer file:cursor-pointer"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setResumeFile(e.target.files[0]);
                    }
                  }}
                />
                {(studentData.resume_pdf_id || resumeFile) && (
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {studentData.resume_pdf_id && !resumeFile 
                  ? "You already have a CV uploaded. Uploading a new one will replace it." 
                  : "Upload a PDF document detailing your academic and professional experience."}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingProfile}>
                {isSavingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* CV Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-5xl w-full h-[90vh] md:h-[95vh] p-0 overflow-hidden flex flex-col items-center justify-center bg-transparent border-0 shadow-none">
          <div className="w-full max-w-4xl bg-background rounded-xl overflow-hidden shadow-2xl border border-border flex flex-col h-full relative">
            <div className="bg-muted px-4 py-3 flex items-center justify-between border-b border-border absolute top-0 w-full z-10 shadow-sm backdrop-blur-sm bg-muted/90">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Resume Preview
              </h2>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-black/10 dark:hover:bg-white/10" onClick={() => setIsPreviewModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {studentData.resume_pdf_id ? (
              <div className="flex-1 w-full h-full bg-muted/30 pt-12">
                <iframe
                  src={`${api.defaults.baseURL}/profiles/pdf/${studentData.resume_pdf_id}#toolbar=0`}
                  className="w-full h-full border-0"
                  title="CV Preview"
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center pt-12">
                <p className="text-muted-foreground text-sm">No Resume uploaded.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDashboard;
