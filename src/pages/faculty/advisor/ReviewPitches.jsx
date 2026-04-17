import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserCheck, CheckCircle, XCircle, Loader2, Eye, X, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { getAdvisorPitches, updatePitchStatus } from "@/api/advisors";

const ReviewPitches = () => {
  const navigate = useNavigate();
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filter, setFilter] = useState("all"); // 'all', 'pending', 'accepted', 'rejected'
  
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchPitches();
  }, []);

  const fetchPitches = async () => {
    try {
      setLoading(true);
      const data = await getAdvisorPitches();
      setPitches(data || []);
    } catch (error) {
      console.error("Failed to fetch pitches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (pitchId, newStatus) => {
    try {
      setIsUpdating(true);
      await updatePitchStatus(pitchId, newStatus);
      // Re-fetch to seamlessly update local data without reloading
      await fetchPitches();
      
      // Update selected pitch locally to reflect new status if modal is open
      if (selectedPitch && selectedPitch.pitch_id === pitchId) {
        setSelectedPitch({...selectedPitch, status: newStatus});
      }
    } catch (error) {
      console.error("Failed to update status", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-primary text-primary-foreground">Accepted</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };
  
  // Apply Filter and then Sort: Pending -> Accepted -> Rejected
  const getProcessedPitches = () => {
    // 1. Filter
    let filtered = pitches;
    if (filter !== "all") {
      filtered = pitches.filter(p => p.status === filter);
    }
    
    // 2. Sort
    const statusWeight = { "pending": 1, "accepted": 2, "rejected": 3 };
    
    return filtered.sort((a, b) => {
      // First by status weight
      if (statusWeight[a.status] !== statusWeight[b.status]) {
        return statusWeight[a.status] - statusWeight[b.status];
      }
      // Then by date (newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });
  };

  const processedPitches = getProcessedPitches();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/faculty/advisor")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-primary" />
              Review Student Pitches
            </h1>
            <p className="text-muted-foreground">
              Review and securely manage all FYDP ideas pitched to you by student groups.
            </p>
          </div>
        </div>
        
        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Badge 
            variant={filter === "all" ? "default" : "outline"} 
            className="cursor-pointer px-4 py-1.5 text-sm transition-colors hover:bg-primary/80"
            onClick={() => setFilter("all")}
          >
            All Pitches
          </Badge>
          <Badge 
            variant={filter === "pending" ? "default" : "outline"} 
            className="cursor-pointer px-4 py-1.5 text-sm transition-colors hover:bg-secondary/80"
            onClick={() => setFilter("pending")}
          >
            Pending
          </Badge>
          <Badge 
            variant={filter === "accepted" ? "default" : "outline"} 
            className="cursor-pointer px-4 py-1.5 text-sm transition-colors hover:bg-primary/80"
            onClick={() => setFilter("accepted")}
          >
            Accepted
          </Badge>
          <Badge 
            variant={filter === "rejected" ? "default" : "outline"} 
            className="cursor-pointer px-4 py-1.5 text-sm transition-colors hover:bg-destructive/80"
            onClick={() => setFilter("rejected")}
          >
            Rejected
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : processedPitches.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {processedPitches.map((pitch) => (
              <Card key={pitch.pitch_id} className="flex flex-col h-full border-border/50 hover:border-primary/30 transition-all shadow-sm hover:shadow-md">
                <CardHeader className="pb-3 border-b border-border/30 bg-muted/10">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-xl mb-2">{pitch.title || "Untitled Project"}</CardTitle>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-muted-foreground mr-1">Group:</span>
                        {pitch.members && pitch.members.length > 0 ? (
                          pitch.members.map((m, i) => (
                            <Badge key={i} variant="secondary" className="text-xs font-normal">
                              {m.name} ({m.roll_number || 'N/A'})
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Unknown Group</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {getStatusBadge(pitch.status)}
                      {pitch.is_industry && (
                        <Badge className="bg-primary text-primary-foreground text-[10px]">Industry</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Project Summary</h4>
                  <p className="text-sm text-foreground line-clamp-3">
                    {pitch.summary || pitch.description || "No summary provided."}
                  </p>
                </CardContent>
                <CardFooter className="pt-4 border-t border-border/30 flex items-center justify-between bg-muted/10">
                  <div className="text-xs text-muted-foreground">
                    {new Date(pitch.created_at).toLocaleDateString()}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedPitch(pitch)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Review Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card border rounded-lg">
            <UserCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">No Pitches Found</h3>
            <p className="text-muted-foreground">
              There are no idea pitches matching the selected filter.
            </p>
          </div>
        )}
      </div>

      {/* Pitch Details Modal Overlay */}
      {selectedPitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-3xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <CardHeader className="flex flex-row items-start justify-between pb-4 border-b bg-muted/20">
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusBadge(selectedPitch.status)}
                  {selectedPitch.is_industry && (
                    <Badge className="bg-primary text-primary-foreground">Industry Idea</Badge>
                  )}
                </div>
                <CardTitle className="text-2xl leading-tight">{selectedPitch.title}</CardTitle>
                <div className="flex items-center text-sm text-muted-foreground mt-3 flex-wrap gap-2">
                  <span className="font-medium mr-1">Submitted By:</span>
                  {selectedPitch.members && selectedPitch.members.map((m, i) => (
                    <Badge key={i} variant="secondary" className="font-normal">
                      {m.name} ({m.roll_number || 'N/A'})
                    </Badge>
                  ))}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="-mr-2 shrink-0 rounded-full" onClick={() => setSelectedPitch(null)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            
            <CardContent className="pt-6 overflow-y-auto space-y-6">
              {/* Summary Section */}
              <section>
                <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Summary</h4>
                <div className="text-foreground text-sm leading-relaxed p-4 bg-muted/30 rounded-lg border border-border/50">
                  {selectedPitch.summary || selectedPitch.description || "No summary provided."}
                </div>
              </section>

              {/* Detailed Description Section */}
              <section>
                <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Detailed Description</h4>
                <div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap p-4 bg-muted/30 rounded-lg border border-border/50">
                  {selectedPitch.detailed_description || selectedPitch.description || "No detailed description provided."}
                </div>
              </section>

              {/* Flowchart Asset Section */}
              {selectedPitch.flowchart_id && (
                <section>
                  <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FileImage className="h-4 w-4" /> System Architecture / Flowchart
                  </h4>
                  <div className="rounded-lg border overflow-hidden bg-muted/10 p-2 flex justify-center">
                    <img 
                      src={`http://localhost:8000/student_pitches/image/${selectedPitch.flowchart_id}`} 
                      alt="Project Flowchart" 
                      className="max-w-full h-auto max-h-[400px] object-contain rounded"
                      onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span class="text-sm text-muted-foreground p-4">Image failed to load.</span>'; }}
                    />
                  </div>
                </section>
              )}
            </CardContent>
            
            <CardFooter className="border-t p-4 flex justify-between bg-muted/10">
              <span className="text-xs text-muted-foreground">
                Submitted: {new Date(selectedPitch.created_at).toLocaleString()}
              </span>
              
              <div className="flex gap-3">
                {selectedPitch.status === "pending" && (
                  <>
                    <Button 
                      variant="outline" 
                      className="border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(selectedPitch.pitch_id, "rejected")}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button 
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(selectedPitch.pitch_id, "accepted")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Accept Idea
                    </Button>
                  </>
                )}
                {selectedPitch.status !== "pending" && (
                  <Button variant="outline" onClick={() => setSelectedPitch(null)}>
                    Close Viewer
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReviewPitches;
