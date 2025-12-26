"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Crown, Shield, User } from "lucide-react";
import { removeTeamMember, updateTeamMemberRole } from "@/lib/actions/teams";

interface Member {
  teamId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: "admin" | "editor" | "viewer";
  };
}

interface MembersManagerProps {
  teamId: string;
  members: Member[];
  currentUserId: string;
  isOwner: boolean;
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: User,
};

const roleLabels = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export function MembersManager({
  teamId,
  members,
  currentUserId,
  isOwner,
}: MembersManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<string | null>(
    null
  );

  const handleRoleChange = (userId: string, newRole: "admin" | "member") => {
    setPendingRoleChange(userId);
    startTransition(async () => {
      const result = await updateTeamMemberRole(teamId, userId, newRole);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Role updated");
        router.refresh();
      }
      setPendingRoleChange(null);
    });
  };

  const handleRemove = (userId: string) => {
    startTransition(async () => {
      const result = await removeTeamMember(teamId, userId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Member removed");
        router.refresh();
      }
      setRemoveId(null);
    });
  };

  const memberToRemove = members.find((m) => m.userId === removeId);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const RoleIcon = roleIcons[member.role];
              const isCurrentUser = member.userId === currentUserId;
              const isMemberOwner = member.role === "owner";
              const canModify = isOwner && !isMemberOwner && !isCurrentUser;
              const canRemove = isOwner && !isMemberOwner;

              return (
                <TableRow key={member.userId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.user.image || undefined} />
                        <AvatarFallback>
                          {member.user.name?.[0] ||
                            member.user.email?.[0] ||
                            "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {member.user.name || "Unknown"}
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {canModify ? (
                      <Select
                        value={member.role}
                        onValueChange={(v) =>
                          handleRoleChange(member.userId, v as "admin" | "member")
                        }
                        disabled={pendingRoleChange === member.userId}
                      >
                        <SelectTrigger className="w-[120px]">
                          {pendingRoleChange === member.userId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant={
                          member.role === "owner"
                            ? "default"
                            : member.role === "admin"
                            ? "secondary"
                            : "outline"
                        }
                        className="gap-1"
                      >
                        <RoleIcon className="h-3 w-3" />
                        {roleLabels[member.role]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {canRemove && !isCurrentUser && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setRemoveId(member.userId)}
                        title="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!removeId} onOpenChange={() => setRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>
                {memberToRemove?.user.name || memberToRemove?.user.email}
              </strong>{" "}
              from this team? They will lose access to all team content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeId && handleRemove(removeId)}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
