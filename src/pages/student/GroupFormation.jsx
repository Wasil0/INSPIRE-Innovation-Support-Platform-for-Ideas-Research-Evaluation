import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  UserPlus,
  X,
  CheckCircle2,
  Users,
  Loader2,
  AlertCircle,
  Filter,
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
import Navbar from "@/components/Navbar";
import { mockStudents } from "@/api/groupformation/mockStudents";
import {
  inviteStudent,
  cancelInvite,
  finalizeGroup,
} from "@/api/groupformation/demoApi";

// Configuration
const MIN_MEMBERS = 2; // Minimum members required to finalize group
const ITEMS_PER_PAGE = 20;

const GroupFormation = () => {
  const navigate = useNavigate();
  
  // State
  const [students, setStudents] = useState(mockStudents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortFilter, setSortFilter] = useState("a-z");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingActions, setPendingActions] = useState(new Set());
  const [isFinalized, setIsFinalized] = useState(false);
  const [finalizeLoading, setFinalizeLoading] = useState(false);

  // Get invited students (pending invites)
  const invitedStudents = useMemo(() => {
    return students.filter((s) => s.invitedByMe && s.status === "free" && !s.inMyGroup);
  }, [students]);

  // Get students in my group (accepted invites)
  const groupMembers = useMemo(() => {
    return students.filter((s) => s.inMyGroup);
  }, [students]);

  // Calculate total group members (including current user)
  const totalGroupMembers = useMemo(() => {
    return groupMembers.length + 1; // +1 for current user
  }, [groupMembers]);

  // Calculate how many more group members are needed (after invites are accepted)
  const membersNeeded = useMemo(() => {
    const needed = MIN_MEMBERS - totalGroupMembers;
    return needed > 0 ? needed : 0;
  }, [totalGroupMembers]);

  // Reserve scrollbar space to prevent layout shift (only for this page)
  React.useEffect(() => {
    // Use scrollbar-gutter to reserve space without forcing scrollbar
    const htmlElement = document.documentElement;
    const originalScrollbarGutter = htmlElement.style.scrollbarGutter;
    
    // Reserve space for scrollbar without forcing it to show
    htmlElement.style.scrollbarGutter = 'stable';
    
    return () => {
      htmlElement.style.scrollbarGutter = originalScrollbarGutter;
    };
  }, []);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = [...students];

    // Apply search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter((s) =>
        s.name.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter === "free") {
      filtered = filtered.filter((s) => s.status === "free" && !s.invitedByMe && !s.inMyGroup);
    } else if (statusFilter === "in_group") {
      filtered = filtered.filter((s) => s.status === "in_group" && !s.inMyGroup);
    } else if (statusFilter === "invited") {
      filtered = filtered.filter((s) => s.invitedByMe && !s.inMyGroup);
    } else if (statusFilter === "in_my_group") {
      filtered = filtered.filter((s) => s.inMyGroup);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortFilter === "a-z") {
        return a.name.localeCompare(b.name);
      } else if (sortFilter === "z-a") {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

    return filtered;
  }, [students, debouncedSearch, statusFilter, sortFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredAndSortedStudents.slice(start, end);
  }, [filteredAndSortedStudents, currentPage]);

  // Handle invite
  const handleInvite = useCallback(async (studentId) => {
    if (pendingActions.has(studentId) || isFinalized) return;

    setPendingActions((prev) => new Set(prev).add(studentId));
    setError(null);

    try {
      // TODO: Replace demoApi.inviteStudent with real API call: POST /api/invite
      const response = await inviteStudent(studentId);

      if (response.success) {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === studentId
              ? { ...s, invitedByMe: true, status: "free", inMyGroup: false }
              : s
          )
        );
      }
    } catch (err) {
      setError(err.message || "Failed to send invite");
      // Error toast could be added here
    } finally {
      setPendingActions((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  }, [pendingActions, isFinalized]);

  // Handle cancel invite
  const handleCancelInvite = useCallback(async (studentId) => {
    if (pendingActions.has(studentId) || isFinalized) return;

    setPendingActions((prev) => new Set(prev).add(studentId));
    setError(null);

    try {
      // TODO: Replace demoApi.cancelInvite with real API call: DELETE /api/invite/:id
      const response = await cancelInvite(studentId);

      if (response.success) {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === studentId ? { ...s, invitedByMe: false } : s
          )
        );
      }
    } catch (err) {
      setError(err.message || "Failed to cancel invite");
    } finally {
      setPendingActions((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  }, [pendingActions, isFinalized]);

  // Handle finalize group
  const handleFinalizeGroup = useCallback(async () => {
    if (invitedStudents.length < MIN_MEMBERS) {
      setError(`Please invite at least ${MIN_MEMBERS} members to finalize the group.`);
      return;
    }

    if (isFinalized || finalizeLoading) return;

    setFinalizeLoading(true);
    setError(null);

    try {
      const memberIds = invitedStudents.map((s) => s.id);
      
      // TODO: Replace demoApi.finalizeGroup with real API call: POST /api/group/finalize
      const response = await finalizeGroup(memberIds);

      if (response.success) {
        setIsFinalized(true);
        // Lock the page - no further invites/cancels
        // Mark invited students as in my group
        setStudents((prev) =>
          prev.map((s) =>
            s.invitedByMe && s.status === "free" && !s.inMyGroup
              ? { ...s, status: "in_group", inMyGroup: true }
              : s
          )
        );
      }
    } catch (err) {
      setError(err.message || "Failed to finalize group");
    } finally {
      setFinalizeLoading(false);
    }
  }, [invitedStudents, isFinalized, finalizeLoading]);

  // Skeleton loader component
  const SkeletonRow = () => (
    <tr className="border-b border-border animate-pulse">
      <td className="px-4 py-3">
        <div className="h-4 bg-muted rounded w-32"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-6 bg-muted rounded w-24"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-8 bg-muted rounded w-20 ml-auto"></div>
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/student/fydp-progress")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to FYDP Progress
        </Button>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Group Formation
          </h1>
          <p className="text-muted-foreground">
            Invite students to form your FYDP project team
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Sort Filter */}
              <select
                value={sortFilter}
                onChange={(e) => {
                  setSortFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="a-z">Sort A-Z</option>
                <option value="z-a">Sort Z-A</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="free">Free Only</option>
                <option value="invited">Invited by Me</option>
                <option value="in_my_group">In My Group</option>
                <option value="in_group">In Other Groups</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Available Students</CardTitle>
                <CardDescription>
                  {filteredAndSortedStudents.length} student
                  {filteredAndSortedStudents.length !== 1 ? "s" : ""} found
                </CardDescription>
              </div>
              {invitedStudents.length > 0 && (
                <Badge className="bg-primary text-primary-foreground">
                  {invitedStudents.length} Invited
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[40%]" />
                    <col className="w-[25%]" />
                    <col className="w-[35%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                        Name
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                        Status
                      </th>
                      <th className="text-right px-4 py-3 text-sm font-semibold text-foreground">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonRow key={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : paginatedStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  No matching students found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[40%]" />
                    <col className="w-[25%]" />
                    <col className="w-[35%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                        Name
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                        Status
                      </th>
                      <th className="text-right px-4 py-3 text-sm font-semibold text-foreground">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStudents.map((student) => {
                      const isPending = pendingActions.has(student.id);
                      const canInvite =
                        student.status === "free" && 
                        !student.invitedByMe && 
                        !student.inMyGroup;
                      const canCancel = student.invitedByMe && !isFinalized && !student.inMyGroup;

                      return (
                        <tr
                          key={student.id}
                          className="border-b border-border hover:bg-accent/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">
                              {student.name}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            {student.inMyGroup ? (
                              <Badge className="bg-primary text-primary-foreground">
                                In Your Group
                              </Badge>
                            ) : student.invitedByMe ? (
                              <Badge className="bg-primary text-primary-foreground">
                                Invited
                              </Badge>
                            ) : student.status === "free" ? (
                              <Badge variant="secondary">Free</Badge>
                            ) : (
                              <Badge variant="secondary" className="opacity-60">
                                In Group
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              {canInvite && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleInvite(student.id)}
                                  disabled={isPending || isFinalized}
                                  className="transition-all duration-150"
                                >
                                  {isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus className="mr-2 h-3 w-3" />
                                      Invite
                                    </>
                                  )}
                                </Button>
                              )}
                              {canCancel && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelInvite(student.id)}
                                  disabled={isPending || isFinalized}
                                  className="transition-all duration-150 text-destructive hover:text-destructive"
                                >
                                  {isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                      Cancelling...
                                    </>
                                  ) : (
                                    <>
                                      <X className="mr-2 h-3 w-3" />
                                      Cancel Invite
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Finalize Group Card */}
        <Card className="border-primary/20 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 sticky bottom-0">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">
                  Finalize Group
                </h3>
                <div className="space-y-1">
                  {isFinalized ? (
                    <p className="text-sm text-foreground">
                      Your group has {totalGroupMembers} member{totalGroupMembers !== 1 ? "s" : ""}
                    </p>
                  ) : (
                    <>
                      {groupMembers.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {totalGroupMembers}
                          </span>{" "}
                          member{totalGroupMembers !== 1 ? "s" : ""} in your group
                          {invitedStudents.length > 0 && (
                            <span className="ml-2">
                              • <span className="font-medium text-foreground">
                                {invitedStudents.length}
                              </span>{" "}
                              pending invite{invitedStudents.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </p>
                      )}
                      {groupMembers.length === 0 && invitedStudents.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {invitedStudents.length}
                          </span>{" "}
                          pending invite{invitedStudents.length !== 1 ? "s" : ""}
                        </p>
                      )}
                      {membersNeeded > 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {groupMembers.length === 0
                            ? `Invite at least ${MIN_MEMBERS} members and wait for them to accept to finalize your group`
                            : `Invite ${membersNeeded} more member${membersNeeded !== 1 ? "s" : ""} and wait for acceptance to finalize (minimum ${MIN_MEMBERS} required)`}
                        </p>
                      ) : totalGroupMembers >= MIN_MEMBERS ? (
                        <p className="text-sm text-muted-foreground">
                          Ready to finalize your group
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Invite at least {MIN_MEMBERS} members and wait for them to accept to finalize your group
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
              <Button
                onClick={handleFinalizeGroup}
                disabled={
                  totalGroupMembers < MIN_MEMBERS ||
                  isFinalized ||
                  finalizeLoading
                }
                className="transition-all duration-150 shrink-0"
              >
                {finalizeLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finalizing...
                  </>
                ) : isFinalized ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Group Finalized
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Finalize Group
                  </>
                )}
              </Button>
            </div>
            {isFinalized && (
              <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-foreground">
                  Your group has been finalized successfully! You can no longer
                  send or cancel invites.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroupFormation;

