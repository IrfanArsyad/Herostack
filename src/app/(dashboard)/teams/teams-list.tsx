"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, X, Eye, Settings, Crown, Shield, User } from "lucide-react";

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  myRole: "owner" | "admin" | "member";
  memberCount: number;
}

interface TeamsListProps {
  teams: Team[];
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

export function TeamsList({ teams }: TeamsListProps) {
  const [search, setSearch] = useState("");

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
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTeams.map((team) => {
            const RoleIcon = roleIcons[team.myRole];
            return (
              <Card
                key={team.id}
                className="hover:bg-muted/50 transition-colors group"
              >
                <CardContent className="py-4 px-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{team.name}</h3>
                        <Badge variant="outline" className="text-xs shrink-0">
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleLabels[team.myRole]}
                        </Badge>
                      </div>
                      {team.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {team.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {team.memberCount} member{team.memberCount !== 1 && "s"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/teams/${team.slug}`}>
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Link>
                    </Button>
                    {(team.myRole === "owner" || team.myRole === "admin") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link href={`/teams/${team.slug}/settings`}>
                          <Settings className="h-3.5 w-3.5 mr-1" />
                          Settings
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
