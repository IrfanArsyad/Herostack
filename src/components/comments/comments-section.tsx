"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MessageSquare, MoreHorizontal, Reply, Pencil, Trash2, Send } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user: User;
  parentId: string | null;
  replies?: Comment[];
}

interface CommentsSectionProps {
  pageId: string;
  initialComments: Comment[];
  currentUser: { id: string; name?: string | null; image?: string | null } | null;
}

export function CommentsSection({ pageId, initialComments, currentUser }: CommentsSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageId, content: newComment }),
        });

        if (res.ok) {
          const comment = await res.json();
          setComments([...comments, { ...comment, replies: [] }]);
          setNewComment("");
          toast.success("Comment added");
        } else {
          const data = await res.json();
          toast.error(data.error || "Failed to add comment");
        }
      } catch {
        toast.error("Failed to add comment");
      }
    });
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || !currentUser) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageId, content: replyContent, parentId }),
        });

        if (res.ok) {
          const reply = await res.json();
          setComments(
            comments.map((c) =>
              c.id === parentId
                ? { ...c, replies: [...(c.replies || []), reply] }
                : c
            )
          );
          setReplyContent("");
          setReplyingTo(null);
          toast.success("Reply added");
        } else {
          const data = await res.json();
          toast.error(data.error || "Failed to add reply");
        }
      } catch {
        toast.error("Failed to add reply");
      }
    });
  };

  const handleEdit = async (commentId: string, isReply: boolean, parentId?: string) => {
    if (!editContent.trim()) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/comments/${commentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editContent }),
        });

        if (res.ok) {
          const updated = await res.json();
          if (isReply && parentId) {
            setComments(
              comments.map((c) =>
                c.id === parentId
                  ? {
                      ...c,
                      replies: c.replies?.map((r) =>
                        r.id === commentId ? { ...r, content: updated.content, updatedAt: updated.updatedAt } : r
                      ),
                    }
                  : c
              )
            );
          } else {
            setComments(
              comments.map((c) =>
                c.id === commentId ? { ...c, content: updated.content, updatedAt: updated.updatedAt } : c
              )
            );
          }
          setEditingId(null);
          setEditContent("");
          toast.success("Comment updated");
        } else {
          const data = await res.json();
          toast.error(data.error || "Failed to update comment");
        }
      } catch {
        toast.error("Failed to update comment");
      }
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/comments/${deleteId}`, {
          method: "DELETE",
        });

        if (res.ok) {
          // Remove from top-level or replies
          setComments(
            comments
              .filter((c) => c.id !== deleteId)
              .map((c) => ({
                ...c,
                replies: c.replies?.filter((r) => r.id !== deleteId),
              }))
          );
          toast.success("Comment deleted");
        } else {
          const data = await res.json();
          toast.error(data.error || "Failed to delete comment");
        }
      } catch {
        toast.error("Failed to delete comment");
      } finally {
        setDeleteId(null);
      }
    });
  };

  const CommentItem = ({
    comment,
    isReply = false,
    parentId,
  }: {
    comment: Comment;
    isReply?: boolean;
    parentId?: string;
  }) => {
    const isOwner = currentUser?.id === comment.userId;
    const isEditing = editingId === comment.id;

    return (
      <div className={`flex gap-3 ${isReply ? "ml-10 mt-3" : ""}`}>
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.user.image ?? undefined} />
          <AvatarFallback>
            {comment.user.name?.charAt(0)?.toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.user.name ?? "User"}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
            {new Date(comment.updatedAt) > new Date(comment.createdAt) && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleEdit(comment.id, isReply, parentId)}
                  disabled={isPending}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingId(null);
                    setEditContent("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
          )}

          {!isEditing && currentUser && (
            <div className="flex items-center gap-2 mt-2">
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    setReplyingTo(replyingTo === comment.id ? null : comment.id);
                    setReplyContent("");
                  }}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditContent(comment.content);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteId(comment.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          {/* Reply form */}
          {replyingTo === comment.id && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleReply(comment.id)}
                  disabled={isPending || !replyContent.trim()}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  isReply
                  parentId={comment.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New comment form */}
        {currentUser ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={currentUser.image ?? undefined} />
                <AvatarFallback>
                  {currentUser.name?.charAt(0)?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending || !newComment.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Comment
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Please log in to leave a comment
          </p>
        )}

        {/* Comments list */}
        {comments.length > 0 ? (
          <div className="space-y-6 pt-4 border-t">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </CardContent>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
