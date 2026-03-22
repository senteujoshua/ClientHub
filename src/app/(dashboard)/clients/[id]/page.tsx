"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Upload,
  Download,
  FileText,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileKey,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
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
import { clientSchema, type ClientInput } from "@/lib/validations";
import { DOCUMENT_TYPES } from "@/lib/storage";
import type { Client, Document } from "@/types";
import {
  formatDate,
  formatFileSize,
  getExpiryStatus,
  getInitials,
} from "@/lib/utils";

export default function ClientDetailPage(props: PageProps<"/clients/[id]">) {
  const { id } = use(props.params);
  const router = useRouter();
  const { toast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [deletingDoc, setDeletingDoc] = useState(false);

  const fetchClient = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (!res.ok) {
        router.push("/clients");
        return;
      }
      const data = await res.json();
      setClient(data);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  async function handleDeleteClient() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ type: "success", title: "Client deleted" });
        router.push("/clients");
      } else {
        const json = await res.json();
        toast({ type: "error", title: json.error ?? "Failed to delete" });
      }
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  }

  async function handleDeleteDocument() {
    if (!deleteDocId) return;
    setDeletingDoc(true);
    try {
      const res = await fetch(`/api/documents/${deleteDocId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ type: "success", title: "Document deleted" });
        fetchClient();
      } else {
        const json = await res.json();
        toast({ type: "error", title: json.error ?? "Failed to delete" });
      }
    } finally {
      setDeletingDoc(false);
      setDeleteDocId(null);
    }
  }

  function handleDownload(docId: string) {
    window.open(`/api/documents/${docId}/download`, "_blank");
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 bg-[#C9C1B1]/30 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-3 gap-6">
          <div className="h-64 bg-[#C9C1B1]/30 rounded-xl animate-pulse" />
          <div className="col-span-2 h-64 bg-[#C9C1B1]/30 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!client) return null;

  const documents = client.documents ?? [];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/clients")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#2C3B4D] flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-[#FFB162]">
                {getInitials(client.name)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[#1B2632]">
                  {client.name}
                </h1>
                <Badge
                  variant={
                    client.type === "individual" ? "individual" : "company"
                  }
                >
                  {client.type}
                </Badge>
              </div>
              <p className="text-sm text-[#C9C1B1] mt-0.5">
                Added {formatDate(client.createdAt)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUpload(true)}
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
          <Button
            variant="danger-outline"
            size="sm"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client info card */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={
                client.type === "individual" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Building2 className="w-4 h-4" />
                )
              }
              label={client.type === "individual" ? "ID Number" : "Reg. Number"}
              value={
                client.type === "individual"
                  ? client.idNumber
                  : client.registrationNumber
              }
            />
            {client.type === "company" && client.contactPerson && (
              <InfoRow
                icon={<User className="w-4 h-4" />}
                label="Contact Person"
                value={client.contactPerson}
              />
            )}
            <InfoRow
              icon={<Mail className="w-4 h-4" />}
              label="Email"
              value={client.email}
            />
            <InfoRow
              icon={<Phone className="w-4 h-4" />}
              label="Phone"
              value={client.phone}
            />
            <InfoRow
              icon={<MapPin className="w-4 h-4" />}
              label="Address"
              value={client.address}
            />
            {client.notes && (
              <InfoRow
                icon={<FileKey className="w-4 h-4" />}
                label="Notes"
                value={client.notes}
              />
            )}
          </CardContent>
        </Card>

        {/* Documents section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1B2632]">
              Documents ({documents.length})
            </h2>
            <Button size="sm" onClick={() => setShowUpload(true)}>
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Type</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableEmpty message="No documents uploaded yet" />
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
                      <TableCell className="text-[#C9C1B1] max-w-[180px] truncate">
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
                            onClick={() => setDeleteDocId(doc.id)}
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
        </div>
      </div>

      {/* Edit client dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <EditClientForm
            client={client}
            onSuccess={() => {
              setShowEdit(false);
              fetchClient();
              toast({ type: "success", title: "Client updated" });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete client confirmation */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              This will permanently delete {client.name} and all their
              documents. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              onClick={handleDeleteClient}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload document dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document for {client.name}.
            </DialogDescription>
          </DialogHeader>
          <UploadDocumentForm
            clientId={id}
            onSuccess={() => {
              setShowUpload(false);
              fetchClient();
              toast({ type: "success", title: "Document uploaded" });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete document confirmation */}
      <Dialog open={!!deleteDocId} onOpenChange={() => setDeleteDocId(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              This will permanently delete the document. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDocId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deletingDoc}
              onClick={handleDeleteDocument}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="text-[#C9C1B1] mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-[#C9C1B1]">{label}</p>
        <p className="text-sm text-[#1B2632] mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function EditClientForm({
  client,
  onSuccess,
}: {
  client: Client;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [clientType, setClientType] = useState<"individual" | "company">(
    client.type
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      type: client.type,
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      idNumber: client.idNumber ?? undefined,
      registrationNumber: client.registrationNumber ?? undefined,
      contactPerson: client.contactPerson ?? undefined,
      notes: client.notes ?? undefined,
    },
  });

  async function onSubmit(data: ClientInput) {
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      toast({ type: "error", title: json.error ?? "Failed to update client" });
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="p-6 grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-sm font-medium text-[#2C3B4D]">
            Client Type <span className="text-[#A35139]">*</span>
          </label>
          <div className="flex gap-3 mt-2">
            {(["individual", "company"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setClientType(t);
                  setValue("type", t);
                }}
                className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                  clientType === t
                    ? "border-[#FFB162] bg-[#FFB162]/10 text-[#1B2632]"
                    : "border-[#C9C1B1] bg-white text-[#C9C1B1] hover:border-[#2C3B4D] hover:text-[#2C3B4D]"
                }`}
              >
                {t === "individual" ? "Individual" : "Company"}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Full Name"
          error={errors.name?.message}
          required
          {...register("name")}
        />
        <Input
          label="Email"
          type="email"
          error={errors.email?.message}
          required
          {...register("email")}
        />
        <Input
          label="Phone"
          error={errors.phone?.message}
          required
          {...register("phone")}
        />

        {clientType === "individual" ? (
          <Input
            label="ID Number"
            error={errors.idNumber?.message}
            {...register("idNumber")}
          />
        ) : (
          <>
            <Input
              label="Registration Number"
              error={errors.registrationNumber?.message}
              {...register("registrationNumber")}
            />
            <div className="col-span-2">
              <Input
                label="Contact Person"
                error={errors.contactPerson?.message}
                {...register("contactPerson")}
              />
            </div>
          </>
        )}

        <div className="col-span-2">
          <Textarea
            label="Address"
            error={errors.address?.message}
            required
            {...register("address")}
          />
        </div>
        <div className="col-span-2">
          <Textarea label="Notes" {...register("notes")} />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" loading={isSubmitting}>
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  );
}

function UploadDocumentForm({
  clientId,
  onSuccess,
}: {
  clientId: string;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !docType) {
      toast({
        type: "error",
        title: "Please select a file and document type",
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
        {/* File input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#2C3B4D]">
            File <span className="text-[#A35139]">*</span>
          </label>
          <div
            className="border-2 border-dashed border-[#C9C1B1] rounded-xl p-6 text-center cursor-pointer hover:border-[#FFB162] transition-colors"
            onClick={() =>
              document.getElementById("doc-file-input")?.click()
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
              id="doc-file-input"
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
