"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { addTeamMember } from "@/lib/actions/teams";

interface AddMemberDialogProps {
  teamId: string;
  trigger?: React.ReactNode;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export function AddMemberDialog({ teamId, trigger }: AddMemberDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [role, setRole] = useState<"admin" | "member">("member");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!search.trim()) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/users?search=${encodeURIComponent(search)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error("Failed to search users:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleAdd = () => {
    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }

    startTransition(async () => {
      const result = await addTeamMember(teamId, selectedUser.id, role);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Member added successfully");
        setOpen(false);
        setSearch("");
        setSelectedUser(null);
        setRole("member");
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Team Member
          </DialogTitle>
          <DialogDescription>
            Search for a user and add them to your team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User search */}
          <div className="space-y-2">
            <Label>Search User</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedUser(null);
                }}
                className="pl-9"
                disabled={isPending}
              />
            </div>

            {/* Search results */}
            {search && !selectedUser && (
              <div className="border rounded-md max-h-48 overflow-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No users found
                  </div>
                ) : (
                  users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user);
                        setSearch(user.name || user.email || "");
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback>
                          {user.name?.[0] || user.email?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {user.name || "Unnamed"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Selected user */}
            {selectedUser && (
              <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedUser.image || undefined} />
                  <AvatarFallback>
                    {selectedUser.name?.[0] || selectedUser.email?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {selectedUser.name || "Unnamed"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedUser.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedUser(null);
                    setSearch("");
                  }}
                >
                  Change
                </Button>
              </div>
            )}
          </div>

          {/* Role selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value: "admin" | "member") => setRole(value)}
              disabled={isPending}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member - Can view team content</SelectItem>
                <SelectItem value="admin">Admin - Can manage team and members</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!selectedUser || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
