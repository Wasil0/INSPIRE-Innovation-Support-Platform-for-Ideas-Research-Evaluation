import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, ArrowLeft, Mail, Info, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { getInterestedGroupsForIndustry } from "@/api/industry";

const InterestedGroups = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [interestedGroups, setInterestedGroups] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const data = await getInterestedGroupsForIndustry();
        setInterestedGroups(data || []);
      } catch (err) {
        console.error("Failed to fetch interested groups:", err);
        setError("Failed to load interested student groups. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/industry/dashboard")}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center bg-primary text-primary-foreground rounded-xl shadow-sm">
              <Users className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Interested Student Groups</h1>
              <p className="text-muted-foreground">Teams that have shown interest in your FYDP ideas</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-lg flex items-start gap-3">
            <Info className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-medium text-sm">Error</h4>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted w-1/3 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted w-1/2 rounded mb-2"></div>
                  <div className="h-4 bg-muted w-2/3 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : interestedGroups.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {interestedGroups.map((group, index) => (
              <Card key={index} className="border-primary/20 shadow-sm transition-all hover:shadow-md">
                <CardHeader className="bg-muted/30 pb-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="mb-2 uppercase text-xs tracking-wider bg-primary text-primary-foreground hover:bg-primary/90">
                        Applied to Idea
                      </Badge>
                      <CardTitle className="text-xl text-primary">{group.idea_title}</CardTitle>
                      <CardDescription className="mt-1">
                        Application submitted on {new Date(group.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {group.team_score !== undefined && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{group.team_score}%</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Skill Match Score</div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center text-foreground">
                      <Users className="h-4 w-4 mr-2" /> Team Members ({group.members?.length || 0})
                    </h4>
                    
                    {/* Render members securely */}
                    {group.members && group.members.length > 0 ? (
                       <ul className="list-disc pl-5 space-y-1">
                            {group.members.map((member, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-center flex-wrap gap-2">
                                    <span className="font-medium text-foreground">{member.name || `Member ${idx + 1}`}</span> 
                                    <span className="text-xs text-muted-foreground flex items-center">
                                      <Mail className="inline w-3 h-3 mr-1 opacity-70" />
                                      {member.email || "Unknown Email"}
                                    </span>
                                    <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground border">
                                      Match: {member.individual_score !== undefined ? `${member.individual_score}%` : 'N/A'}
                                    </span>
                                </li>
                            ))}
                       </ul>
                    ) : (
                        <p className="text-xs text-muted-foreground italic">No members documented.</p>
                    )}
                  </div>

                  {group.matched_skills && group.matched_skills.length > 0 && (
                    <div className="mt-6">
                      <h4 className="border-b pb-1 text-sm font-semibold mb-3">Matched Recommended Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {group.matched_skills.map((skill, i) => (
                          <Badge key={i} variant="secondary" className="text-xs font-normal">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-primary/20 shadow-sm">
            <CardContent>
              <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-primary/20 rounded-lg bg-muted/5 mt-6">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium text-foreground">No student groups have shown interest yet.</p>
                <p className="text-sm mt-2 max-w-md mx-auto">When groups apply to your posted FYDP ideas, they will appear here with their detailed team skill match scores.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InterestedGroups;
