import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, ArrowLeft, Mail, Info, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { getApplicantsForIndustryJobs } from "@/api/industry";
import api from "@/api/axiosConfig";

const InterestedStudents = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applicants, setApplicants] = useState([]);
  const [error, setError] = useState(null);
  const [selectedResume, setSelectedResume] = useState(null);

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        setLoading(true);
        const data = await getApplicantsForIndustryJobs();
        setApplicants(data || []);
      } catch (err) {
        console.error("Failed to fetch job applicants:", err);
        setError("Failed to load job applicants. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchApplicants();
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
              <h1 className="text-3xl font-bold">Job Applicants</h1>
              <p className="text-muted-foreground">Individual students who applied to your posted jobs/internships</p>
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
              <Card key={i} className="animate-pulse flex items-center p-6 gap-4">
                <div className="h-12 w-12 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-muted w-1/4 rounded"></div>
                  <div className="h-4 bg-muted w-1/3 rounded"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : applicants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {applicants.map((app, index) => (
              <Card key={index} className="border-primary/20 shadow-sm transition-all hover:shadow-md flex flex-col h-full">
                <CardHeader className="bg-muted/30 pb-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="mb-2 uppercase text-[10px] tracking-wider bg-primary text-primary-foreground hover:bg-primary/90">
                        {app.job_title}
                      </Badge>
                      <CardTitle className="text-lg">{app.student_name}</CardTitle>
                      <CardDescription className="mt-1 flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {app.student_email}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6 flex flex-col flex-grow">
                  <div className="mb-4">
                    <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block mb-1">
                        Academic Detail
                    </span>
                    <span className="text-sm font-medium">Roll No: {app.student_roll || "Not Provided"}</span>
                  </div>

                  <div className="mb-6 flex-grow">
                    <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block mb-2">
                        Student Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {app.student_skills && app.student_skills.length > 0 ? (
                        app.student_skills.map((skill, i) => (
                          <Badge key={i} variant="secondary" className="text-xs font-normal">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No skills listed.</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto flex justify-between gap-3 pt-4 border-t w-full">
                    <p className="text-xs text-muted-foreground self-center">
                      Applied {new Date(app.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                        {app.resume_id ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hidden sm:flex border-primary/20 text-primary hover:bg-primary/5"
                            onClick={() => setSelectedResume(app.resume_id)}
                          >
                             <FileText className="w-4 h-4 mr-2"/>
                             Resume
                             <Download className="w-3 h-3 ml-2" />
                          </Button>
                        ) : (
                          <Button disabled variant="outline" size="sm" className="hidden sm:flex border-primary/20">
                             No Resume
                          </Button>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-primary/20 shadow-sm">
            <CardContent>
              <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-primary/20 rounded-lg bg-muted/5 mt-6">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50 text-primary/40" />
                <p className="text-lg font-medium text-foreground">No students have applied to your postings yet.</p>
                <p className="text-sm mt-2 max-w-md mx-auto">When individual students submit applications to your job or internship postings, their profiles will appear here.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedResume} onOpenChange={(open) => !open && setSelectedResume(null)}>
        <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col p-6">
          <DialogHeader className="flex flex-row justify-between items-center mb-4 border-b pb-4">
            <DialogTitle>Resume Preview</DialogTitle>
            {selectedResume && (
              <Button asChild size="sm" className="ml-auto mr-6">
                <a
                  href={`${api.defaults.baseURL}/profiles/pdf/${selectedResume}`}
                  download="Resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </a>
              </Button>
            )}
          </DialogHeader>
          <div className="flex-1 w-full bg-muted/10 rounded-md overflow-hidden relative border min-h-0">
            <iframe
              src={`${api.defaults.baseURL}/profiles/pdf/${selectedResume}#toolbar=0`}
              className="w-full h-full border-0"
              title="Resume Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterestedStudents;
