import { auth } from "@/auth";
import { getComparisonForMember } from "@/lib/comparisons";

export async function GET(_request: Request, context: RouteContext<"/api/comparisons/[id]">) {
  const session = await auth();

  if (!session?.user.id) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await context.params;
  const comparison = await getComparisonForMember(id, session.user.id);

  if (!comparison) {
    return Response.json({ error: "Comparison not found" }, { status: 404 });
  }

  return Response.json(comparison);
}
