import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Loader2,
  Users,
  GraduationCap,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import { getAllLockedGroups } from "@/api/committee";

const ITEMS_PER_PAGE = 20;

const GroupsOverview = () => {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [advisorSort, setAdvisorSort] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGroups, setTotalGroups] = useState(0);

  // Debounced search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllLockedGroups({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearchQuery || undefined,
        stage_filter: stageFilter || undefined,
        advisor_sort: advisorSort || undefined,
      });
      setGroups(response.groups || []);
      setTotalPages(response.pagination?.total_pages || 1);
      setTotalGroups(response.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
      setError(err.message || "Failed to load groups.");
      setGroups([]);
      setTotalPages(1);
      setTotalGroups(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, stageFilter, advisorSort]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Reset page to 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, stageFilter, advisorSort]);

  const getStageDisplayText = (stageStatus) => {
    switch (stageStatus) {
      case "Stage 1":
        return "Group Formation Complete";
      case "Stage 2":
        return "Advisor Selected";
      case "Stage 3":
        return "Proposal Submitted";
      case "Stage 4":
        return "Proposal Approved";
      default:
        return stageStatus;
    }
  };

  const getStageBadgeClass = (stageStatus) => {
    switch (stageStatus) {
      case "Stage 1":
      case "Stage 2":
      case "Stage 3":
        return "bg-primary/20 text-primary border-primary/30";
      case "Stage 4":
        return "bg-primary text-primary-foreground border-primary";
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30";
    }
  };

  const SkeletonRow = () => (
    <tr className="border-b border-border animate-pulse">
      <td className="px-4 py-3">
        <div className="h-4 bg-muted rounded w-32"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-muted rounded w-48"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-6 bg-muted rounded w-24"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-muted rounded w-32"></div>
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/faculty/committee/CommitteeDashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            FYDP Groups Overview
          </h1>
          <p className="text-muted-foreground">
            View and manage all locked FYDP groups with their members, stage status, and advisor information.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <p className="text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="mb-6 transition-all duration-300 hover:shadow-md hover:scale-[1.01] border-primary/20 will-change-transform origin-center transform-gpu">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Search className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Search & Filter Groups</CardTitle>
                <CardDescription>
                  Find groups by member name or roll number, and filter by stage status or advisor.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <div className="absolute left-3 h-9 flex items-center pointer-events-none z-10">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  type="text"
                  placeholder="Search by member name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Stage Filter */}
              <div className="space-y-2 min-w-[200px]">
                <Label htmlFor="stage-filter">Stage Status</Label>
                <select
                  id="stage-filter"
                  value={stageFilter}
                  onChange={(e) => {
                    setStageFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">All Stages</option>
                  <option value="stage1">Group Formation Complete</option>
                  <option value="stage2">Advisor Selected</option>
                  <option value="stage3">Proposal Submitted</option>
                  <option value="stage4">Proposal Approved</option>
                </select>
              </div>

              {/* Advisor Sort */}
              <div className="space-y-2 min-w-[180px]">
                <Label htmlFor="advisor-sort">Sort by Advisor</Label>
                <select
                  id="advisor-sort"
                  value={advisorSort}
                  onChange={(e) => {
                    setAdvisorSort(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">No Sort</option>
                  <option value="has_advisor">Has Advisor</option>
                  <option value="no_advisor">No Advisor</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Groups Table */}
        <Card className="mb-6 transition-all duration-300 hover:shadow-md hover:scale-[1.01] border-primary/20 will-change-transform origin-center transform-gpu">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Locked FYDP Groups</CardTitle>
                <CardDescription>
                  Showing {totalGroups} group{totalGroups !== 1 ? "s" : ""}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                        Members
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                        Stage Status
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                        Advisor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                      <SkeletonRow key={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  No locked groups found matching your criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                        Members
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                        Stage Status
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                        Advisor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => (
                      <tr
                        key={group.team_id}
                        className="border-b border-border hover:bg-accent/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {group.members?.map((member, idx) => (
                              <div key={member.user_id || idx} className="flex items-center gap-2">
                                <span className="font-medium text-foreground">
                                  {member.name}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  ({member.roll_number || "N/A"})
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={getStageBadgeClass(group.stage_status)}
                          >
                            {getStageDisplayText(group.stage_status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {group.advisor_name ? (
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-primary" />
                              <span className="text-sm text-foreground">
                                {group.advisor_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Not assigned
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroupsOverview;
