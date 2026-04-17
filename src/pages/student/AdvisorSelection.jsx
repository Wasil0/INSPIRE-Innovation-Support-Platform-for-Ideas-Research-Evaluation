import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, UserCheck, Building2, Send, X, CheckCircle2, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { getAllAdvisors } from "@/api/advisors";
import { submitIdeaPitch } from "@/api/student";

const AdvisorSelection = () => {
  const navigate = useNavigate();
  const [advisors, setAdvisors] = useState([]);
  const [isLoadingAdvisors, setIsLoadingAdvisors] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
  
  // Modal state
  const [pitchTitle, setPitchTitle] = useState("");
  const [pitchSummary, setPitchSummary] = useState("");
  const [pitchDetailedDescription, setPitchDetailedDescription] = useState("");
  const [pitchFlowchart, setPitchFlowchart] = useState(null);
  const [isIndustryPitch, setIsIndustryPitch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchAdvisors = async () => {
    try {
      setIsLoadingAdvisors(true);
      const data = await getAllAdvisors();
      setAdvisors(data);
    } catch (error) {
      console.error("Failed to fetch advisors", error);
    } finally {
      setIsLoadingAdvisors(false);
    }
  };

  useEffect(() => {
    fetchAdvisors();
  }, []);

  const filteredAdvisors = advisors.filter(
    (advisor) =>
      (advisor.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (advisor.department?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const handlePitchSubmit = async (e) => {
    e.preventDefault();
    if (!pitchTitle || !pitchSummary || !pitchDetailedDescription || !pitchFlowchart) return;

    setIsSubmitting(true);
    setSubmitError("");
    try {
      await submitIdeaPitch({
        advisor_id: selectedAdvisor.advisor_id,
        title: pitchTitle,
        summary: pitchSummary,
        detailed_description: pitchDetailedDescription,
        flowchart_image: pitchFlowchart,
        is_industry: isIndustryPitch.toString()
      });
      
      setSubmitSuccess(true);
      // Refetch advisors to update team_pitch_status locally
      await fetchAdvisors();
      
      // Auto close after success
      setTimeout(() => {
        closeModal();
      }, 2500);
    } catch (error) {
      setSubmitError(error.response?.data?.detail || "Failed to submit pitch. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setSelectedAdvisor(null);
    setPitchTitle("");
    setPitchSummary("");
    setPitchDetailedDescription("");
    setPitchFlowchart(null);
    setIsIndustryPitch(false);
    setSubmitSuccess(false);
    setSubmitError("");
  };

  // Helper to get initials for avatar
  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/student/fydp-progress")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to FYDP Progress
        </Button>

        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Advisor Selection
            </h1>
            <p className="text-muted-foreground">
              Browse available advisors and pitch your FYDP idea
            </p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or department..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Advisors Grid */}
        {isLoadingAdvisors ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAdvisors.map((advisor) => {
              const hasNoSlots = advisor.available_normal_slots === 0 && advisor.available_industry_slots === 0;
              const isPending = advisor.team_pitch_status === "pending";
              const isAccepted = advisor.team_pitch_status === "accepted";
              
              return (
                <Card key={advisor.advisor_id} className="flex flex-col h-full border-primary/10 hover:border-primary/30 transition-all">
                  <CardHeader className="flex flex-row items-center gap-4 pb-4">
                    <Avatar className="h-14 w-14 border border-primary/20">
                      <AvatarImage src={advisor.image} alt={advisor.name} />
                      <AvatarFallback className="bg-primary/5 text-primary text-lg font-semibold">
                        {getInitials(advisor.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{advisor.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Building2 className="h-3 w-3" />
                        {advisor.department}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 pb-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Normal Slots</span>
                        <Badge variant="outline" className={advisor.available_normal_slots > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-destructive/10 text-destructive border-destructive/20"}>
                          {advisor.available_normal_slots} Available
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Industry Slots</span>
                        <Badge variant="outline" className={advisor.available_industry_slots > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-destructive/10 text-destructive border-destructive/20"}>
                          {advisor.available_industry_slots} Available
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    {isPending ? (
                      <Button variant="secondary" className="w-full" disabled>
                        <Clock className="mr-2 h-4 w-4" />
                        Pending Approval
                      </Button>
                    ) : isAccepted ? (
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Idea Accepted
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        disabled={hasNoSlots}
                        onClick={() => setSelectedAdvisor(advisor)}
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Select & Pitch Idea
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
            
            {filteredAdvisors.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                No advisors found matching your criteria.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pitch Modal Overlay */}
      {selectedAdvisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg shadow-xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {submitSuccess ? (
              <div className="flex flex-col items-center justify-center p-10 text-center">
                <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Pitch Submitted!</h2>
                <p className="text-muted-foreground">
                  Your idea has been successfully pitched to {selectedAdvisor.name}. You and your team will be notified once they review it.
                </p>
              </div>
            ) : (
              <>
                <CardHeader className="flex flex-row items-start justify-between pb-4 border-b">
                  <div>
                    <CardTitle className="text-xl">Pitch Your Idea</CardTitle>
                    <CardDescription className="mt-1">
                      Pitching to <span className="font-medium text-foreground">{selectedAdvisor.name}</span>
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="-mt-2 -mr-2" onClick={closeModal}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-6 overflow-y-auto">
                  <form id="pitch-form" onSubmit={handlePitchSubmit} className="space-y-5">
                    {submitError && (
                      <div className="bg-destructive/10 text-destructive text-sm font-medium p-3 rounded-md">
                        {submitError}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="title">Project Title</Label>
                      <Input 
                        id="title" 
                        placeholder="E.g., AI-Powered Attendance System" 
                        value={pitchTitle}
                        onChange={(e) => setPitchTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="summary">Brief Summary</Label>
                      <textarea
                        id="summary"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                        placeholder="Provide a short overview of your idea..."
                        value={pitchSummary}
                        onChange={(e) => setPitchSummary(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Detailed Description</Label>
                      <textarea
                        id="description"
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                        placeholder="Describe the problem, proposed solution, and technology stack..."
                        value={pitchDetailedDescription}
                        onChange={(e) => setPitchDetailedDescription(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="flowchart">System Architecture / Flowchart</Label>
                      <Input 
                        id="flowchart" 
                        type="file" 
                        accept="image/png, image/jpeg"
                        onChange={(e) => setPitchFlowchart(e.target.files[0])}
                        required
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2 pb-2 rounded-md border p-4 bg-muted/30">
                      <Checkbox 
                        id="isIndustry" 
                        checked={isIndustryPitch} 
                        onCheckedChange={setIsIndustryPitch} 
                      />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="isIndustry" className="font-medium">
                          This is an Industrial idea
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Check this if your FYDP idea is sponsored or brought from an industry partner.
                        </p>
                      </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-end gap-3">
                  <Button variant="outline" onClick={closeModal} type="button">
                    Cancel
                  </Button>
                  <Button type="submit" form="pitch-form" disabled={isSubmitting || !pitchTitle || !pitchSummary || !pitchDetailedDescription || !pitchFlowchart}>
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Pitch
                      </>
                    )}
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdvisorSelection;
