export type InvitationStatus = "pending" | "accepted" | "declined" | "cancelled";

export function canRespondToInvitation(status: InvitationStatus, invitedUserId: string, actorId: string) {
  return status === "pending" && invitedUserId === actorId;
}

export function responseStatus(accept: boolean): "accepted" | "declined" {
  return accept ? "accepted" : "declined";
}
