import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  X,
  CheckCircle2,
  Loader2,
  Search,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { postIndustryJob } from "@/api/industry";
import { INDUSTRY_DOMAINS } from "@/assets/industry_domains";
import { INDUSTRY_SKILLS } from "@/assets/industry_skills";

const PostIndustryJob = () => {
  const navigate = useNavigate();
  const domainDropdownRef = useRef(null);
  const skillsDropdownRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    job_type: "",
    amount: "",
    duration: "",
  });

  // Selected values for multi-select
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);

  // Search states
  const [domainSearch, setDomainSearch] = useState("");
  const [skillsSearch, setSkillsSearch] = useState("");

  // Dropdown visibility
  const [showDomainDropdown, setShowDomainDropdown] = useState(false);
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        domainDropdownRef.current &&
        !domainDropdownRef.current.contains(event.target)
      ) {
        setShowDomainDropdown(false);
      }
      if (
        skillsDropdownRef.current &&
        !skillsDropdownRef.current.contains(event.target)
      ) {
        setShowSkillsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter domains based on search
  const filteredDomains = INDUSTRY_DOMAINS.filter((domain) =>
    domain.toLowerCase().includes(domainSearch.toLowerCase())
  );

  // Filter skills based on search
  const filteredSkills = INDUSTRY_SKILLS.filter((skill) =>
    skill.toLowerCase().includes(skillsSearch.toLowerCase())
  );

  // Handle domain selection
  const handleDomainToggle = (domain) => {
    setSelectedDomains((prev) =>
      prev.includes(domain)
        ? prev.filter((d) => d !== domain)
        : [...prev, domain]
    );
  };

  // Handle skill selection
  const handleSkillToggle = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation
    if (!formData.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!formData.description.trim()) {
      setError("Description is required.");
      return;
    }
    if (!formData.job_type) {
      setError("Job type is required.");
      return;
    }
    if (selectedDomains.length === 0) {
      setError("At least one technology stack item must be selected.");
      return;
    }
    if (selectedSkills.length === 0) {
      setError("At least one expected skill must be selected.");
      return;
    }

    try {
      setSubmitting(true);

      // Prepare data
      const jobData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        job_type: formData.job_type,
        amount: formData.amount.trim() || null,
        duration: formData.duration.trim() || null,
        technology_stack: selectedDomains,
        expected_skills: selectedSkills,
      };

      // Submit to API
      await postIndustryJob(jobData);

      setSuccess(true);
      setError("");

      // Clear form
      setFormData({
        title: "",
        description: "",
        job_type: "",
        amount: "",
        duration: "",
      });
      setSelectedDomains([]);
      setSelectedSkills([]);

      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate("/industry/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error submitting job:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (Array.isArray(error.response?.data)
          ? error.response.data.map((e) => e.msg || e.message).join(", ")
          : null) ||
        error.message ||
        "Failed to submit job posting. Please try again.";
      setError(errorMessage);
      setSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/industry/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Post Job/Internship/Training
          </h1>
          <p className="text-muted-foreground">
            Share job opportunities, internships, or training programs with
            students. Fill in all required fields to submit. Your posting will
            be pending approval.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <Card className="mb-6 border-green-500/50 bg-green-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-medium">
                  Job posting submitted successfully! Redirecting to
                  dashboard...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-500/50 bg-red-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter a descriptive title for the job posting"
                  required
                  className="bg-background"
                  disabled={submitting}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Provide a detailed description of the job, internship, or training program"
                  required
                  rows={5}
                  disabled={submitting}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                />
              </div>

              {/* Job Type */}
              <div className="space-y-2">
                <Label htmlFor="job_type">
                  Job Type <span className="text-red-500">*</span>
                </Label>
                <select
                  id="job_type"
                  value={formData.job_type}
                  onChange={(e) =>
                    setFormData({ ...formData, job_type: e.target.value })
                  }
                  disabled={submitting}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select job type</option>
                  <option value="internship">Internship</option>
                  <option value="full-time">Full-Time</option>
                  <option value="part-time">Part-Time</option>
                  <option value="training">Training</option>
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (Optional)</Label>
                <Input
                  id="amount"
                  type="text"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="e.g., $500/month, PKR 50,000, Competitive"
                  className="bg-background"
                  disabled={submitting}
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Optional)</Label>
                <Input
                  id="duration"
                  type="text"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  placeholder="e.g., 3 months, 6 months, 1 year"
                  className="bg-background"
                  disabled={submitting}
                />
              </div>

              {/* Technology Stack Selection */}
              <div className="space-y-2">
                <Label>
                  Technology Stack <span className="text-red-500">*</span>
                </Label>
                <div className="relative" ref={domainDropdownRef}>
                  <div
                    className="flex min-h-[40px] w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() =>
                      !submitting &&
                      setShowDomainDropdown(!showDomainDropdown)
                    }
                  >
                    <div className="flex flex-wrap gap-2 flex-1">
                      {selectedDomains.length > 0 ? (
                        selectedDomains.map((domain) => (
                          <Badge
                            key={domain}
                            variant="secondary"
                            className="bg-primary/20 text-primary"
                          >
                            {domain}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!submitting) handleDomainToggle(domain);
                              }}
                              className="ml-2 hover:text-destructive"
                              disabled={submitting}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">
                          Select technology stack...
                        </span>
                      )}
                    </div>
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {showDomainDropdown && !submitting && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                      <div className="p-2">
                        <Input
                          placeholder="Search technology stack..."
                          value={domainSearch}
                          onChange={(e) => setDomainSearch(e.target.value)}
                          className="mb-2"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredDomains.length > 0 ? (
                            filteredDomains.map((domain) => (
                              <div
                                key={domain}
                                className={`flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer ${
                                  selectedDomains.includes(domain)
                                    ? "bg-primary/10"
                                    : ""
                                }`}
                                onClick={() => handleDomainToggle(domain)}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedDomains.includes(domain)}
                                  onChange={() => handleDomainToggle(domain)}
                                  className="rounded"
                                />
                                <span className="text-sm">{domain}</span>
                              </div>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              No items found
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Expected Skills Selection */}
              <div className="space-y-2">
                <Label>
                  Expected Skills <span className="text-red-500">*</span>
                </Label>
                <div className="relative" ref={skillsDropdownRef}>
                  <div
                    className="flex min-h-[40px] w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() =>
                      !submitting && setShowSkillsDropdown(!showSkillsDropdown)
                    }
                  >
                    <div className="flex flex-wrap gap-2 flex-1">
                      {selectedSkills.length > 0 ? (
                        selectedSkills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="bg-primary/20 text-primary"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!submitting) handleSkillToggle(skill);
                              }}
                              className="ml-2 hover:text-destructive"
                              disabled={submitting}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">
                          Select expected skills...
                        </span>
                      )}
                    </div>
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {showSkillsDropdown && !submitting && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                      <div className="p-2">
                        <Input
                          placeholder="Search skills..."
                          value={skillsSearch}
                          onChange={(e) => setSkillsSearch(e.target.value)}
                          className="mb-2"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredSkills.length > 0 ? (
                            filteredSkills.map((skill) => (
                              <div
                                key={skill}
                                className={`flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer ${
                                  selectedSkills.includes(skill)
                                    ? "bg-primary/10"
                                    : ""
                                }`}
                                onClick={() => handleSkillToggle(skill)}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedSkills.includes(skill)}
                                  onChange={() => handleSkillToggle(skill)}
                                  className="rounded"
                                />
                                <span className="text-sm">{skill}</span>
                              </div>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              No skills found
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 sm:flex-initial"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Job Posting"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/industry/dashboard")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PostIndustryJob;

