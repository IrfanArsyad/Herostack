import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getInvitationInfo } from "@/lib/actions/teams";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, AlertCircle } from "lucide-react";
import { AcceptInviteButton } from "./accept-button";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const session = await auth();
  const result = await getInvitationInfo(token);

  if (result.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground mb-6">{result.error}</p>
            <Button asChild>
              <Link href="/">Go to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { team, role } = result;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">You&apos;re invited!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div>
            <p className="text-muted-foreground">
              You&apos;ve been invited to join
            </p>
            <h2 className="text-2xl font-bold mt-1">{team?.name}</h2>
            {team?.description && (
              <p className="text-sm text-muted-foreground mt-2">
                {team.description}
              </p>
            )}
          </div>

          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              You will join as{" "}
              <span className="font-medium text-foreground capitalize">
                {role}
              </span>
            </p>
          </div>

          {session?.user ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Logged in as{" "}
                <span className="font-medium text-foreground">
                  {session.user.email}
                </span>
              </p>
              <AcceptInviteButton token={token} />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Please login or register to accept this invitation
              </p>
              <div className="flex gap-2">
                <Button className="flex-1" asChild>
                  <Link href={`/login?callbackUrl=/invite/${token}`}>
                    Login
                  </Link>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/register?callbackUrl=/invite/${token}`}>
                    Register
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
