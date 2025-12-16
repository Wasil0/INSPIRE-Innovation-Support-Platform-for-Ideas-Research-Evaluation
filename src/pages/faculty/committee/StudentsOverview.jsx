import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Loader2,
  Users,
  GraduationCap,
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
import { getAllStudents } from "@/api/committee";

const ITEMS_PER_PAGE = 20;

const StudentsOverview = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllStudents({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
        group_filter: groupFilter || undefined,
      });
      setStudents(response.students || []);
      setTotalPages(response.pagination?.total_pages || 1);
      setTotalStudents(response.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setError(err.message || "Failed to load students. Please refresh the page.");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, groupFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Get group status badge variant
  const getGroupStatusBadgeVariant = (groupStatus) => {
    if (groupStatus === "Group Not Formed") {
      return "secondary";
    } else {
      return "default";
    }
  };

  // Skeleton loader component
  const SkeletonRow = () => (
    <tr className="border-b border-border animate-pulse">
      <td className="px-4 py-3">
        <div className="h-4 bg-muted rounded w-32"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-muted rounded w-24"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-6 bg-muted rounded w-32"></div>
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
            Students Overview
          </h1>
          <p className="text-muted-foreground">
            View and manage all student profiles and stage information
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
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
            <CardDescription>
              Find students by name or roll number, and filter by group formation status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Group Filter */}
              <div className="sm:w-64">
                <Label htmlFor="group-filter" className="sr-only">
                  Filter by Group Status
                </Label>
                <select
                  id="group-filter"
                  value={groupFilter}
                  onChange={(e) => {
                    setGroupFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">All Students</option>
                  <option value="formed">Group Formed</option>
                  <option value="not_formed">Group Not Formed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Students List</CardTitle>
                <CardDescription>
                  {totalStudents} student{totalStudents !== 1 ? "s" : ""} found
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[40%]" />
                    <col className="w-[30%]" />
                    <col className="w-[30%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                        Name
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                        Roll Number
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                        Group Status
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
            ) : students.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  No students found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[40%]" />
                    <col className="w-[30%]" />
                    <col className="w-[30%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                        Name
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                        Roll Number
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                        Group Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr
                        key={student.user_id}
                        className="border-b border-border hover:bg-accent/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">
                            {student.name || "N/A"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-foreground">
                            {student.roll_number || "N/A"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={getGroupStatusBadgeVariant(student.group_status)}
                            className={
                              student.group_status === "Group Not Formed"
                                ? "opacity-80"
                                : ""
                            }
                          >
                            {student.group_status}
                          </Badge>
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

export default StudentsOverview;
