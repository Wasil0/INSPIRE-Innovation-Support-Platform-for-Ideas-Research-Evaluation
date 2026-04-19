import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  User,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ChevronRight,
  Download,
  MessageSquare,
  Users,
  AlertCircle,
  Loader2
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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { getAllCommitteeProposals, reviewCommitteeProposal } from "@/api/committee";

export default function CommitteeProposals() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Dialog State
  const [activeProposal, setActiveProposal] = useState(null);
  const [isReviewRejecting, setIsReviewRejecting] = useState(false);
  const [reviewAction, setReviewAction] = useState(""); // Currently not strictly needed, but kept for logic
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const data = await getAllCommitteeProposals();
      setProposals(data);
    } catch (error) {
      console.error("Failed to load proposals", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (action) => {
    if (action === "rejected" && !feedback.trim()) {
      alert("Please provide feedback for the rejection.");
      return;
    }
    
    try {
      setSubmitting(true);
      await reviewCommitteeProposal(activeProposal.proposal_id, {
        action: action,
        comment: feedback
      });
      // Close modal and refresh data
      setActiveProposal(null);
      setIsReviewRejecting(false);
      setFeedback("");
      await fetchProposals();
    } catch (error) {
      console.error("Failed to submit review:", error);
      alert("Error submitting review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "advisor_accepted":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending Review</Badge>;
      case "committee_accepted":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><CheckCircle className="w-3 h-3 mr-1"/> Approved</Badge>;
      case "committee_rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1"/> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/faculty/committee/CommitteeDashboard")}
          className="mb-6 -ml-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Manage Proposals
          </h1>
          <p className="text-muted-foreground">
            Review and finalize FYDP proposals submitted by student groups.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground animate-pulse">Loading committee proposals...</p>
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-16 bg-card border rounded-lg shadow-sm">
            <div className="flex justify-center mb-4 text-muted-foreground/50">
              <FileText className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium">No Proposals Found</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              There are currently no proposals waiting for committee review.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposals.map((proposal) => (
              <Card key={proposal.proposal_id} className="transition-all duration-300 hover:shadow-md border-primary/20 flex flex-col overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex justify-between items-start mb-2">
                    {getStatusBadge(proposal.status)}
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      {proposal.submitted_date}
                    </span>
                  </div>
                  <CardTitle className="text-xl line-clamp-2 leading-tight">
                    {proposal.project_title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-4 flex-1 space-y-4">
                  {/* Advisor Info */}
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs text-muted-foreground">Supervised by</p>
                      <p className="text-sm font-medium truncate">{proposal.advisor_name}</p>
                    </div>
                  </div>

                  {/* Student Team List */}
                  <div className="space-y-1.5 mt-auto pt-2">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Group Members</p>
                    <div className="flex flex-wrap gap-2">
                      {proposal.members && proposal.members.length > 0 ? (
                        proposal.members.map((member, i) => (
                          <Badge key={i} variant="secondary" className="text-xs font-normal">
                            {member.name} ({member.roll_number})
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No members found</span>
                      )}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="bg-muted/30 pt-4 flex pb-4 border-t border-border/50">
                   <Button 
                     className="w-full" 
                     variant={proposal.status === "advisor_accepted" ? "default" : "outline"}
                     onClick={() => setActiveProposal(proposal)}
                   >
                     <FileText className="w-4 h-4 mr-2" />
                     {proposal.status === "advisor_accepted" ? "Review Proposal" : "View Details"}
                   </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Embedded PDF Review Modal */}
      <Dialog open={!!activeProposal} onOpenChange={(open) => {
        if (!open) {
          setActiveProposal(null);
          setIsReviewRejecting(false);
          setFeedback("");
        }
      }}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 gap-0 overflow-hidden bg-background flex flex-col">
          <DialogHeader className="px-6 py-4 border-b bg-card shrink-0 z-10 h-16">
            <DialogTitle className="flex items-center text-xl">
              <FileText className="mr-3 h-5 w-5 text-primary" />
              Document Review Workspace
              <span className="mx-3 text-muted-foreground">|</span>
              <span className="text-base font-normal text-muted-foreground line-clamp-1">{activeProposal?.project_title}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 w-full overflow-hidden">
            {/* PDF Viewer - Left 70% */}
            <div className="flex-1 bg-muted/30 border-r relative flex flex-col">
              {activeProposal?.file_id ? (
                <iframe 
                  src={`http://localhost:8000/project_proposals/download/${activeProposal.file_id}#toolbar=0`} 
                  className="w-full h-full border-0"
                  title="PDF Document"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
                  <p>No document attached to this proposal.</p>
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
                      {getStatusBadge(activeProposal?.status)}
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Project Title</span>
                      <p className="font-medium">{activeProposal?.project_title}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Supervised By</span>
                      <p className="font-medium">{activeProposal?.advisor_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Group Members</span>
                      <ul className="list-disc pl-4 space-y-1">
                        {activeProposal?.members?.map((m, i) => (
                          <li key={i}>{m.name} ({m.roll_number})</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Display previous events/comments */}
                {activeProposal?.events && activeProposal.events.length > 0 && (
                  <div className="bg-secondary/50 rounded-lg p-4 border text-sm">
                    <p className="font-medium mb-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 text-primary" />
                      Status Logbook
                    </p>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                       {activeProposal.events.map((ev, i) => (
                         <div key={i} className="border-l-2 border-primary/50 pl-3">
                            <span className="text-xs text-muted-foreground">{new Date(ev.timestamp).toLocaleString()}</span>
                            <p className="text-xs font-semibold uppercase">{ev.action.replace('_', ' ')}</p>
                            <p className="text-muted-foreground mt-1 bg-background/80 p-2 rounded break-words">{ev.comment}</p>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Pinned to Bottom */}
              {activeProposal?.status === "advisor_accepted" && (
                <div className="p-6 border-t bg-card/50 shadow-sm shrink-0 space-y-4">
                  {!isReviewRejecting ? (
                    <>
                      <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-transparent" 
                        size="lg"
                        onClick={() => handleReviewAction("accepted")}
                        disabled={submitting}
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                        Approve Proposal
                      </Button>
                      <Button 
                        className="w-full" 
                        variant="secondary"
                        size="lg"
                        onClick={() => setIsReviewRejecting(true)}
                        disabled={submitting}
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
                          placeholder="Explain what needs to be changed..." 
                          className="min-h-[120px] resize-none focus-visible:ring-destructive/30"
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          autoFocus
                          disabled={submitting}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          className="flex-1"
                          onClick={() => setIsReviewRejecting(false)}
                          disabled={submitting}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          className="flex-1"
                          onClick={() => handleReviewAction("rejected")}
                          disabled={submitting || !feedback.trim()}
                        >
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirm Reject"}
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
}
