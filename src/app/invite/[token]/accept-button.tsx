"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { acceptTeamInvitation } from "@/lib/actions/teams";

interface AcceptInviteButtonProps {
  token: string;
}

export function AcceptInviteButton({ token }: AcceptInviteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  const handleAccept = () => {
    startTransition(async () => {
      const result = await acceptTeamInvitation(token);

      if (result.error) {
        toast.error(result.error);
        if (result.teamSlug) {
          router.push(`/teams/${result.teamSlug}`);
        }
      } else if (result.success) {
        setSuccess(true);
        toast.success(`Welcome to ${result.teamName}!`);
        setTimeout(() => {
          router.push(`/teams/${result.teamSlug}`);
        }, 1500);
      }
    });
  };

  if (success) {
    return (
      <Button disabled className="w-full">
        <CheckCircle className="h-4 w-4 mr-2" />
        Joined! Redirecting...
      </Button>
    );
  }

  return (
    <Button onClick={handleAccept} disabled={isPending} className="w-full">
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Joining...
        </>
      ) : (
        "Accept Invitation"
      )}
    </Button>
  );
}
