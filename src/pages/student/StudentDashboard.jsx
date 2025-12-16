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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { getTop3AdvisorIdeas, getStudentProfileSummary } from "@/api/student";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [notifications] = useState(3); // Placeholder for notification count
  const [advisorIdeas, setAdvisorIdeas] = useState([]);
  const [loadingAdvisorIdeas, setLoadingAdvisorIdeas] = useState(true);
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

  const fydpProgress = {
    completed: 3,
    total: 6,
    description: "Complete your project milestones to finish FYDP",
  };

  const groupMembers = [
    { id: 1, name: "Sarah Ali", avatar: null },
    { id: 2, name: "Mohamed Ibrahim", avatar: null },
    { id: 3, name: "Fatima Ahmed", avatar: null },
  ];

  const jobOpportunities = [
    {
      id: 1,
      title: "Full Stack Developer",
      company: "Tech Corp",
      snippet: "Looking for React and Node.js developers...",
    },
    {
      id: 2,
      title: "Software Engineer Intern",
      company: "StartupXYZ",
      snippet: "Join our team to build innovative solutions...",
    },
    {
      id: 3,
      title: "Frontend Developer",
      company: "Design Studio",
      snippet: "Create beautiful user interfaces...",
    },
  ];

  // Fetch top 3 advisor ideas on component mount
  useEffect(() => {
    const fetchAdvisorIdeas = async () => {
      try {
        setLoadingAdvisorIdeas(true);
        const titles = await getTop3AdvisorIdeas();
        // Convert titles array to objects with id and title
        const ideas = titles.map((title, index) => ({
          id: index + 1,
          title: title,
        }));
        setAdvisorIdeas(ideas);
      } catch (error) {
        console.error("Failed to fetch advisor ideas:", error);
        // Keep empty array on error, UI will show no ideas
        setAdvisorIdeas([]);
      } finally {
        setLoadingAdvisorIdeas(false);
      }
    };

    fetchAdvisorIdeas();
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

  // Industry ideas (hardcoded for now - can be replaced with API call later)
  const industryIdeas = [
    { id: 1, title: "IoT Home Automation" },
    { id: 2, title: "E-commerce Analytics Platform" },
  ];


  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
                    {fydpProgress.completed}/{fydpProgress.total} Steps
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress
                  value={(fydpProgress.completed / fydpProgress.total) * 100}
                  className="h-2 [&>div]:bg-primary"
                />
                <p className="text-sm text-muted-foreground">
                  {fydpProgress.description}
                </p>
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
                {groupMembers.length > 0 ? (
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
                    <Button variant="outline" className="w-full">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Group
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <p className="text-muted-foreground">
                      No group members yet. Create or join a group to get
                      started.
                    </p>
                    <Button variant="default">
                      <Users className="mr-2 h-4 w-4" />
                      Create Group
                    </Button>
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
                    {jobOpportunities.length} New
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {jobOpportunities.slice(0, 3).map((job) => (
                    <div
                      key={job.id}
                      className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{job.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {job.company}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {job.snippet}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full">
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
                <div className="rounded-lg border border-primary/20 bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <Briefcase className="h-4 w-4 text-primary-foreground" />
                      </div>
                      From Industry
                    </h4>
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      {industryIdeas.length} available
                    </Badge>
                  </div>
                  <ul className="space-y-2">
                    {industryIdeas.map((idea) => (
                      <li
                        key={idea.id}
                        className="text-sm text-muted-foreground flex items-center gap-2"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {idea.title}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Student Summary Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-primary/20 will-change-transform origin-center transform-gpu">
              <CardHeader className="text-center pb-3 pt-4">
                <div className="flex justify-center mb-3">
                  <Avatar className="h-20 w-20 border-2 border-primary/30 shadow-sm">
                    {studentData.avatar ? (
                      <AvatarImage src={studentData.avatar} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                      {loadingProfile ? "..." : getInitials(studentData.name || "Student")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-lg">
                  {loadingProfile ? "Loading..." : studentData.name || "Student"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 px-4 pb-4">
                {/* Email (GSuite ID) */}
                {studentData.gsuite_id && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-card p-2.5">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-xs font-medium truncate">
                        {studentData.gsuite_id}
                      </p>
                    </div>
                  </div>
                )}

                {/* Roll Number */}
                {studentData.roll_number && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-card p-2.5">
                    <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Roll Number</p>
                      <p className="text-xs font-medium">
                        {studentData.roll_number}
                      </p>
                    </div>
                  </div>
                )}

                {/* Section */}
                {studentData.section && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-card p-2.5">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Section</p>
                      <p className="text-xs font-medium">
                        {studentData.section}
                      </p>
                    </div>
                  </div>
                )}

                {/* Batch Year */}
                {studentData.batch_year && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-card p-2.5">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Batch Year</p>
                      <p className="text-xs font-medium">
                        {studentData.batch_year}
                      </p>
                    </div>
                  </div>
                )}

                {/* Current Year */}
                {studentData.current_year && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-card p-2.5">
                    <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        Current Year
                      </p>
                      <Badge className="bg-primary text-primary-foreground mt-1 text-xs">
                        {studentData.current_year} Year
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Current Semester */}
                {studentData.semester && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-card p-2.5">
                    <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Semester</p>
                      <p className="text-xs font-medium">
                        {studentData.semester}
                      </p>
                    </div>
                  </div>
                )}

                {/* Technical Skills */}
                {studentData.skills && studentData.skills.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Technical Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {studentData.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          className="bg-primary text-primary-foreground text-xs border-0 px-2 py-1"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Edit Profile Button */}
                <Button variant="default" className="w-full h-9 text-sm mt-2">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
