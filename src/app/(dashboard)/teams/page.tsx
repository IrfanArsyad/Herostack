import { getMyTeams } from "@/lib/actions/teams";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { TeamsList } from "./teams-list";
import { CreateTeamDialog } from "./create-team-dialog";

export default async function TeamsPage() {
  const result = await getMyTeams();

  if (result.error) {
    return (
      <div className="p-6 max-w-5xl mx-auto w-full">
        <p className="text-red-500">{result.error}</p>
      </div>
    );
  }

  const teams = result.teams || [];

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-muted-foreground text-sm">
            Manage your teams and collaborate with others
          </p>
        </div>
        <CreateTeamDialog />
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              You&apos;re not part of any team yet
            </p>
            <CreateTeamDialog />
          </CardContent>
        </Card>
      ) : (
        <TeamsList teams={teams} />
      )}
    </div>
  );
}
