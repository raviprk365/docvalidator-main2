"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CreateAnalyzer from "../components/admin/CreateAnalyzer";
import ListAnalyzers from "../components/admin/ListAnalyzers";
import UpdateAnalyzer from "../components/admin/UpdateAnalyzer";
import { useAuthStore } from "../store/authStore";

export default function AdminConfiguration() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");
  const role = useAuthStore((state) => state.role);

  useEffect(() => {
    if (role === 'admin') {
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Only Admi has the access to the page</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              Admin Configuration
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your document analyzers
            </p>
          </div>

          {/* Horizontal Tabs */}
          <div className="flex justify-center">
            <div className="flex space-x-1 bg-accent/20 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("list")}
                className={`px-6 py-3 rounded-md transition-all duration-200 font-medium ${activeTab === "list"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                List Analyzers
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={`px-6 py-3 rounded-md transition-all duration-200 font-medium ${activeTab === "create"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                Create Analyzer
              </button>
              <button
                onClick={() => setActiveTab("update")}
                className={`px-6 py-3 rounded-md transition-all duration-200 font-medium ${activeTab === "update"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                Update Analyzer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-full">
          {activeTab === "list" && <ListAnalyzers />}
          {activeTab === "create" && <CreateAnalyzer />}
          {activeTab === "update" && <UpdateAnalyzer />}
        </div>
      </div>
    </div>
  );
}