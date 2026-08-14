import { auth } from "@/auth";
import { ComparisonJoinError, joinComparison } from "@/lib/comparisons";

export async function POST(
  request: Request,
  context: RouteContext<"/api/invites/[inviteCode]/join">,
) {
  const session = await auth();

  if (!session?.user.id) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const consentVersion =
    body && typeof body === "object" && "consentVersion" in body
      ? body.consentVersion
      : null;

  if (typeof consentVersion !== "string") {
    return Response.json({ error: "Consent version is required" }, { status: 400 });
  }

  const { inviteCode } = await context.params;

  try {
    const comparison = await joinComparison(
      inviteCode,
      session.user.id,
      consentVersion,
    );
    return Response.json(comparison);
  } catch (error) {
    if (error instanceof ComparisonJoinError) {
      return Response.json({ error: error.message }, { status: 409 });
    }

    throw error;
  }
}
