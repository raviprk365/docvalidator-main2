"use client";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Eye, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import DataTable from 'react-data-table-component';

interface Analyzer {
  analyzerId: string;
  displayName?: string;
  description?: string;
  createdAt?: string;
  lastModifiedAt?: string;
  fieldSchema?: {
    fields?: Record<string, {
      fieldName?: string;
      fieldDescription?: string;
      method?: string;
      valueType?: string;
      type?: string;
      required?: boolean;
    }>;
  };
}

// Helper function to capitalize first letter
const capitalizeFirstLetter = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default function ListAnalyzers() {
  const [analyzers, setAnalyzers] = useState<Analyzer[]>([]);
  const [filteredAnalyzers, setFilteredAnalyzers] = useState<Analyzer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedAnalyzer, setSelectedAnalyzer] = useState<Analyzer | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [deleteAnalyzerId, setDeleteAnalyzerId] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAnalyzers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/analyzers/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const analyzerData = data.analyzers || [];
      setAnalyzers(analyzerData);
      setFilteredAnalyzers(analyzerData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analyzers");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchValue: string) => {
    setSearchTerm(searchValue);
    if (!searchValue.trim()) {
      setFilteredAnalyzers(analyzers);
    } else {
      const filtered = analyzers.filter((analyzer) => {
        const searchLower = searchValue.toLowerCase();
        return (
          analyzer.analyzerId.toLowerCase().includes(searchLower) ||
          (analyzer.displayName || "").toLowerCase().includes(searchLower) ||
          (analyzer.description || "").toLowerCase().includes(searchLower)
        );
      });
      setFilteredAnalyzers(filtered);
    }
  };

  const handleDeleteClick = (analyzerId: string) => {
    setDeleteAnalyzerId(analyzerId);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`/api/analyzers/${deleteAnalyzerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete analyzer: ${response.status}`);
      }

      setShowDeleteDialog(false);
      setDeleteAnalyzerId("");
      await fetchAnalyzers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete analyzer");
      setShowDeleteDialog(false);
    }
  };

  const handleViewDetails = async (analyzerId: string) => {
    try {
      const response = await fetch(`/api/analyzers/${analyzerId}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analyzer details: ${response.status}`);
      }

      const analyzerDetails = await response.json();
      setSelectedAnalyzer(analyzerDetails);
      setShowDetails(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analyzer details");
    }
  };

  const columns = [
    {
      name: 'Analyzer ID',
      selector: (row: Analyzer) => row.analyzerId,
      sortable: true,
      cell: (row: Analyzer) => (
        <button
          className="font-medium text-primary hover:text-primary/80 transition-colors text-left"
          onClick={() => handleViewDetails(row.analyzerId)}
        >
          {row.analyzerId}
        </button>
      ),
      grow: 1,
    },
    {
      name: 'Display Name',
      selector: (row: Analyzer) => row.displayName || '-',
      sortable: true,
      grow: 1,
    },
    {
      name: 'Description',
      selector: (row: Analyzer) => row.description || '-',
      sortable: true,
      cell: (row: Analyzer) => (
        <div className="truncate max-w-xs" title={row.description}>
          {row.description || '-'}
        </div>
      ),
      grow: 2,
    },
    {
      name: 'Created',
      selector: (row: Analyzer) => row.createdAt || '',
      sortable: true,
      cell: (row: Analyzer) => (
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'
      ),
      grow: 1,
    },
    {
      name: 'Last Updated',
      selector: (row: Analyzer) => row.lastModifiedAt || '',
      sortable: true,
      cell: (row: Analyzer) => (
        row.lastModifiedAt ? new Date(row.lastModifiedAt).toLocaleDateString() : '-'
      ),
      grow: 1,
    },
    {
      name: 'Actions',
      cell: (row: Analyzer) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(row.analyzerId)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteClick(row.analyzerId)}
            className="text-red-600 hover:text-red-800 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      ignoreRowClick: true,
      grow: 0,
      width: '120px',
    },
  ];

  useEffect(() => {
    fetchAnalyzers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading analyzers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analyzers</h2>
          <p className="text-sm text-muted-foreground">Manage your document analysis configurations</p>
        </div>
        <Button
          onClick={fetchAnalyzers}
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="border border-border rounded-lg bg-card shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredAnalyzers}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[5, 10, 20, 50]}
          sortIcon={<div />}
          highlightOnHover
          pointerOnHover
          responsive
          subHeader
          subHeaderComponent={
            <div className="w-full mb-4">
              <input
                type="text"
                placeholder="Search analyzers..."
                className="w-full max-w-md px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          }
          progressPending={loading}
          progressComponent={
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading analyzers...</span>
            </div>
          }
          noDataComponent={
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? (
                <>No analyzers found matching &quot;{searchTerm}&quot;</>
              ) : (
                "No analyzers found"
              )}
            </div>
          }
        />
      </div>

      {/* Analyzer Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analyzer Details: {selectedAnalyzer?.analyzerId}</DialogTitle>
          </DialogHeader>

          {selectedAnalyzer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Analyzer ID:</label>
                  <p className="text-sm text-gray-600">{selectedAnalyzer.analyzerId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Display Name:</label>
                  <p className="text-sm text-gray-600">{selectedAnalyzer.displayName || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Created:</label>
                  <p className="text-sm text-gray-600">
                    {selectedAnalyzer.createdAt
                      ? new Date(selectedAnalyzer.createdAt).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Updated:</label>
                  <p className="text-sm text-gray-600">
                    {selectedAnalyzer.lastModifiedAt
                      ? new Date(selectedAnalyzer.lastModifiedAt).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Description field - full width */}
              <div>
                <label className="text-sm font-medium">Description:</label>
                <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded-lg border">
                  {selectedAnalyzer.description || "No description provided"}
                </p>
              </div>

              {selectedAnalyzer.fieldSchema?.fields && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Field Schema:</label>
                  <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Field Name</TableHead>
                          <TableHead>Field Description</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Value Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(selectedAnalyzer.fieldSchema.fields).map(([fieldKey, fieldConfig]: [string, Record<string, unknown>]) => (
                          <TableRow key={fieldKey}>
                            <TableCell className="font-mono text-sm">
                              {(fieldConfig as { fieldName?: string }).fieldName || fieldKey}
                            </TableCell>
                            <TableCell>
                              {(fieldConfig as { fieldDescription?: string; description?: string }).fieldDescription ||
                                (fieldConfig as { fieldDescription?: string; description?: string }).description || "-"}
                            </TableCell>
                            <TableCell>
                              {capitalizeFirstLetter((fieldConfig as { method?: string }).method || "-")}
                            </TableCell>
                            <TableCell>
                              {capitalizeFirstLetter((fieldConfig as { valueType?: string; type?: string }).valueType ||
                                (fieldConfig as { valueType?: string; type?: string }).type || "unknown")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Analyzer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the analyzer `{deleteAnalyzerId}`? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}