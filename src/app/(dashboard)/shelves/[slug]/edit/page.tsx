"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateShelf } from "@/lib/actions/shelves";
import { ArrowLeft, Users } from "lucide-react";
import { use } from "react";

interface EditShelfPageProps {
  params: Promise<{ slug: string }>;
}

interface Team {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export default function EditShelfPage({ params }: EditShelfPageProps) {
  const { slug } = use(params);
  const [shelf, setShelf] = useState<{
    id: string;
    name: string;
    description: string | null;
    teamId: string | null;
  } | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("personal");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [shelfRes, teamsRes] = await Promise.all([
        fetch(`/api/shelves/${slug}`),
        fetch("/api/my-teams"),
      ]);

      if (shelfRes.ok) {
        const data = await shelfRes.json();
        setShelf(data);
        setSelectedTeam(data.teamId || "personal");
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData);
      }
    }
    fetchData();
  }, [slug]);

  async function handleSubmit(formData: FormData) {
    if (!shelf) return;
    setIsLoading(true);
    setError(null);

    if (selectedTeam !== "personal") {
      formData.set("teamId", selectedTeam);
    }

    const result = await updateShelf(shelf.id, formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  if (!shelf) {
    return (
      <>
        <Header breadcrumbs={[{ label: "Loading..." }]} />
        <div className="p-6">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Shelves", href: "/shelves" },
          { label: shelf.name, href: `/shelves/${slug}` },
          { label: "Edit" },
        ]}
      />
      <div className="p-6 max-w-2xl mx-auto w-full">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/shelves/${slug}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shelf
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Shelf</CardTitle>
            <CardDescription>Update the shelf details below.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={shelf.name}
                  placeholder="Enter shelf name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={shelf.description ?? ""}
                  placeholder="Describe what this shelf contains"
                  rows={3}
                />
              </div>

              {teams.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Ownership
                  </Label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal (only me)</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {selectedTeam === "personal"
                      ? "Only you can access this shelf"
                      : "All team members can access this shelf"}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/shelves/${slug}`}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
