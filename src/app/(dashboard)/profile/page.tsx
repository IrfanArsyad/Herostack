import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { ProfileForm } from "./profile-form";
import { ChangePasswordForm } from "./change-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Lock, Crown, Shield, Pencil, Eye } from "lucide-react";

const roleIcons = {
  superadmin: Crown,
  admin: Shield,
  editor: Pencil,
  viewer: Eye,
};

const roleLabels = {
  superadmin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) {
    redirect("/login");
  }

  const hasPassword = !!user.password;
  const RoleIcon = roleIcons[user.role as keyof typeof roleIcons] || Eye;

  return (
    <>
      <Header breadcrumbs={[{ label: "Profile" }]} />
      <div className="p-6 max-w-2xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground text-sm">
            Manage your account settings
          </p>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Account Information</CardTitle>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <RoleIcon className="h-3 w-3" />
                {roleLabels[user.role as keyof typeof roleLabels] || user.role}
              </Badge>
            </div>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              initialName={user.name || ""}
              email={user.email || ""}
            />
          </CardContent>
        </Card>

        {/* Change Password Card - only show for users with password */}
        {hasPassword && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Change Password</CardTitle>
              </div>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        )}

        {!hasPassword && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Password</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your account uses OAuth authentication. Password management is
                not available.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
