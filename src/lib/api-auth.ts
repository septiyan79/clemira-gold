import { auth } from "@/lib/auth";

/** Returns a 401 Response if the request is not from an authenticated admin, null otherwise. */
export async function requireAdmin(): Promise<Response | null> {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
