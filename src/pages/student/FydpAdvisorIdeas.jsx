import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Navbar from "@/components/Navbar";

const FydpAdvisorIdeas = () => {
  const navigate = useNavigate();

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            FYDP Advisor Ideas
          </h1>
          <p className="text-muted-foreground">
            Browse project ideas from advisors
          </p>
        </div>

        {/* Placeholder Content */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Advisor Ideas</CardTitle>
            <CardDescription>
              This page will display detailed advisor ideas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Content will be implemented here to show advisor ideas in detail.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FydpAdvisorIdeas;

