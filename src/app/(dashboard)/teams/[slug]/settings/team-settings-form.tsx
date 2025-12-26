"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { updateTeam } from "@/lib/actions/teams";

interface TeamSettingsFormProps {
  teamId: string;
  initialName: string;
  initialDescription: string;
}

export function TeamSettingsForm({
  teamId,
  initialName,
  initialDescription,
}: TeamSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Team name is required");
      return;
    }

    startTransition(async () => {
      const result = await updateTeam(teamId, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Team updated successfully");
        if (result.team?.slug) {
          router.push(`/teams/${result.team.slug}/settings`);
        }
        router.refresh();
      }
    });
  };

  const hasChanges =
    name !== initialName || description !== initialDescription;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Team Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter team name"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter team description (optional)"
          rows={3}
          disabled={isPending}
        />
      </div>

      <Button type="submit" disabled={isPending || !hasChanges}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </form>
  );
}
