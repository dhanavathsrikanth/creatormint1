"use client";

import { useState, useCallback } from "react";
import {
  ThumbsUp, ThumbsDown, MessageSquare, ChevronDown, ChevronUp,
  Sparkles, Bug, Zap, Link2, Loader2, Shield, Send, X,
} from "lucide-react";
import toast from "react-hot-toast";
import type { FeatureRequest, FeatureStatus, FeatureCategory, FeatureRequestComment } from "@/types/database";

/* ─── config ─────────────────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<FeatureStatus, { label: string; className: string }> = {
  under_review: { label: "Under Review",  className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  planned:      { label: "Planned",        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  in_progress:  { label: "In Progress",    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  done:         { label: "Done ✓",         className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  declined:     { label: "Declined",       className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
};

const CAT_CFG: Record<FeatureCategory, { label: string; icon: React.ElementType; color: string }> = {
  feature:     { label: "Feature",     icon: Sparkles,      color: "text-purple-500" },
  improvement: { label: "Improvement", icon: Zap,           color: "text-amber-500" },
  bug:         { label: "Bug Fix",     icon: Bug,           color: "text-red-500" },
  integration: { label: "Integration", icon: Link2,         color: "text-blue-500" },
  general:     { label: "General",     icon: MessageSquare, color: "text-gray-500" },
};

const ROLE_BADGE: Record<string, string> = {
  creator: "bg-indigo-100 text-indigo-700",
  admin:   "bg-red-100 text-red-700",
  buyer:   "bg-gray-100 text-gray-600",
};

/* ─── comment thread ─────────────────────────────────────────────────────── */

function CommentThread({
  requestId,
  isLoggedIn,
}: {
  requestId: string;
  isLoggedIn: boolean;
}) {
  const [comments, setComments] = useState<FeatureRequestComment[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/feature-requests/${requestId}/comments`);
      const data = await res.json();
      setComments(data.comments ?? []);
      setLoaded(true);
    } catch {
      toast.error("Could not load comments");
    } finally {
      setLoading(false);
    }
  }, [requestId, loaded]);

  const postComment = async () => {
    if (!isLoggedIn) { toast.error("Login to comment"); return; }
    if (!input.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/feature-requests/${requestId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComments((prev) => [...(prev ?? []), data.comment]);
      setInput("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  if (!loaded && !loading) {
    return (
      <button
        onClick={load}
        className="text-xs text-primary font-semibold hover:underline"
      >
        Load comments →
      </button>
    );
  }

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  }

  return (
    <div className="space-y-3">
      {/* Comment list */}
      {(comments ?? []).length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No comments yet — be the first!</p>
      ) : (
        <div className="space-y-2">
          {(comments ?? []).map((c) => (
            <div
              key={c.id}
              className={`rounded-xl px-3 py-2.5 text-sm ${
                c.is_admin_response
                  ? "bg-primary/5 border border-primary/20"
                  : "bg-muted/40"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {c.is_admin_response && (
                  <Shield className="w-3 h-3 text-primary shrink-0" />
                )}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${ROLE_BADGE[c.author_role] ?? "bg-gray-100 text-gray-600"}`}>
                  {c.author_role}
                </span>
                <span className="text-[11px] font-semibold text-foreground">{c.author_name}</span>
                <span className="text-[11px] text-muted-foreground ml-auto">
                  {new Date(c.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                </span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{c.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && postComment()}
          placeholder={isLoggedIn ? "Write a comment…" : "Login to comment"}
          disabled={!isLoggedIn || posting}
          className="flex-1 h-9 text-xs px-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
        />
        <button
          onClick={postComment}
          disabled={!isLoggedIn || posting || !input.trim()}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

/* ─── request card ───────────────────────────────────────────────────────── */

function RequestCard({
  request: initial,
  userVote: initialVote,
  isLoggedIn,
}: {
  request: FeatureRequest;
  userVote: "up" | "down" | null;
  isLoggedIn: boolean;
}) {
  const [req, setReq] = useState(initial);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(initialVote);
  const [voting, setVoting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const statusCfg = STATUS_CONFIG[req.status];
  const catCfg   = CAT_CFG[req.category];
  const CatIcon  = catCfg.icon;

  const handleVote = async (type: "up" | "down") => {
    if (!isLoggedIn) { toast.error("Login to vote"); return; }
    if (voting) return;
    setVoting(true);

    // Optimistic
    const prevVote = userVote;
    const prevUp   = req.vote_count;
    const prevDown = req.downvote_count;

    let newVote: "up" | "down" | null;
    let newUp   = prevUp;
    let newDown = prevDown;

    if (prevVote === type) {
      // toggle off
      newVote = null;
      type === "up" ? newUp-- : newDown--;
    } else {
      // switch or new
      if (prevVote) { prevVote === "up" ? newUp-- : newDown--; }
      type === "up" ? newUp++ : newDown++;
      newVote = type;
    }

    setUserVote(newVote);
    setReq((r) => ({ ...r, vote_count: newUp, downvote_count: newDown }));

    try {
      const res = await fetch(`/api/feature-requests/${req.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote_type: type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUserVote(data.user_vote ?? null);
      setReq((r) => ({ ...r, vote_count: data.vote_count, downvote_count: data.downvote_count }));
    } catch (err) {
      // revert
      setUserVote(prevVote);
      setReq((r) => ({ ...r, vote_count: prevUp, downvote_count: prevDown }));
      toast.error(err instanceof Error ? err.message : "Vote failed");
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/20 transition-all">
      <div className="flex gap-4 p-5">
        {/* Vote column */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          {/* Upvote */}
          <button
            onClick={() => handleVote("up")}
            disabled={voting}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl border-2 transition-all min-w-[46px] ${
              userVote === "up"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-primary"
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${userVote === "up" ? "fill-primary" : ""}`} />
            <span className="text-xs font-black">{req.vote_count}</span>
          </button>

          {/* Downvote */}
          <button
            onClick={() => handleVote("down")}
            disabled={voting}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl border-2 transition-all min-w-[46px] ${
              userVote === "down"
                ? "border-red-400 bg-red-50 text-red-500 dark:bg-red-900/20"
                : "border-border bg-muted/30 text-muted-foreground hover:border-red-400/50 hover:text-red-400"
            }`}
          >
            <ThumbsDown className={`w-3.5 h-3.5 ${userVote === "down" ? "fill-red-400" : ""}`} />
            <span className="text-xs font-black">{req.downvote_count ?? 0}</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 flex-wrap mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <CatIcon className={`w-3.5 h-3.5 shrink-0 ${catCfg.color}`} />
              <span className="text-[11px] font-semibold text-muted-foreground">{catCfg.label}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCfg.className}`}>
                {statusCfg.label}
              </span>
            </div>
          </div>

          <h3 className="text-sm font-bold text-foreground mb-1">{req.title}</h3>
          {req.description && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">{req.description}</p>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ROLE_BADGE[req.author_role] ?? "bg-gray-100 text-gray-600"}`}>
                {req.author_role}
              </span>
              <span className="text-[11px] text-muted-foreground">{req.author_name}</span>
              <span className="text-[11px] text-muted-foreground">·</span>
              <span className="text-[11px] text-muted-foreground">
                {new Date(req.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
              </span>
            </div>

            <button
              onClick={() => setShowComments((s) => !s)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Comments
              {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Admin response banner */}
      {req.admin_response && (
        <div className="mx-5 mb-4 p-3.5 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Admin Response</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">{req.admin_response}</p>
        </div>
      )}

      {/* Comments section */}
      {showComments && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          <CommentThread requestId={req.id} isLoggedIn={isLoggedIn} />
        </div>
      )}
    </div>
  );
}

/* ─── main board ─────────────────────────────────────────────────────────── */

interface FeatureBoardProps {
  initialRequests: FeatureRequest[];
  initialUserVotes: Record<string, "up" | "down">;
  isLoggedIn: boolean;
}

export function FeatureBoard({ initialRequests, initialUserVotes, isLoggedIn }: FeatureBoardProps) {
  const [statusFilter,   setStatusFilter]   = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = initialRequests.filter((r) => {
    if (statusFilter   !== "all" && r.status   !== statusFilter)   return false;
    if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
    return true;
  });

  const statusFilters = [
    { value: "all",         label: "All" },
    { value: "under_review", label: "Under Review" },
    { value: "planned",     label: "Planned" },
    { value: "in_progress", label: "In Progress" },
    { value: "done",        label: "Done" },
  ];

  const categoryFilters = [
    { value: "all",         label: "All" },
    { value: "feature",     label: "Feature" },
    { value: "improvement", label: "Improvement" },
    { value: "bug",         label: "Bug Fix" },
    { value: "integration", label: "Integration" },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground">Status:</span>
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                statusFilter === f.value
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground">Category:</span>
          {categoryFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setCategoryFilter(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                categoryFilter === f.value
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} request{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No requests yet — be the first!</p>
          </div>
        ) : (
          filtered.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              userVote={initialUserVotes[req.id] ?? null}
              isLoggedIn={isLoggedIn}
            />
          ))
        )}
      </div>
    </div>
  );
}
