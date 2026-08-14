import { auth } from "@/auth";
import {
  ComparisonEligibilityError,
  createComparisonForUser,
} from "@/lib/comparisons";

export async function POST(request: Request) {
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

  try {
    const comparison = await createComparisonForUser(
      session.user.id,
      consentVersion,
    );
    const inviteUrl = new URL(`/invite/${comparison.inviteCode}`, request.url);

    return Response.json(
      { ...comparison, inviteUrl: inviteUrl.toString() },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ComparisonEligibilityError) {
      return Response.json({ error: error.message }, { status: 409 });
    }

    throw error;
  }
}
