"use client";

import { useState } from "react";
import { Loader2, ThumbsUp, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import type { FeatureRequest, FeatureStatus, FeatureCategory } from "@/types/database";

const STATUS_OPTIONS: { value: FeatureStatus; label: string; className: string }[] = [
  { value: "under_review", label: "Under Review", className: "bg-gray-100 text-gray-700 border-gray-200" },
  { value: "planned",      label: "Planned",       className: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "in_progress",  label: "In Progress",   className: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "done",         label: "Done ✓",         className: "bg-green-100 text-green-700 border-green-200" },
  { value: "declined",     label: "Declined",       className: "bg-red-100 text-red-700 border-red-200" },
];

const CAT_LABELS: Record<FeatureCategory, string> = {
  feature: "✨ Feature", improvement: "⚡ Improvement", bug: "🐛 Bug",
  integration: "🔗 Integration", general: "💬 General",
};

function RequestCard({ request: initial }: { request: FeatureRequest }) {
  const [req, setReq] = useState(initial);
  const [adminResponse, setAdminResponse] = useState(initial.admin_response ?? "");
  const [editingResponse, setEditingResponse] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateStatus = async (status: FeatureStatus) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/feature-requests/${req.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReq(data.request);
      toast.success(`Status → ${status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const saveResponse = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/feature-requests/${req.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_response: adminResponse }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReq(data.request);
      setEditingResponse(false);
      toast.success("Response saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] text-muted-foreground">{CAT_LABELS[req.category]}</span>
            <span className="text-[11px] text-muted-foreground">·</span>
            <span className="text-[11px] font-semibold text-muted-foreground capitalize">{req.author_role}</span>
            <span className="text-[11px] text-muted-foreground">{req.author_name}</span>
          </div>
          <h3 className="text-sm font-bold text-foreground">{req.title}</h3>
          {req.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{req.description}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <ThumbsUp className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm font-black text-foreground">{req.vote_count}</span>
        </div>
      </div>

      {/* Status selector */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</p>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateStatus(opt.value)}
              disabled={saving}
              className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all ${
                req.status === opt.value
                  ? `${opt.className} ring-2 ring-offset-1 ring-current`
                  : "bg-muted text-muted-foreground border-border hover:border-gray-300 opacity-60 hover:opacity-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
          {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {/* Admin response */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Admin Response</p>
          {!editingResponse && (
            <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={() => setEditingResponse(true)}>
              {req.admin_response ? "Edit" : "Add response"}
            </Button>
          )}
        </div>
        {editingResponse ? (
          <div className="space-y-2">
            <Textarea
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              placeholder="Write a response to this request…"
              className="min-h-[80px] resize-none text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveResponse} disabled={saving} className="h-7 text-xs">
                {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditingResponse(false); setAdminResponse(req.admin_response ?? ""); }} className="h-7 text-xs">
                <X className="w-3 h-3 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        ) : req.admin_response ? (
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-xs text-foreground leading-relaxed">{req.admin_response}</p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No response yet</p>
        )}
      </div>
    </div>
  );
}

export function AdminRoadmapClient({ initialRequests }: { initialRequests: FeatureRequest[] }) {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = statusFilter === "all"
    ? initialRequests
    : initialRequests.filter((r) => r.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 flex-wrap">
        {["all", "under_review", "planned", "in_progress", "done", "declined"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              statusFilter === s ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? "All" : s.replace("_", " ").replace(/^./, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((req) => <RequestCard key={req.id} request={req} />)}
        {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">No requests in this category</p>}
      </div>
    </div>
  );
}
