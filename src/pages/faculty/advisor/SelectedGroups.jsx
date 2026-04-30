import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, FileText, CheckCircle, XCircle, AlertCircle, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { getAdvisorSelectedGroups, reviewProposal } from "@/api/advisors";
import api from "@/api/axiosConfig";

const SelectedGroups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [activeGroup, setActiveGroup] = useState(null);
  const [isReviewRejecting, setIsReviewRejecting] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await getAdvisorSelectedGroups();
      setGroups(data || []);
    } catch (error) {
      console.error("Error fetching selected groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (action) => {
    if (action === "rejected" && !reviewComment.trim()) {
      alert("Please provide feedback for the rejection.");
      return;
    }

    try {
      setSubmittingReview(true);
      await reviewProposal(activeGroup.proposal_id, action, reviewComment);
      
      // Close modal and refresh data
      setActiveGroup(null);
      setIsReviewRejecting(false);
      setReviewComment("");
      await fetchGroups();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (group) => {
    if (!group) return null;
    if (!group.has_proposal) {
      return <Badge variant="secondary">No Proposal Submitted</Badge>;
    }
    const status = group.proposal_status;
    if (status === "pending") {
      return <Badge variant="secondary">Ready for Review</Badge>;
    } else if (status === "advisor_accepted" || status === "committee_accepted") {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1"/> Approved</Badge>;
    } else if (status === "advisor_rejected" || status === "committee_rejected") {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1"/> Rejected</Badge>;
    }
    return <Badge>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <Button
          variant="ghost"
          onClick={() => navigate("/faculty/advisor/dashboard")}
          className="mb-6 -ml-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Selected FYDP Groups
          </h1>
          <p className="text-muted-foreground">
            Manage the student project teams you are supervising and review their proposal documents.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground animate-pulse">Loading supervised groups...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 bg-card border rounded-lg shadow-sm">
            <UserCheck className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No Groups Selected</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              You haven't accepted any idea pitches yet. Groups will appear here once you agree to supervise them.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Card key={group.team_id} className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-md border-primary/20">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    {getStatusBadge(group)}
                  </div>
                  <CardTitle className="text-xl line-clamp-2 leading-tight">
                    {group.project_title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {group.project_summary || "No summary provided."}
                  </p>
                  
                  <div className="space-y-1.5 mt-auto pt-4 border-t">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Group Members</p>
                    <div className="flex flex-wrap gap-2">
                      {group.members && group.members.map((member, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs font-normal">
                          {member.name} ({member.roll_number})
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-auto">
                    {!group.has_proposal ? (
                      <div className="rounded-md bg-secondary flex items-center justify-center p-3 text-sm text-muted-foreground">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Pending Student Submission
                      </div>
                    ) : (
                      <Button 
                        className="w-full" 
                        variant={group.proposal_status === "pending" ? "default" : "outline"}
                        onClick={() => setActiveGroup(group)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {group.proposal_status === "pending" ? "Review Proposal" : "View Details"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Embedded PDF Review Modal */}
      <Dialog open={!!activeGroup} onOpenChange={(open) => {
        if (!open) {
          setActiveGroup(null);
          setIsReviewRejecting(false);
          setReviewComment("");
        }
      }}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 gap-0 overflow-hidden bg-background flex flex-col">
          <DialogHeader className="px-6 py-4 border-b bg-card shrink-0 z-10 h-16">
            <DialogTitle className="flex items-center text-xl">
              <FileText className="mr-3 h-5 w-5 text-primary" />
              Document Review Workspace
              <span className="mx-3 text-muted-foreground">|</span>
              <span className="text-base font-normal text-muted-foreground line-clamp-1">{activeGroup?.project_title}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 w-full overflow-hidden">
            {/* PDF Viewer - Left 70% */}
            <div className="flex-1 bg-muted/30 border-r relative flex flex-col">
              {activeGroup?.proposal_file_id ? (
                <iframe 
                  src={`${api.defaults.baseURL}/project_proposals/download/${activeGroup.proposal_file_id}#toolbar=0`} 
                  className="w-full h-full border-0"
                  title="PDF Document"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Failed to load document stream.
                </div>
              )}
            </div>

            {/* Actions Sidebar - Right 30% */}
            <div className="w-[400px] flex flex-col bg-card shrink-0 h-full overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 space-y-6 min-h-0">
                <div>
                  <h3 className="font-semibold text-lg border-b pb-2 mb-4">Proposal Details</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Status</span>
                      {getStatusBadge(activeGroup)}
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Project Title</span>
                      <p className="font-medium">{activeGroup?.project_title}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Group Members</span>
                      <ul className="list-disc pl-4 space-y-1">
                        {activeGroup?.members?.map((m, i) => (
                          <li key={i}>{m.name}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Display previous rejection reason if viewing a rejected/accepted proposal */}
                {activeGroup?.proposal_status !== "pending" && activeGroup?.proposal_events && (
                  <div className="bg-secondary/50 rounded-lg p-4 border text-sm">
                    <p className="font-medium mb-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 text-primary" />
                      Status Logbook
                    </p>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                       {activeGroup.proposal_events.map((ev, i) => (
                         <div key={i} className="border-l-2 border-primary/50 pl-3">
                            <span className="text-xs text-muted-foreground">{new Date(ev.timestamp).toLocaleString()}</span>
                            <p className="text-xs font-semibold uppercase">{ev.action.replace('_', ' ')}</p>
                            <p className="text-muted-foreground mt-1 bg-background/80 p-2 rounded">{ev.comment}</p>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Pinned to Bottom */}
              {activeGroup?.proposal_status === "pending" && (
                <div className="p-6 border-t bg-card/50 shadow-sm shrink-0 space-y-4">
                  {!isReviewRejecting ? (
                    <>
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => handleReviewAction("accepted")}
                        disabled={submittingReview}
                      >
                        {submittingReview ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                        Approve Proposal
                      </Button>
                      <Button 
                        className="w-full" 
                        variant="secondary"
                        size="lg"
                        onClick={() => setIsReviewRejecting(true)}
                        disabled={submittingReview}
                      >
                        <XCircle className="w-5 h-5 mr-2" />
                        Reject with Feedback
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block text-destructive">Rejection Feedback Required</label>
                        <Textarea 
                          placeholder="Explain what the students need to change..." 
                          className="min-h-[120px] resize-none focus-visible:ring-destructive/30"
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          autoFocus
                          disabled={submittingReview}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          className="flex-1"
                          onClick={() => setIsReviewRejecting(false)}
                          disabled={submittingReview}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          className="flex-1"
                          onClick={() => handleReviewAction("rejected")}
                          disabled={submittingReview || !reviewComment.trim()}
                        >
                          {submittingReview ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirm Reject"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SelectedGroups;
