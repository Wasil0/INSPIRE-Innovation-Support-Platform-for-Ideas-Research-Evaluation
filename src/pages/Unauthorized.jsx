import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldX, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

const Unauthorized = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    const role = localStorage.getItem("role");
    if (role === "admin") {
      navigate("/admin/dashboard");
    } else if (role === "committee") {
      navigate("/faculty/committee/CommitteeDashboard");
    } else if (role === "advisor") {
      navigate("/advisor/dashboard");
    } else if (role === "industry") {
      navigate("/industry/dashboard");
    } else {
      navigate("/student/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Card className="border-primary/20 max-w-md w-full transition-all duration-300 hover:shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 border-2 border-destructive/30">
                  <ShieldX className="h-10 w-10 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl">Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  You don't have permission to access this page.
                </p>
                <p className="text-sm text-muted-foreground">
                  This page is restricted to specific user roles. Please contact
                  an administrator if you believe this is an error.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={handleGoHome}
                  className="flex-1"
                  variant="default"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => navigate(-1)}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;

