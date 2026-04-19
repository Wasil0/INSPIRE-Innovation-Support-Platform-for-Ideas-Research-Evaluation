import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FileText,
  MessageSquare,
  ArrowLeft,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { getProposalStatus, submitProposal } from "@/api/student";

const ProposalSubmission = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  
  // Proposal Data
  const [proposalExists, setProposalExists] = useState(false);
  const [proposalData, setProposalData] = useState(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await getProposalStatus();
      if (res && res.exists) {
        setProposalExists(true);
        setProposalData(res);
      } else {
        setProposalExists(false);
        setProposalData(null);
      }
    } catch (error) {
      console.error("Failed to fetch proposal status:", error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      alert("Please upload a valid PDF document.");
      setFile(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      alert("Please drop a valid PDF document.");
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    try {
      setIsSubmitting(true);
      await submitProposal(file);
      await fetchStatus(); // refresh UI
    } catch (error) {
      const msg = error.response?.data?.detail || "Failed to submit proposal.";
      alert(msg);
    } finally {
      setIsSubmitting(false);
      setFile(null);
    }
  };

  const getTimelineStatus = () => {
    if (!proposalData || !proposalData.events) return null;
    
    // Default abstract statuses
    let submittedState = "completed"; // If it exists, they submitted it
    let advisorState = "pending"; 
    let committeeState = "pending";
    let rejectComment = null;
    let rejectRole = null;

    // Evaluate events chronologically
    proposalData.events.forEach(evt => {
      if (evt.action === "advisor_rejected") {
        advisorState = "rejected";
        rejectComment = evt.comment;
        rejectRole = "Advisor";
      }
      if (evt.action === "advisor_accepted") {
        advisorState = "completed";
      }
      if (evt.action === "committee_rejected") {
        committeeState = "rejected";
        rejectComment = evt.comment;
        rejectRole = "Committee";
      }
      if (evt.action === "committee_accepted") {
        committeeState = "completed";
      }
    });

    const isAnyRejected = advisorState === "rejected" || committeeState === "rejected";

    return {
      submittedState,
      advisorState,
      committeeState,
      isAnyRejected,
      rejectComment,
      rejectRole
    };
  };

  const tl = getTimelineStatus();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/student/fydp-progress")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Progress Tracking
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            FYDP Proposal Submission
          </h1>
          <p className="text-muted-foreground">
            Complete your project proposal, utilize AI for assistance, and track approval status.
          </p>
        </div>

        {loadingStatus ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN: Main Action Area (Upload / Timeline Tracking) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* TIMELINE CARD */}
              {proposalExists && (
                <Card className="border-primary/20 bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      Proposal Tracker
                      {tl?.isAnyRejected ? (
                        <Badge variant="destructive" className="ml-auto">Revision Required</Badge>
                      ) : tl?.committeeState === "completed" ? (
                        <Badge variant="success" className="ml-auto bg-green-600">Fully Approved</Badge>
                      ) : (
                        <Badge variant="secondary" className="ml-auto">In Review</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Track the approval status of your currently submitted {" "}
                      <a 
                        href={`http://localhost:8000/project_proposals/download/${proposalData.file_id}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-primary hover:underline font-medium"
                      >
                        Proposal Document
                      </a>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative py-4">
                      {/* Sub Line connection */}
                      <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-muted"></div>
                      
                      {/* BEAD 1: Submitted */}
                      <div className="relative flex gap-4 mb-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 shrink-0 z-10 border-4 border-background">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div className="pt-3">
                          <h4 className="font-semibold text-foreground">Proposal Submitted</h4>
                          <p className="text-sm text-muted-foreground">Document safely stored in the repository.</p>
                        </div>
                      </div>

                      {/* BEAD 2: Advisor Review */}
                      <div className="relative flex gap-4 mb-8">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full shrink-0 z-10 border-4 border-background ${
                          tl?.advisorState === "completed" ? "bg-green-100 text-green-600" :
                          tl?.advisorState === "rejected" ? "bg-red-100 text-red-600 animate-pulse" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {tl?.advisorState === "completed" ? <CheckCircle2 className="h-6 w-6" /> :
                           tl?.advisorState === "rejected" ? <AlertCircle className="h-6 w-6" /> :
                           <Clock className="h-6 w-6" />}
                        </div>
                        <div className="pt-3">
                          <h4 className="font-semibold text-foreground">Advisor Review</h4>
                          {tl?.advisorState === "completed" && <p className="text-sm text-green-600">Approved by your advisor.</p>}
                          {tl?.advisorState === "pending" && <p className="text-sm text-muted-foreground">Waiting for advisor assessment.</p>}
                          {tl?.advisorState === "rejected" && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-md">
                              <p className="text-sm font-medium text-red-800 mb-1">Rejection Feedback:</p>
                              <p className="text-sm text-red-700">{tl?.rejectComment}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* BEAD 3: Committee Review */}
                      <div className="relative flex gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full shrink-0 z-10 border-4 border-background ${
                          tl?.committeeState === "completed" ? "bg-green-100 text-green-600" :
                          tl?.committeeState === "rejected" ? "bg-red-100 text-red-600 animate-pulse" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {tl?.committeeState === "completed" ? <CheckCircle2 className="h-6 w-6" /> :
                           tl?.committeeState === "rejected" ? <AlertCircle className="h-6 w-6" /> :
                           <Clock className="h-6 w-6" />}
                        </div>
                        <div className="pt-3">
                          <h4 className="font-semibold text-foreground">Committee Approval</h4>
                          {tl?.committeeState === "completed" && <p className="text-sm text-green-600">Final approval granted.</p>}
                          {tl?.committeeState === "pending" && (
                             <p className="text-sm text-muted-foreground">
                               {tl?.advisorState === "completed" ? "Waiting for committee evaluation." : "Locked until Advisor approves."}
                             </p>
                          )}
                          {tl?.committeeState === "rejected" && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-md">
                              <p className="text-sm font-medium text-red-800 mb-1">Committee Feedback:</p>
                              <p className="text-sm text-red-700">{tl?.rejectComment}</p>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              )}

              {/* UPLOAD CARD - Shows if no proposal exists OR if currently rejected */}
              {(!proposalExists || tl?.isAnyRejected) && (
                <Card className="border-primary/20 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <UploadCloud className="h-5 w-5 text-primary" />
                      {tl?.isAnyRejected ? "Upload Revised Proposal" : "Upload Proposal Document"}
                    </CardTitle>
                    <CardDescription>
                      Upload your compiled proposal. Must be a .pdf format (max 15MB).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
                        file ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/10"
                      }`}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        id="proposal-upload"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="proposal-upload" className="cursor-pointer block w-full h-full">
                        {file ? (
                          <div className="flex flex-col items-center">
                            <FileText className="h-12 w-12 text-primary mb-4" />
                            <p className="text-sm font-medium text-foreground">{file.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                            <Button type="button" variant="link" className="mt-2" onClick={(e) => { e.preventDefault(); setFile(null); }}>
                              Remove File
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-sm font-medium text-foreground mb-1">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PDF documents only (Limit 15MB)
                            </p>
                          </div>
                        )}
                      </label>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button
                        disabled={!file || isSubmitting}
                        onClick={handleSubmit}
                        className="min-w-[150px]"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Proposal"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* RIGHT COLUMN: Helper Resources */}
            <div className="space-y-6">
              
              {/* TEMPLATE DOWNLOAD */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Required Template
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Before uploading, ensure you have filled out the official FYDP Proposal Form clearly documenting your goals and timeline.
                  </p>
                  <Button variant="outline" className="w-full flex justify-between group" asChild>
                    <a href="/assets/docs/Appendix C2 - FYDP Proposal Form.docx" download>
                      Download Template
                      <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* AI CHAT HELPER */}
              <Card className="border-primary/30 bg-primary/5 shadow-md">
                <CardContent className="pt-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <MessageSquare className="h-24 w-24" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex bg-primary/20 w-12 h-12 rounded-lg items-center justify-center mb-4">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground mb-2">Need Guidance?</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Struggling with phrasing or ensuring your proposal hits all the academic marks? Our AI Assistant is specifically tuned to help review and structure your ideas.
                    </p>
                    <Button onClick={() => navigate("/student/ai-chat")} className="w-full shadow-lg">
                      Open AI Assistant
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalSubmission;
