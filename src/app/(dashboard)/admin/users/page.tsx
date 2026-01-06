import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { getUsers } from "@/lib/actions/users";
import { UsersTable } from "./users-table";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id || !isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const search = params.search ?? "";

  const result = await getUsers({
    page,
    limit: 10,
    search,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">User Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage user roles and permissions
        </p>
      </div>

      <UsersTable
        users={result.users ?? []}
        total={result.total ?? 0}
        page={page}
        totalPages={result.totalPages ?? 1}
        currentUserId={session.user.id}
        initialSearch={search}
      />
    </div>
  );
}
