import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Bell,
  LogOut,
  User,
  GraduationCap,
  Users,
  Briefcase,
  Lightbulb,
  Edit,
  Mail,
  Calendar,
  BookOpen,
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [notifications] = useState(3); // Placeholder for notification count

  // Placeholder data - replace with API calls
  const studentData = {
    name: "Ahmed Hassan",
    gender: "Male",
    email: "ahmed.hassan@university.edu",
    batchYear: "2021",
    currentYear: "Final",
    currentSemester: "Fall 2024",
    skills: ["React", "Python", "Node.js", "MongoDB", "UI/UX"],
    avatar: null, // Replace with actual avatar URL
  };

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

  const fydpIdeas = {
    fromAdvisors: [
      { id: 1, title: "AI-Powered Learning System" },
      { id: 2, title: "Smart Campus Management" },
      { id: 3, title: "Blockchain Voting System" },
    ],
    fromIndustry: [
      { id: 1, title: "IoT Home Automation" },
      { id: 2, title: "E-commerce Analytics Platform" },
    ],
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

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
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo/Title */}
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-sm">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <a
                href="/student/dashboard"
                className="text-xl font-semibold text-foreground transition-colors hover:text-primary"
              >
                FYDP Portal
              </a>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Settings Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Preferences
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                    {notifications}
                  </span>
                )}
              </Button>

              {/* Sign Out */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-9 w-9 transition-colors hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area - Left Side (2 columns on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            {/* FYDP Progress Card */}
            <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-primary/20 will-change-transform origin-center transform-gpu">
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
                          <h4 className="font-semibold text-sm">
                            {job.title}
                          </h4>
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
                <div className="rounded-lg border border-primary/20 bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                      From Advisors
                    </h4>
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      {fydpIdeas.fromAdvisors.length} available
                    </Badge>
                  </div>
                  <ul className="space-y-2">
                    {fydpIdeas.fromAdvisors.map((idea) => (
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
                      {fydpIdeas.fromIndustry.length} available
                    </Badge>
                  </div>
                  <ul className="space-y-2">
                    {fydpIdeas.fromIndustry.map((idea) => (
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
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24 border-2 border-primary/30 shadow-sm">
                    {studentData.avatar ? (
                      <AvatarImage src={studentData.avatar} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                      {getInitials(studentData.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-xl">{studentData.name}</CardTitle>
                <CardDescription className="text-base">
                  {studentData.gender}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Email */}
                <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-card p-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium truncate">
                      {studentData.email}
                    </p>
                  </div>
                </div>

                {/* Batch Year */}
                <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-card p-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Batch Year</p>
                    <p className="text-sm font-medium">{studentData.batchYear}</p>
                  </div>
                </div>

                {/* Current Year */}
                <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-card p-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Current Year</p>
                    <Badge className="bg-primary text-primary-foreground mt-1">
                      {studentData.currentYear} Year
                    </Badge>
                  </div>
                </div>

                {/* Current Semester */}
                <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-card p-3">
                  <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Semester</p>
                    <p className="text-sm font-medium">
                      {studentData.currentSemester}
                    </p>
                  </div>
                </div>

                {/* Technical Skills */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Technical Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {studentData.skills.map((skill, index) => (
                      <Badge
                        key={index}
                        className="bg-primary text-primary-foreground text-xs border-0"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Edit Profile Button */}
                <Button variant="default" className="w-full">
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
