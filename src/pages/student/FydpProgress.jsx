import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  FileText,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  ArrowLeft,
  CheckCircle,
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
import Navbar from "@/components/Navbar";

const FydpProgress = () => {
  const navigate = useNavigate();

  const steps = [
    {
      id: 1,
      title: "Group Formation",
      description: "Form your project team and assign roles",
      icon: Users,
      enabled: true,
      completed: true,
      route: "/student/group-formation",
    },
    {
      id: 2,
      title: "Advisor Selection and Idea Pitching",
      description: "Select an advisor and pitch your project idea",
      icon: UserCheck,
      enabled: false,
      completed: false,
    },
    {
      id: 3,
      title: "Proposal Submission",
      description: "Submit your detailed project proposal",
      icon: FileText,
      enabled: false,
      completed: false,
    },
    {
      id: 4,
      title: "Proposal Approved",
      description: "Wait for committee approval of your proposal",
      icon: CheckCircle2,
      enabled: false,
      completed: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/student/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            FYDP Progress
          </h1>
          <p className="text-muted-foreground">
            Track and complete your Final Year Design Project milestones
          </p>
        </div>

        {/* FYDP Steps Section */}
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <CheckCircle className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle>Project Milestones</CardTitle>
                <CardDescription>
                  Complete each step to progress through your FYDP
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Vertical connector line - spans all steps */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-muted" />
              
              <div className="space-y-6">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isLast = index === steps.length - 1;
                  const nextStep = !isLast ? steps[index + 1] : null;
                  const isLineActive = step.completed && nextStep?.completed;

                  return (
                    <div key={step.id} className="relative flex items-start gap-4 group">
                      {/* Step Icon Container */}
                      <div className="relative z-10 shrink-0">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-300 ${
                            step.completed
                              ? "bg-primary shadow-sm"
                              : step.enabled
                              ? "bg-primary/20 group-hover:bg-primary/30"
                              : "bg-muted"
                          }`}
                        >
                          {step.completed ? (
                            <CheckCircle className="h-6 w-6 text-primary-foreground" />
                          ) : (
                            <Icon
                              className={`h-6 w-6 transition-colors ${
                                step.enabled
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                          )}
                        </div>
                        
                        {/* Active connector line segment */}
                        {!isLast && step.completed && (
                          <div className="absolute left-1/2 top-12 -translate-x-1/2 w-0.5 h-6 bg-primary z-0" />
                        )}
                      </div>

                      {/* Step Card */}
                      <div
                        className={`flex-1 rounded-lg border p-5 transition-all duration-300 ${
                          step.enabled
                            ? "border-primary/20 bg-card group-hover:bg-accent group-hover:shadow-md cursor-pointer"
                            : "border-muted bg-muted/30 opacity-75 cursor-not-allowed"
                        }`}
                        onClick={() => {
                          if (step.enabled && step.route) {
                            navigate(step.route);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Step Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3
                                className={`font-semibold text-base ${
                                  step.enabled
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {step.title}
                              </h3>
                              {step.completed && (
                                <Badge className="bg-primary text-primary-foreground text-xs shrink-0">
                                  Completed
                                </Badge>
                              )}
                              {!step.enabled && !step.completed && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs shrink-0"
                                >
                                  Locked
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {step.description}
                            </p>
                          </div>

                          {/* Step Number */}
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 transition-all duration-300 ${
                              step.completed
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : step.enabled
                                ? "bg-primary/20 text-primary group-hover:bg-primary/30 group-hover:shadow-sm"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <span className="text-xs font-semibold">
                              {step.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Past FYDP Ideas Card */}
          <Card 
            className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/40 hover:bg-accent/50 border-primary/20 will-change-transform origin-center transform-gpu cursor-pointer"
            onClick={() => navigate("/student/past-ideas")}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                  <Lightbulb className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle>Past FYDP Ideas</CardTitle>
                  <CardDescription>
                    Browse previously completed projects for inspiration
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Explore a collection of successful FYDP projects from previous
                years to get ideas and understand project requirements.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/student/past-ideas");
                }}
              >
                View Past Projects
                <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
              </Button>
            </CardContent>
          </Card>

          {/* AI Assistance Card */}
          <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/40 hover:bg-accent/50 border-primary/20 will-change-transform origin-center transform-gpu cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle>AI Assistance</CardTitle>
                  <CardDescription>
                    Get AI-powered help with your project planning
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Use AI assistance to refine your project idea, get suggestions,
                and improve your proposal.
              </p>
              <Button variant="outline" className="w-full">
                Get AI Help
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FydpProgress;

