import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, desc, asc, ilike, or, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");
  const search = searchParams.get("search") ?? "";
  const sortBy = (searchParams.get("sortBy") ?? "createdAt") as "name" | "email" | "role" | "createdAt";
  const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";

  const offset = (page - 1) * limit;

  try {
    const orderByColumn = {
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    }[sortBy];

    const orderFn = sortOrder === "asc" ? asc : desc;

    const whereClause = search
      ? or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      : undefined;

    const [userList, totalResult] = await Promise.all([
      db.query.users.findMany({
        where: whereClause,
        orderBy: [orderFn(orderByColumn)],
        limit,
        offset,
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db
        .select({ count: count() })
        .from(users)
        .where(whereClause),
    ]);

    return NextResponse.json({
      users: userList,
      total: totalResult[0]?.count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((totalResult[0]?.count ?? 0) / limit),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
