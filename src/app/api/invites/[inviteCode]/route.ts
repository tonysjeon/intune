import { getInvitePreview } from "@/lib/comparisons";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/invites/[inviteCode]">,
) {
  const { inviteCode } = await context.params;
  const invitation = await getInvitePreview(inviteCode);

  if (!invitation) {
    return Response.json({ error: "Invitation not found" }, { status: 404 });
  }

  return Response.json(invitation);
}
