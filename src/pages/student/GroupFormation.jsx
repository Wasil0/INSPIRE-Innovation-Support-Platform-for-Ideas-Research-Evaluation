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
  Mail,
  Check,
  XCircle,
  User,
  LogOut,
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
import {
  getAllUsers,
  sendInvite,
  deleteInvite,
  getSentInvites,
  getGroupMembers,
  lockGroup,
  getPendingInvites,
  respondToInvite,
  leaveGroup,
} from "@/api/invites";

// Configuration
const MIN_MEMBERS = 3; // Minimum members required to finalize group
const ITEMS_PER_PAGE = 20;

const GroupFormation = () => {
  const navigate = useNavigate();
  
  // State
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortFilter, setSortFilter] = useState("a-z");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingActions, setPendingActions] = useState(new Set());
  const [isFinalized, setIsFinalized] = useState(false);
  const [finalizeLoading, setFinalizeLoading] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [sentInvitesMap, setSentInvitesMap] = useState(new Map()); // Map of receiver_id -> invite_id
  const [groupMembersSet, setGroupMembersSet] = useState(new Set()); // Set of user_ids in group
  const [showReceivedInvites, setShowReceivedInvites] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loadingPendingInvites, setLoadingPendingInvites] = useState(false);
  const [respondingInvites, setRespondingInvites] = useState(new Set()); // Set of invite_ids being responded to
  const [showLeaveGroupModal, setShowLeaveGroupModal] = useState(false);

  // Get invited students (pending invites - status is "pending")
  const invitedStudents = useMemo(() => {
    return students.filter((s) => {
      const invite = sentInvitesMap.get(s.id);
      return invite && invite.status === "pending";
    });
  }, [students, sentInvitesMap]);

  // Get students in my group (accepted invites)
  const groupMembers = useMemo(() => {
    return students.filter((s) => groupMembersSet.has(s.id));
  }, [students, groupMembersSet]);

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

  // Fetch initial data: users, sent invites, and group members
  React.useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all users, sent invites, and group members in parallel
        const [usersResponse, sentInvitesResponse, groupMembersResponse] = await Promise.all([
          getAllUsers().catch((err) => {
            console.error("Error in getAllUsers:", err);
            return [];
          }),
          getSentInvites().catch((err) => {
            console.error("Error in getSentInvites:", err);
            return [];
          }),
          getGroupMembers().catch((err) => {
            console.error("Error in getGroupMembers:", err);
            return { members: [], is_locked: false, total_members: 0 };
          }),
        ]);

        // Ensure usersResponse is an array
        if (!Array.isArray(usersResponse)) {
          console.error("usersResponse is not an array:", usersResponse);
          setError("Invalid response from server. Please refresh the page.");
          setStudents([]);
          setLoading(false);
          return;
        }

        // Map users to student format
        const mappedStudents = usersResponse.map((user) => ({
          id: user.user_id,
          name: user.name,
          status: user.status || "free", // Default status, will be updated based on invites/group
        }));

        // Create map: match invites to students by finding the student with matching name
        // Note: Backend returns receiver name, not receiver_id. Matching by name.
        // TODO: Consider updating backend to return receiver_id for more reliable matching
        const newInvitesMap = new Map();
        sentInvitesResponse.forEach((invite) => {
          // Find student by name (exact match)
          const student = mappedStudents.find((s) => s.name === invite.receiver);
          if (student) {
            newInvitesMap.set(student.id, {
              invite_id: invite.invite_id,
              status: invite.status,
              receiver_name: invite.receiver, // Store name for verification
            });
            // Update student status based on invite status
            if (invite.status === "accepted") {
              student.status = "in_group";
            }
          }
        });

        // Create set of group member IDs
        const membersSet = new Set(groupMembersResponse.members.map((m) => m.user_id));
        
        // Update students that are in the group
        mappedStudents.forEach((student) => {
          if (membersSet.has(student.id)) {
            student.status = "in_group";
          }
        });

        // Check if group is locked
        if (groupMembersResponse.is_locked) {
          setIsFinalized(true);
        }

        setStudents(mappedStudents);
        setSentInvitesMap(newInvitesMap);
        setGroupMembersSet(membersSet);
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        const errorMessage = err.response?.data?.detail || err.message || "Failed to load students. Please refresh the page.";
        setError(errorMessage);
        setStudents([]);
        // Set empty maps/sets to prevent undefined errors
        setSentInvitesMap(new Map());
        setGroupMembersSet(new Set());
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch pending invites
  const fetchPendingInvites = useCallback(async () => {
    try {
      setLoadingPendingInvites(true);
      const invites = await getPendingInvites();
      setPendingInvites(invites);
    } catch (err) {
      console.error("Failed to fetch pending invites:", err);
      setPendingInvites([]);
    } finally {
      setLoadingPendingInvites(false);
    }
  }, []);

  // Fetch pending invites on mount to show badge count
  React.useEffect(() => {
    fetchPendingInvites();
  }, [fetchPendingInvites]);

  // Handle accept/reject invite
  const handleRespondToInvite = useCallback(async (inviteId, action) => {
    if (respondingInvites.has(inviteId)) return;

    setRespondingInvites((prev) => new Set(prev).add(inviteId));
    setError(null);

    try {
      await respondToInvite(inviteId, action);

      // Remove the invite from pending list
      setPendingInvites((prev) => prev.filter((inv) => inv.invite_id !== inviteId));

      // If accepted, refresh all data to update group members and student statuses
      if (action === "accepted") {
        const [sentInvites, groupMembers] = await Promise.all([
          getSentInvites(),
          getGroupMembers(),
        ]);

        // Update invites map
        const newInvitesMap = new Map();
        sentInvites.forEach((invite) => {
          const student = students.find((s) => s.name === invite.receiver);
          if (student) {
            newInvitesMap.set(student.id, {
              invite_id: invite.invite_id,
              status: invite.status,
              receiver_name: invite.receiver,
            });
          }
        });
        setSentInvitesMap(newInvitesMap);

        // Update group members
        const membersSet = new Set(groupMembers.members.map((m) => m.user_id));
        setGroupMembersSet(membersSet);

        // Update students status for group members
        setStudents((prev) =>
          prev.map((s) => {
            if (membersSet.has(s.id)) {
              return { ...s, status: "in_group" };
            }
            return s;
          })
        );
      }
    } catch (err) {
      setError(err.message || `Failed to ${action} invite`);
    } finally {
      setRespondingInvites((prev) => {
        const next = new Set(prev);
        next.delete(inviteId);
        return next;
      });
    }
  }, [respondingInvites, students]);

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
      filtered = filtered.filter((s) => {
        const invite = sentInvitesMap.get(s.id);
        return s.status === "free" && !invite && !groupMembersSet.has(s.id);
      });
    } else if (statusFilter === "in_team") {
      filtered = filtered.filter((s) => s.status === "in_team" && !groupMembersSet.has(s.id));
    } else if (statusFilter === "invited") {
      filtered = filtered.filter((s) => {
        const invite = sentInvitesMap.get(s.id);
        return invite && invite.status === "pending" && !groupMembersSet.has(s.id);
      });
    } else if (statusFilter === "in_my_group") {
      filtered = filtered.filter((s) => groupMembersSet.has(s.id));
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
  }, [students, debouncedSearch, statusFilter, sortFilter, sentInvitesMap, groupMembersSet]);

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
      const response = await sendInvite(studentId);

      // Update sent invites map
      setSentInvitesMap((prev) => {
        const next = new Map(prev);
        next.set(studentId, {
          invite_id: response.invite_id,
          status: "pending",
        });
        return next;
      });

      // Refresh sent invites to get updated status
      const sentInvites = await getSentInvites();
      
      // Update invites map
      const newInvitesMap = new Map();
      sentInvites.forEach((invite) => {
        const student = students.find((s) => s.name === invite.receiver);
        if (student) {
          newInvitesMap.set(student.id, {
            invite_id: invite.invite_id,
            status: invite.status,
            receiver_name: invite.receiver,
          });
        }
      });
      setSentInvitesMap(newInvitesMap);

      // Refresh group members if any invites were accepted
      const groupMembers = await getGroupMembers();
      const membersSet = new Set(groupMembers.members.map((m) => m.user_id));
      setGroupMembersSet(membersSet);
      
      // Update students status
      setStudents((prev) =>
        prev.map((s) => {
          if (membersSet.has(s.id)) {
            return { ...s, status: "in_group" };
          }
          const invite = newInvitesMap.get(s.id);
          if (invite && invite.status === "accepted") {
            return { ...s, status: "in_group" };
          }
          return s;
        })
      );
    } catch (err) {
      setError(err.message || "Failed to send invite");
    } finally {
      setPendingActions((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  }, [pendingActions, isFinalized, students]);

  // Handle cancel invite
  const handleCancelInvite = useCallback(async (studentId) => {
    if (pendingActions.has(studentId) || isFinalized) return;

    const inviteInfo = sentInvitesMap.get(studentId);
    if (!inviteInfo || !inviteInfo.invite_id) {
      setError("Invite not found");
      return;
    }

    setPendingActions((prev) => new Set(prev).add(studentId));
    setError(null);

    try {
      await deleteInvite(inviteInfo.invite_id);

      // Remove from sent invites map
      setSentInvitesMap((prev) => {
        const next = new Map(prev);
        next.delete(studentId);
        return next;
      });

      // Refresh sent invites to ensure consistency
      const sentInvites = await getSentInvites();
      const newInvitesMap = new Map();
      sentInvites.forEach((invite) => {
        const student = students.find((s) => s.name === invite.receiver);
        if (student) {
          newInvitesMap.set(student.id, {
            invite_id: invite.invite_id,
            status: invite.status,
            receiver_name: invite.receiver,
          });
        }
      });
      setSentInvitesMap(newInvitesMap);
      
      // Don't update student statuses here - the UI determines status based on:
      // 1. groupMembersSet (for "In Your Group")
      // 2. sentInvitesMap (for "Invited")
      // 3. Original student.status from backend (for "Free" or "In Group")
      // This preserves the original status for students who were never invited
    } catch (err) {
      setError(err.message || "Failed to cancel invite");
    } finally {
      setPendingActions((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  }, [pendingActions, isFinalized, sentInvitesMap, students]);

  // Show leave group confirmation modal
  const handleLeaveGroupClick = useCallback(() => {
    if (leaveLoading || isFinalized) return;
    setShowLeaveGroupModal(true);
  }, [leaveLoading, isFinalized]);

  // Handle leave group (after confirmation)
  const handleLeaveGroup = useCallback(async () => {
    if (leaveLoading || isFinalized) return;

    setShowLeaveGroupModal(false);
    setLeaveLoading(true);
    setError(null);

    try {
      await leaveGroup();

      // Refresh all data after leaving
      const [usersResponse, sentInvitesResponse, groupMembersResponse] = await Promise.all([
        getAllUsers().catch((err) => {
          console.error("Error in getAllUsers:", err);
          return [];
        }),
        getSentInvites().catch((err) => {
          console.error("Error in getSentInvites:", err);
          return [];
        }),
        getGroupMembers().catch((err) => {
          console.error("Error in getGroupMembers:", err);
          return { members: [], is_locked: false, total_members: 0 };
        }),
      ]);

      // Update students
      if (Array.isArray(usersResponse)) {
        const mappedStudents = usersResponse.map((user) => ({
          id: user.user_id,
          name: user.name,
          status: user.status || "free",
        }));

        // Update invites map
        const newInvitesMap = new Map();
        sentInvitesResponse.forEach((invite) => {
          const student = mappedStudents.find((s) => s.name === invite.receiver);
          if (student) {
            newInvitesMap.set(student.id, {
              invite_id: invite.invite_id,
              status: invite.status,
              receiver_name: invite.receiver,
            });
          }
        });

        // Update group members
        const membersSet = new Set(groupMembersResponse.members.map((m) => m.user_id));

        setStudents(mappedStudents);
        setSentInvitesMap(newInvitesMap);
        setGroupMembersSet(membersSet);
        setIsFinalized(groupMembersResponse.is_locked || false);
      }
    } catch (err) {
      setError(err.message || "Failed to leave group");
    } finally {
      setLeaveLoading(false);
    }
  }, [leaveLoading, isFinalized]);

  // Handle finalize group (lock group)
  const handleFinalizeGroup = useCallback(async () => {
    if (totalGroupMembers < MIN_MEMBERS) {
      setError(`Group must have at least ${MIN_MEMBERS} members to finalize.`);
      return;
    }

    if (isFinalized || finalizeLoading) return;

    setFinalizeLoading(true);
    setError(null);

    try {
      const response = await lockGroup();

      if (response.team_locked) {
        setIsFinalized(true);
        // Refresh group members to get updated status
        const groupMembers = await getGroupMembers();
        const membersSet = new Set(groupMembers.members.map((m) => m.user_id));
        setGroupMembersSet(membersSet);
        
        // Update students status
        setStudents((prev) =>
          prev.map((s) =>
            membersSet.has(s.id)
              ? { ...s, status: "in_group" }
              : s
          )
        );
      } else {
        // Lock request recorded but not all members have locked yet
        setError("Lock request recorded. All group members must lock the group to finalize.");
      }
    } catch (err) {
      setError(err.message || "Failed to finalize group");
    } finally {
      setFinalizeLoading(false);
    }
  }, [totalGroupMembers, isFinalized, finalizeLoading]);

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
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Group Formation
            </h1>
            <p className="text-muted-foreground">
              Invite students to form your FYDP project team
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setShowReceivedInvites(true);
              fetchPendingInvites();
            }}
            className="shrink-0"
          >
            <Mail className="mr-2 h-4 w-4" />
            Received Invites
            {pendingInvites.length > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground">
                {pendingInvites.length}
              </Badge>
            )}
          </Button>
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
                      const inviteInfo = sentInvitesMap.get(student.id);
                      const isInvited = inviteInfo && inviteInfo.status === "pending";
                      const isInGroup = groupMembersSet.has(student.id);
                      
                      const canInvite =
                        student.status === "free" && 
                        !isInvited && 
                        !isInGroup &&
                        !isFinalized;
                      const canCancel = isInvited && !isFinalized && !isInGroup;

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
                            {isInGroup ? (
                              <Badge className="bg-primary text-primary-foreground">
                                In Your Group
                              </Badge>
                            ) : isInvited ? (
                              <Badge className="bg-primary text-primary-foreground">
                                Invited
                              </Badge>
                            ) : student.status === "free" ? (
                              <Badge variant="secondary">Free</Badge>
                            ) : (
                              <Badge variant="secondary" className="opacity-80">
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
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                {/* Leave Group Button - Show when in a group but not finalized */}
                {groupMembers.length > 0 && !isFinalized && (
                  <Button
                    variant="outline"
                    onClick={handleLeaveGroupClick}
                    disabled={leaveLoading || finalizeLoading}
                    className="transition-all duration-150 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave Group
                  </Button>
                )}
                <Button
                  onClick={handleFinalizeGroup}
                  disabled={
                    totalGroupMembers < MIN_MEMBERS ||
                    isFinalized ||
                    finalizeLoading ||
                    leaveLoading
                  }
                  className="transition-all duration-150"
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

        {/* Received Invites Modal */}
        {showReceivedInvites && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl border-primary/20 max-h-[80vh] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Received Invites</CardTitle>
                    <CardDescription>
                      Invites sent to you by other students
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowReceivedInvites(false);
                      setPendingInvites([]);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                {loadingPendingInvites ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-20 bg-muted rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : pendingInvites.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">
                      No pending invites received
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingInvites.map((invite) => {
                      const isResponding = respondingInvites.has(invite.invite_id);

                      return (
                        <Card
                          key={invite.invite_id}
                          className="border-primary/20"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <p className="font-medium text-foreground">
                                    {invite.sender}
                                  </p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Wants to invite you to join their group
                                </p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleRespondToInvite(
                                      invite.invite_id,
                                      "rejected"
                                    )
                                  }
                                  disabled={isResponding}
                                  className="text-destructive hover:text-destructive"
                                >
                                  {isResponding ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Reject
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleRespondToInvite(
                                      invite.invite_id,
                                      "accepted"
                                    )
                                  }
                                  disabled={isResponding}
                                >
                                  {isResponding ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="mr-2 h-4 w-4" />
                                      Accept
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Leave Group Confirmation Modal */}
        {showLeaveGroupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-md border-primary/20 bg-background shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-2">
                  Leave Group?
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Are you sure you want to leave the group? This will remove all your accepted invites and you will no longer be part of this group.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowLeaveGroupModal(false)}
                    disabled={leaveLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleLeaveGroup}
                    disabled={leaveLoading}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {leaveLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Leaving...
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" />
                        Leave Group
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupFormation;

