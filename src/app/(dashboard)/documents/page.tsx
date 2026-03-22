"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Upload, Download, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  Pagination,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { DOCUMENT_TYPES } from "@/lib/storage";
import type { Document, PaginatedResponse, Client } from "@/types";
import { formatDate, formatFileSize, getExpiryStatus } from "@/lib/utils";

export default function DocumentsPage() {
  const { toast } = useToast();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  const [showUpload, setShowUpload] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "15",
    });
    if (search) params.set("search", search);
    if (typeFilter) params.set("documentType", typeFilter);

    try {
      const res = await fetch(`/api/documents?${params}`);
      const data: PaginatedResponse<Document> = await res.json();
      setDocuments(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ type: "success", title: "Document deleted" });
        fetchDocuments();
      } else {
        const json = await res.json();
        toast({ type: "error", title: json.error ?? "Failed to delete" });
      }
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  function handleDownload(docId: string) {
    window.open(`/api/documents/${docId}/download`, "_blank");
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2632]">Documents</h1>
          <p className="text-sm text-[#C9C1B1] mt-0.5">
            {total} total documents
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="w-4 h-4" />
          Upload Document
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C9C1B1]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-[#C9C1B1] bg-white text-sm text-[#1B2632] placeholder:text-[#C9C1B1] focus:outline-none focus:ring-2 focus:ring-[#FFB162] focus:border-transparent"
          />
        </div>
        <div className="w-52">
          <Select
            placeholder="All document types"
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v === "__all__" ? "" : v)}
          >
            <SelectItem value="__all__">All types</SelectItem>
            {DOCUMENT_TYPES.map((dt) => (
              <SelectItem key={dt} value={dt}>
                {dt}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Type</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>File Name</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            [...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(7)].map((__, j) => (
                  <TableCell key={j}>
                    <div className="h-4 bg-[#C9C1B1]/20 rounded animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : documents.length === 0 ? (
            <TableEmpty message="No documents found" />
          ) : (
            documents.map((doc) => {
              const expiry = getExpiryStatus(doc.expiryDate);
              return (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#C9C1B1]" />
                      <span className="font-medium">{doc.documentType}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {doc.client ? (
                      <Link
                        href={`/clients/${doc.client.id}`}
                        className="text-[#2C3B4D] hover:text-[#FFB162] hover:underline transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {doc.client.name}
                      </Link>
                    ) : (
                      <span className="text-[#C9C1B1]">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[#C9C1B1] max-w-[200px] truncate">
                    {doc.fileName}
                  </TableCell>
                  <TableCell className="text-[#C9C1B1]">
                    {formatFileSize(doc.fileSize)}
                  </TableCell>
                  <TableCell>
                    {doc.expiryDate ? (
                      <div className="flex items-center gap-1.5">
                        {expiry === "expired" && (
                          <Badge variant="danger">Expired</Badge>
                        )}
                        {expiry === "expiring-soon" && (
                          <Badge variant="warning">Expiring</Badge>
                        )}
                        {expiry === "valid" && (
                          <Badge variant="success">Valid</Badge>
                        )}
                        <span className="text-xs text-[#C9C1B1]">
                          {formatDate(doc.expiryDate)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#C9C1B1]">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[#C9C1B1]">
                    {formatDate(doc.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDownload(doc.id)}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="danger-outline"
                        size="icon-sm"
                        onClick={() => setDeleteId(doc.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={15}
          onPageChange={setPage}
        />
      )}

      {/* Upload document dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Select a client and upload a document.
            </DialogDescription>
          </DialogHeader>
          <UploadDocumentForm
            onSuccess={() => {
              setShowUpload(false);
              fetchDocuments();
              toast({ type: "success", title: "Document uploaded" });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              This will permanently delete this document. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UploadDocumentForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/clients?pageSize=100&sortBy=name&sortOrder=asc")
      .then((r) => r.json())
      .then((data) => setClients(data.data ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !docType || !clientId) {
      toast({
        type: "error",
        title: "Please fill in all required fields",
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("clientId", clientId);
      formData.append("documentType", docType);
      if (expiryDate) formData.append("expiryDate", expiryDate);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ type: "error", title: json.error ?? "Upload failed" });
        return;
      }
      onSuccess();
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-6 space-y-4">
        {/* Client select */}
        <Select
          label="Client"
          placeholder="Select a client"
          value={clientId}
          onValueChange={setClientId}
          required
        >
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </Select>

        {/* File input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#2C3B4D]">
            File <span className="text-[#A35139]">*</span>
          </label>
          <div
            className="border-2 border-dashed border-[#C9C1B1] rounded-xl p-6 text-center cursor-pointer hover:border-[#FFB162] transition-colors"
            onClick={() =>
              document.getElementById("global-doc-file-input")?.click()
            }
          >
            {file ? (
              <div>
                <FileText className="w-8 h-8 text-[#FFB162] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#1B2632]">
                  {file.name}
                </p>
                <p className="text-xs text-[#C9C1B1]">
                  {formatFileSize(file.size)}
                </p>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-[#C9C1B1] mx-auto mb-2" />
                <p className="text-sm text-[#C9C1B1]">
                  Click to select a file
                </p>
                <p className="text-xs text-[#C9C1B1] mt-1">
                  PDF, JPEG, PNG, WebP, Word, Excel (max 10MB)
                </p>
              </div>
            )}
            <input
              id="global-doc-file-input"
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        {/* Document type */}
        <Select
          label="Document Type"
          placeholder="Select document type"
          value={docType}
          onValueChange={setDocType}
          required
        >
          {DOCUMENT_TYPES.map((dt) => (
            <SelectItem key={dt} value={dt}>
              {dt}
            </SelectItem>
          ))}
        </Select>

        {/* Expiry date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#2C3B4D]">
            Expiry Date{" "}
            <span className="text-[#C9C1B1] font-normal">(optional)</span>
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full h-10 rounded-lg border border-[#C9C1B1] bg-white px-3 py-2 text-sm text-[#1B2632] focus:outline-none focus:ring-2 focus:ring-[#FFB162] focus:border-transparent"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" loading={uploading}>
          Upload Document
        </Button>
      </DialogFooter>
    </form>
  );
}
