import React, { useState, useEffect } from "react";
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
import Navbar from "@/components/Navbar";
import { getMyStages } from "@/api/student";

const FydpProgress = () => {
  const navigate = useNavigate();
  const [stages, setStages] = useState({
    stage1_completed: false,
    stage2_completed: false,
    stage3_completed: false,
    stage4_completed: false,
  });
  const [loadingStages, setLoadingStages] = useState(true);

  // Fetch stage status on mount
  useEffect(() => {
    const fetchStages = async () => {
      try {
        setLoadingStages(true);
        const response = await getMyStages();
        // getMyStages returns { user_id, stages: { stage1_completed, ... } }
        setStages(response.stages || {
          stage1_completed: false,
          stage2_completed: false,
          stage3_completed: false,
          stage4_completed: false,
        });
      } catch (error) {
        console.error("Failed to fetch stages:", error);
        // Keep default false values on error
      } finally {
        setLoadingStages(false);
      }
    };

    fetchStages();
  }, []);

  // Efficient step state calculation based on stage completion
  const calculateStepStates = () => {
    const {
      stage1_completed,
      stage2_completed,
      stage3_completed,
      stage4_completed,
    } = stages;

    // Map stages to steps
    const stageMap = [
      { stage: stage1_completed, id: 1, title: "Group Formation", description: "Form your project team and assign roles", icon: Users, route: "/student/group-formation" },
      { stage: stage2_completed, id: 2, title: "Advisor Selection and Idea Pitching", description: "Select an advisor and pitch your project idea", icon: UserCheck, route: null },
      { stage: stage3_completed, id: 3, title: "Proposal Submission", description: "Submit your detailed project proposal", icon: FileText, route: null },
      { stage: stage4_completed, id: 4, title: "Proposal Approved", description: "Wait for committee approval of your proposal", icon: CheckCircle2, route: null },
    ];

    // Find the first incomplete stage
    const firstIncompleteIndex = stageMap.findIndex((item) => !item.stage);
    
    return stageMap.map((item, index) => {
      const isCompleted = item.stage;
      const isNextActive = index === firstIncompleteIndex && firstIncompleteIndex !== -1;
      const isLocked = !isCompleted && !isNextActive;

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        icon: item.icon,
        completed: isCompleted,
        enabled: isNextActive,
        badge: isCompleted ? "Completed" : isNextActive ? "To be completed" : "Locked",
        route: item.route,
      };
    });
  };

  const steps = calculateStepStates();

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
              {/* Dynamic Vertical connector line - background muted line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-muted/30" />
              
              {/* Dynamic active progress line - calculates height based on completed steps */}
              {(() => {
                const completedCount = steps.filter((s) => s.completed).length;
                const hasActiveStep = steps.some((s) => s.enabled && !s.completed);
                const totalSteps = steps.length;
                
                // Calculate progress percentage
                let progressHeight = 0;
                if (completedCount === totalSteps) {
                  // All completed - show full line
                  progressHeight = 100;
                } else if (completedCount > 0) {
                  // Calculate base height: each step takes 25% (100% / 4 steps)
                  // Progress extends through completed steps
                  const stepHeight = 100 / totalSteps;
                  progressHeight = completedCount * stepHeight;
                  
                  // If there's an active step, add partial progress (20% of one step for visual indication)
                  if (hasActiveStep) {
                    progressHeight += stepHeight * 0.2;
                  }
                }
                
                return progressHeight > 0 ? (
                  <div 
                    className="absolute left-6 top-0 w-0.5 bg-primary transition-all duration-700 ease-out"
                    style={{
                      height: `${progressHeight}%`,
                    }}
                  />
                ) : null;
              })()}
              
              <div className="space-y-6">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isLast = index === steps.length - 1;
                  const nextStep = !isLast ? steps[index + 1] : null;
                  const prevStep = index > 0 ? steps[index - 1] : null;
                  
                  // Calculate connector line state
                  const showActiveConnector = step.completed && nextStep?.completed;
                  const showPartialConnector = step.completed && nextStep?.enabled && !nextStep?.completed;

                  return (
                    <div key={step.id} className="relative flex items-start gap-4 group">
                      {/* Step Icon Container */}
                      <div className="relative z-10 shrink-0">
                        {/* Subtle pulsing effect for active step */}
                        {step.enabled && !step.completed && (
                          <div className="absolute inset-0 rounded-lg bg-primary/10 animate-pulse opacity-50" />
                        )}
                        <div
                          className={`relative flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-300 ${
                            step.completed
                              ? "bg-primary shadow-lg shadow-primary/50 scale-100"
                              : step.enabled
                              ? "bg-primary/20 group-hover:bg-primary/30 scale-100"
                              : "bg-muted/50 scale-95"
                          }`}
                        >
                          {step.completed ? (
                            <CheckCircle className="h-6 w-6 text-primary-foreground animate-in zoom-in duration-300" />
                          ) : step.enabled ? (
                            <Icon
                              className="h-6 w-6 text-primary transition-all duration-300 group-hover:scale-110"
                            />
                          ) : (
                            <Icon
                              className="h-6 w-6 text-muted-foreground/50"
                            />
                          )}
                        </div>
                        
                        {/* Dynamic connector line segment - complements main progress line */}
                        {!isLast && (
                          <div className="absolute left-1/2 top-12 -translate-x-1/2 w-0.5 h-6 z-0 transition-all duration-500">
                            {showActiveConnector ? (
                              <div className="w-full h-full bg-primary shadow-sm shadow-primary/50" />
                            ) : showPartialConnector ? (
                              <div className="w-full h-full bg-gradient-to-b from-primary via-primary/60 to-primary/20" />
                            ) : (
                              <div className="w-full h-full bg-transparent" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Step Card */}
                      <div
                        className={`flex-1 rounded-lg border p-5 transition-all duration-300 ${
                          step.completed
                            ? "border-primary/30 bg-card/50 shadow-sm"
                            : step.enabled
                            ? "border-primary/30 bg-card group-hover:bg-accent group-hover:shadow-lg group-hover:border-primary/50 cursor-pointer transform group-hover:scale-[1.01]"
                            : "border-muted/50 bg-muted/20 opacity-60 cursor-not-allowed"
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
                                  step.completed || step.enabled
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {step.title}
                              </h3>
                              {loadingStages ? (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin inline" />
                                  Loading...
                                </Badge>
                              ) : step.badge ? (
                                <Badge
                                  className={`text-xs shrink-0 ${
                                    step.completed
                                      ? "bg-primary text-primary-foreground"
                                      : step.badge === "To be completed"
                                      ? "bg-primary/20 text-primary border-primary/30"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {step.badge}
                                </Badge>
                              ) : null}
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
            className="flex flex-col transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/40 hover:bg-accent/50 border-primary/20 will-change-transform origin-center transform-gpu cursor-pointer"
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
            <CardContent className="flex flex-col flex-1">
              <p className="text-sm text-muted-foreground mb-4 flex-1">
                Explore a collection of successful FYDP projects from previous
                years to get ideas and understand project requirements.
              </p>
              <Button 
                variant="outline" 
                className="w-full mt-auto"
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
          <Card 
            className="flex flex-col transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/40 hover:bg-accent/50 border-primary/20 will-change-transform origin-center transform-gpu cursor-pointer"
            onClick={() => navigate("/student/ai-chat")}
          >
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
            <CardContent className="flex flex-col flex-1">
              <p className="text-sm text-muted-foreground mb-4 flex-1">
                Use AI assistance to refine your project idea, get suggestions,
                and improve your proposal.
              </p>
              <Button 
                variant="outline" 
                className="w-full mt-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/student/ai-chat");
                }}
              >
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

