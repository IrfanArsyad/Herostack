"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, X, Eye, Settings, Crown, Shield, User, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { deleteTeam } from "@/lib/actions/teams";

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  myRole: "superadmin" | "owner" | "admin" | "member";
  memberCount: number;
}

interface TeamsListProps {
  teams: Team[];
}

const roleIcons = {
  superadmin: Crown,
  owner: Crown,
  admin: Shield,
  member: User,
};

const roleLabels = {
  superadmin: "Super Admin",
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export function TeamsList({ teams }: TeamsListProps) {
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  const handleDelete = async () => {
    if (!teamToDelete) return;
    setDeletingId(teamToDelete.id);
    await deleteTeam(teamToDelete.id);
    setDeletingId(null);
    setDeleteDialogOpen(false);
    setTeamToDelete(null);
  };

  const openDeleteDialog = (team: Team) => {
    setTeamToDelete(team);
    setDeleteDialogOpen(true);
  };

  const filteredTeams = useMemo(() => {
    if (!search.trim()) return teams;

    const query = search.toLowerCase();
    return teams.filter(
      (team) =>
        team.name.toLowerCase().includes(query) ||
        team.description?.toLowerCase().includes(query)
    );
  }, [teams, search]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search teams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results count */}
      {search && (
        <p className="text-sm text-muted-foreground">
          Found {filteredTeams.length}{" "}
          {filteredTeams.length === 1 ? "team" : "teams"}
          {filteredTeams.length !== teams.length && ` of ${teams.length}`}
        </p>
      )}

      {/* Teams list */}
      {filteredTeams.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              {search ? "No teams match your search" : "No teams yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {filteredTeams.map((team) => {
            const RoleIcon = roleIcons[team.myRole];
            return (
              <Card key={team.id} className="hover:bg-muted/50 transition-colors group">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded shrink-0">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm truncate">{team.name}</h3>
                        <Badge variant="outline" className="text-xs shrink-0">
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleLabels[team.myRole]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {team.memberCount} member{team.memberCount !== 1 && "s"}
                        {team.description && ` • ${team.description}`}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/teams/${team.slug}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        {(team.myRole === "owner" || team.myRole === "admin") && (
                          <DropdownMenuItem asChild>
                            <Link href={`/teams/${team.slug}/settings`}>
                              <Settings className="mr-2 h-4 w-4" />
                              Settings
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {team.myRole === "owner" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(team)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the team &quot;{teamToDelete?.name}&quot; and all its content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingId === teamToDelete?.id}
            >
              {deletingId === teamToDelete?.id ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
