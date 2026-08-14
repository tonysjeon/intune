"use server";

import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import {
  ComparisonEligibilityError,
  ComparisonJoinError,
  CONSENT_VERSION,
  createComparisonForUser,
  joinComparison,
} from "@/lib/comparisons";

export interface ComparisonActionState {
  error: string;
}

export async function createComparisonAction(
  _previousState: ComparisonActionState,
  formData: FormData,
): Promise<ComparisonActionState> {
  void _previousState;
  const session = await auth();

  if (!session?.user.id) {
    return { error: "Sign in before creating a comparison" };
  }

  if (formData.get("consent") !== "on") {
    return { error: "Consent is required to create a comparison" };
  }

  let comparisonId: string;

  try {
    const comparison = await createComparisonForUser(
      session.user.id,
      CONSENT_VERSION,
    );
    comparisonId = comparison.id;
  } catch (error) {
    if (error instanceof ComparisonEligibilityError) {
      return { error: error.message };
    }
    throw error;
  }

  redirect(`/comparisons/${comparisonId}`);
}

export async function joinComparisonAction(
  _previousState: ComparisonActionState,
  formData: FormData,
): Promise<ComparisonActionState> {
  void _previousState;
  const session = await auth();

  if (!session?.user.id) {
    return { error: "Sign in before joining a comparison" };
  }

  const inviteCode = formData.get("inviteCode");
  if (typeof inviteCode !== "string" || !inviteCode) {
    return { error: "The invitation code is missing" };
  }

  if (formData.get("consent") !== "on") {
    return { error: "Consent is required to join this comparison" };
  }

  let comparisonId: string;

  try {
    const comparison = await joinComparison(
      inviteCode,
      session.user.id,
      CONSENT_VERSION,
    );
    comparisonId = comparison.id;
  } catch (error) {
    if (error instanceof ComparisonJoinError) {
      return { error: error.message };
    }
    throw error;
  }

  redirect(`/comparisons/${comparisonId}`);
}

export async function connectSpotifyFromInvite(formData: FormData) {
  const inviteCode = formData.get("inviteCode");

  if (
    typeof inviteCode !== "string" ||
    !/^[A-Za-z0-9_-]{24}$/.test(inviteCode)
  ) {
    throw new Error("Invalid invitation code");
  }

  await signIn("spotify", { redirectTo: `/invite/${inviteCode}` });
}
