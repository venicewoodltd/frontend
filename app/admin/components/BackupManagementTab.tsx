"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface BackupItem {
  name: string;
  timestamp: string | null;
  size: number;
  fileCount: number;
  details?: {
    postgresql?: Record<string, number | string>;
    mongodb?: Record<string, number | string>;
    gridfs?: Record<string, number | string>;
  };
}

export default function BackupManagementTab() {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("adminToken");

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/backups`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setBackups(data.backups || []);
      } else {
        setError(data.error || "Failed to load backups");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreateBackup = async () => {
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/backups`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Backup "${data.backup.name}" created successfully`);
        fetchBackups();
      } else {
        setError(data.error || "Failed to create backup");
      }
    } catch {
      setError("Failed to create backup");
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (name: string) => {
    setDownloading(name);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/backups/${encodeURIComponent(name)}/download`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Download failed");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch {
      setError("Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Are you sure you want to delete backup "${name}"?`)) return;
    setDeleting(name);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/backups/${encodeURIComponent(name)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        setSuccess(`Backup "${name}" deleted`);
        fetchBackups();
      } else {
        setError(data.error || "Failed to delete backup");
      }
    } catch {
      setError("Failed to delete backup");
    } finally {
      setDeleting(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (ts: string | null) => {
    if (!ts) return "Unknown";
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#3e2723]">
            Backup Management
          </h2>
          <p className="text-sm text-[#5d4037] mt-1">
            Create, download, and manage database backups
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchBackups}
            disabled={loading}
            className="px-4 py-2 border border-[#d7ccc8] text-[#5d4037] rounded-lg hover:bg-[#efebe9] transition-colors disabled:opacity-50"
          >
            Refresh
          </button>
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {creating ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Backup...
              </>
            ) : (
              "Create Backup Now"
            )}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-[#efebe9] border border-[#d7ccc8] rounded-lg p-5">
        <h3 className="text-sm font-semibold text-[#3e2723] mb-3">
          Backup Information
        </h3>
        <ul className="text-sm text-[#5d4037] space-y-2 list-disc list-inside">
          <li>
            Backups include PostgreSQL data, MongoDB collections, and GridFS
            metadata.
          </li>
          <li>
            Daily automatic backups: Run{" "}
            <code className="bg-white px-1 py-0.5 rounded text-xs">
              npm run backup:daily
            </code>{" "}
            or set up a cron job.
          </li>
          <li>
            Last 7 backups are retained by default (configurable via MAX_BACKUPS
            env var).
          </li>
        </ul>
      </div>

      {/* Backups List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <span className="inline-block w-8 h-8 border-4 border-[#4e342e] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : backups.length === 0 ? (
        <div className="bg-white border border-[#d7ccc8] rounded-lg p-12 text-center">
          <p className="text-[#8d6e63] text-lg">No backups found</p>
          <p className="text-sm text-[#a1887f] mt-2">
            Click &quot;Create Backup Now&quot; to create your first backup.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {backups.map((backup) => (
            <div
              key={backup.name}
              className="bg-white border border-[#d7ccc8] rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                {/* Backup Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-[#3e2723] truncate mb-2">
                    {backup.name}
                  </h3>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[#5d4037]">
                    <span>Created: {formatDate(backup.timestamp)}</span>
                    <span>Size: {formatSize(backup.size)}</span>
                    <span>{backup.fileCount} file(s)</span>
                  </div>

                  {/* Details breakdown */}
                  {backup.details && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {backup.details.postgresql &&
                        Object.entries(backup.details.postgresql).map(
                          ([model, count]) => (
                            <span
                              key={model}
                              className="inline-flex items-center px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded"
                            >
                              PG:{model}{" "}
                              {typeof count === "number" ? count : "ERR"}
                            </span>
                          ),
                        )}
                      {backup.details.mongodb &&
                        Object.entries(backup.details.mongodb).map(
                          ([col, count]) => (
                            <span
                              key={col}
                              className="inline-flex items-center px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded"
                            >
                              Mongo:{col}{" "}
                              {typeof count === "number" ? count : "ERR"}
                            </span>
                          ),
                        )}
                      {backup.details.gridfs &&
                        Object.entries(backup.details.gridfs).map(
                          ([key, count]) => (
                            <span
                              key={key}
                              className="inline-flex items-center px-2 py-0.5 text-xs bg-purple-50 text-purple-700 rounded"
                            >
                              GridFS:{key}{" "}
                              {typeof count === "number" ? count : "ERR"}
                            </span>
                          ),
                        )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownload(backup.name)}
                    disabled={downloading === backup.name}
                    className="px-3 py-2 text-sm bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition-colors disabled:opacity-50"
                  >
                    {downloading === backup.name
                      ? "Downloading..."
                      : "Download ZIP"}
                  </button>
                  <button
                    onClick={() => handleDelete(backup.name)}
                    disabled={deleting === backup.name}
                    className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleting === backup.name ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
