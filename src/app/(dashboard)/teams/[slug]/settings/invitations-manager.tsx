"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Copy, Trash2, Link as LinkIcon } from "lucide-react";
import { createTeamInvitation, deleteTeamInvitation } from "@/lib/actions/teams";
import { formatDistanceToNow } from "date-fns";

interface Invitation {
  id: string;
  token: string;
  role: "owner" | "admin" | "member";
  maxUses: number | null;
  uses: number;
  expiresAt: Date | null;
  createdAt: Date;
}

interface InvitationsManagerProps {
  teamId: string;
  invitations: Invitation[];
}

export function InvitationsManager({
  teamId,
  invitations,
}: InvitationsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Create form state
  const [role, setRole] = useState<"admin" | "member">("member");
  const [maxUses, setMaxUses] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createTeamInvitation(teamId, {
        role,
        maxUses: maxUses ? parseInt(maxUses) : undefined,
        expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Invitation link created");
        setShowCreateForm(false);
        setRole("member");
        setMaxUses("");
        setExpiresInDays("");
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteTeamInvitation(id);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Invitation deleted");
        router.refresh();
      }
      setDeleteId(null);
    });
  };

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Invitation link copied to clipboard");
  };

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isMaxedOut = (maxUses: number | null, uses: number) => {
    if (maxUses === null) return false;
    return uses >= maxUses;
  };

  return (
    <div className="space-y-4">
      {!showCreateForm ? (
        <Button onClick={() => setShowCreateForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Invitation Link
        </Button>
      ) : (
        <div className="border rounded-lg p-4 space-y-4">
          <h4 className="font-medium">Create New Invitation</h4>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as "admin" | "member")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Max Uses (optional)</Label>
              <Input
                type="number"
                min="1"
                placeholder="Unlimited"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Expires In (days)</Label>
              <Input
                type="number"
                min="1"
                placeholder="Never"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={isPending} size="sm">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateForm(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {invitations.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => {
                const expired = isExpired(invitation.expiresAt);
                const maxed = isMaxedOut(invitation.maxUses, invitation.uses);
                const inactive = expired || maxed;

                return (
                  <TableRow
                    key={invitation.id}
                    className={inactive ? "opacity-50" : ""}
                  >
                    <TableCell>
                      <Badge
                        variant={
                          invitation.role === "admin" ? "default" : "secondary"
                        }
                      >
                        {invitation.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invitation.uses}
                      {invitation.maxUses && ` / ${invitation.maxUses}`}
                      {maxed && (
                        <span className="text-muted-foreground ml-1">
                          (maxed)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {invitation.expiresAt ? (
                        expired ? (
                          <span className="text-destructive">Expired</span>
                        ) : (
                          formatDistanceToNow(new Date(invitation.expiresAt), {
                            addSuffix: true,
                          })
                        )
                      ) : (
                        "Never"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(invitation.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyInviteLink(invitation.token)}
                          disabled={inactive}
                          title="Copy invite link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(invitation.id)}
                          title="Delete invitation"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <LinkIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No invitation links yet</p>
          <p className="text-sm">Create one to invite people to your team</p>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this invitation link. Anyone with
              this link will no longer be able to join.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
