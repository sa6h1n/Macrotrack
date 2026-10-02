/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Trophy,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Member = {
  user_id: string;
  name: string;

  calorie_target: number | null;
  protein_target: number | null;
  carb_target: number | null;
  fat_target: number | null;

  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;

  weight_kg: number | null;

  meal_details: Array<{
    name: string;
    meal: string;
    grams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
};

type DialogProps = {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
};

function Dialog({
  title,
  description,
  onClose,
  children,
}: DialogProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#181b21] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-white">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-sm text-[#858b95]">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#858b95] hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function percentage(
  value: number | null,
  target: number | null,
) {
  if (
    value == null ||
    target == null ||
    target <= 0
  ) {
    return null;
  }

  return Math.min(
    100,
    Math.max(0, (value / target) * 100),
  );
}

function targetAccuracy(
  value: number | null,
  target: number | null,
) {
  if (
    value == null ||
    target == null ||
    target <= 0
  ) {
    return null;
  }

  return Math.max(
    0,
    1 - Math.abs(value - target) / target,
  );
}

function leaderboardAccuracy(member: Member) {
  const calorie = targetAccuracy(
    member.calories,
    member.calorie_target,
  );

  const protein = targetAccuracy(
    member.protein,
    member.protein_target,
  );

  const values = [calorie, protein].filter(
    (value): value is number =>
      value !== null,
  );

  if (!values.length) return null;

  return (
    values.reduce(
      (sum, value) => sum + value,
      0,
    ) / values.length
  );
}

function Metric({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number | null;
  target: number | null;
  unit: string;
}) {
  const progress = percentage(
    value,
    target,
  );

  if (progress === null) return null;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
        <span>{label}</span>

        <span className="whitespace-nowrap text-[#858b95]">
          {Number(value ?? 0).toFixed(
            label === "Calories" ? 0 : 1,
          )}{" "}
          /{" "}
          {Number(target ?? 0).toFixed(
            label === "Calories" ? 0 : 1,
          )}{" "}
          {unit}
        </span>
      </div>

      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-moss-500 transition-all"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}

export default function TogetherPage() {
  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://macrotrack-ashy.vercel.app";

  const [groups, setGroups] = useState<any[]>(
    [],
  );
  const [groupId, setGroupId] = useState("");
  const [members, setMembers] = useState<Member[]>(
    [],
  );

  const [owner, setOwner] = useState(false);

  const [newGroupName, setNewGroupName] =
    useState("");
  const [inviteEmail, setInviteEmail] =
    useState("");

  const [joinMode, setJoinMode] =
    useState<"invite_only" | "link">(
      "invite_only",
    );

  const [editGroupName, setEditGroupName] =
    useState("");
  const [editJoinMode, setEditJoinMode] =
    useState<"invite_only" | "link">(
      "invite_only",
    );

  const [joinLink, setJoinLink] =
    useState("");

  const [invitations, setInvitations] =
    useState<any[]>([]);

  const [showCreateGroup, setShowCreateGroup] =
    useState(false);
  const [showInvite, setShowInvite] =
    useState(false);
  const [showActions, setShowActions] =
    useState(false);
  const [showMembers, setShowMembers] =
    useState(false);
  const [showEditGroup, setShowEditGroup] =
    useState(false);
  const [showDeleteGroup, setShowDeleteGroup] =
    useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [expandedMeals, setExpandedMeals] =
    useState<Record<string, boolean>>({});

  const [expandedMembers, setExpandedMembers] =
    useState<Record<string, boolean>>({});

  const today =
    new Date().toISOString().slice(0, 10);

  async function load(
    preferredGroupId?: string,
  ) {
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id;

    const {
      data: groupRows,
      error: groupError,
    } = await supabase
      .from("groups")
      .select(
        "id,name,created_by,join_mode,join_token,group_members(user_id,role)",
      )
      .order("created_at", {
        ascending: false,
      });

    if (groupError) {
      setError(groupError.message);
      return;
    }

    const rows = groupRows ?? [];

    setGroups(rows);

    const selected =
      rows.find(
        (group) =>
          group.id ===
          (preferredGroupId ?? groupId),
      ) ?? rows[0];

    if (!selected) {
      setGroupId("");
      setMembers([]);
      setJoinLink("");
      setOwner(false);
      return;
    }

    setGroupId(selected.id);

    setOwner(
      selected.created_by === userId,
    );

    setJoinLink(
      selected.join_mode === "link" &&
        selected.join_token
        ? `${SITE_URL}/join/${selected.join_token}`
        : "",
    );

    const {
      data: progress,
      error: progressError,
    } = await supabase.rpc(
      "group_shared_progress_v2",
      {
        target_group: selected.id,
        selected_day: today,
      },
    );

    if (progressError) {
      setError(progressError.message);
      setMembers([]);
    } else {
      setMembers(
        (Array.isArray(progress)
          ? progress
          : []) as Member[],
      );
    }

    const {
      data: invitationData,
      error: invitationError,
    } = await supabase
      .from("group_invitations")
      .select(
        "id,group_id,status,created_at,groups(name)",
      )
      .eq("status", "pending");

    if (invitationError) {
      setError(invitationError.message);
    }

    setInvitations(invitationData ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  const selectedGroup = groups.find(
    (group) => group.id === groupId,
  );

  async function createGroup() {
    const name = newGroupName.trim();

    if (!name) {
      setError(
        "Give your group a name first.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      setError(
        "Please sign in again before creating a group.",
      );
      return;
    }

    const {
      data,
      error: createError,
    } = await supabase.rpc("create_group", {
      group_name: name,
      group_join_mode: joinMode,
    });

    setSaving(false);

    if (createError) {
      setError(createError.message);
      return;
    }

    setNewGroupName("");
    setJoinMode("invite_only");
    setShowCreateGroup(false);

    setMessage(
      `"${name}" created.`,
    );

    await load(data);
  }

  async function updateGroup() {
    const name = editGroupName.trim();

    if (!name || !groupId || !owner) {
      setError(
        "Give your group a name first.",
      );
      return;
    }

    setSaving(true);
    setError("");

    const {
      error: updateError,
    } = await supabase
      .from("groups")
      .update({
        name,
        join_mode: editJoinMode,
      })
      .eq("id", groupId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setShowEditGroup(false);
    setShowActions(false);

    setMessage(
      `"${name}" updated.`,
    );

    await load(groupId);
  }

  async function deleteGroup() {
    if (!groupId || !owner) return;

    setSaving(true);
    setError("");

    const name =
      selectedGroup?.name ?? "Group";

    const {
      error: deleteError,
    } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId);

    setSaving(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setShowDeleteGroup(false);
    setShowActions(false);
    setMessage(
      `"${name}" deleted.`,
    );

    await load();
  }

  async function invite() {
    const email =
      inviteEmail.trim().toLowerCase();

    if (!email || !groupId) return;

    setSaving(true);
    setError("");

    const {
      error: inviteError,
    } = await supabase.rpc(
      "invite_group_member",
      {
        target_group: groupId,
        invited_email: email,
      },
    );

    setSaving(false);

    if (inviteError) {
      setError(inviteError.message);
      return;
    }

    setInviteEmail("");
    setShowInvite(false);

    setMessage(
      `Invitation sent to ${email}.`,
    );

    await load(groupId);
  }

  async function copyJoinLink() {
    if (!joinLink) {
      setError(
        "This group does not currently have a join link.",
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(
        joinLink,
      );

      setMessage(
        "Join link copied.",
      );
    } catch {
      setError(
        "Unable to copy the join link.",
      );
    }
  }

  async function regenerateJoinLink() {
    if (!groupId || !owner) return;

    setSaving(true);
    setError("");
    setShowActions(false);

    const {
      data,
      error: regenerateError,
    } = await supabase.rpc(
      "regenerate_group_join_token",
      {
        target_group: groupId,
      },
    );

    setSaving(false);

    if (regenerateError) {
      setError(
        regenerateError.message,
      );
      return;
    }

    const token = String(data ?? "");

    setJoinLink(
      token
        ? `${SITE_URL}/join/${token}`
        : "",
    );

    setMessage(
      "Join link regenerated.",
    );

    await load(groupId);
  }

  async function respond(
    invitationId: string,
    accept: boolean,
  ) {
    setError("");

    const {
      error: responseError,
    } = await supabase.rpc(
      accept
        ? "accept_group_invitation"
        : "decline_group_invitation",
      {
        invitation_id: invitationId,
      },
    );

    if (responseError) {
      setError(
        responseError.message,
      );
    } else {
      setMessage(
        accept
          ? "Invitation accepted."
          : "Invitation declined.",
      );
    }

    await load();
  }

  async function removeMember(
    userId: string,
  ) {
    if (!groupId || !owner) return;

    setError("");

    const {
      error: removeError,
    } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    if (removeError) {
      setError(
        removeError.message,
      );
      return;
    }

    setMessage(
      "Member removed.",
    );

    await load(groupId);
  }

  const rankedMembers = [...members].sort(
    (a, b) => {
      const aScore =
        leaderboardAccuracy(a);
      const bScore =
        leaderboardAccuracy(b);

      if (
        aScore === null &&
        bScore === null
      ) {
        return 0;
      }

      if (aScore === null) return 1;
      if (bScore === null) return -1;

      return bScore - aScore;
    },
  );

  function toggleMeals(userId: string) {
    setExpandedMeals((current) => ({
      ...current,
      [userId]: !current[userId],
    }));
  }

  function toggleMemberDetails(userId: string) {
    setExpandedMembers((current) => ({
      ...current,
      [userId]: !current[userId],
    }));
  }

  function openEdit() {
    if (!selectedGroup) return;

    setEditGroupName(
      selectedGroup.name ?? "",
    );

    setEditJoinMode(
      selectedGroup.join_mode === "link"
        ? "link"
        : "invite_only",
    );

    setShowActions(false);
    setShowEditGroup(true);
  }

  return (
    <>
      {/* PAGE HEADER */}
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-moss-500">
            Together
          </p>

          <p className="mt-1 text-sm font-semibold text-[#858b95]">
            Track your team and stay on target.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError("");
            setShowCreateGroup(true);
          }}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-moss-600 px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-moss-700"
        >
          <Plus size={17} />
          <span className="hidden sm:inline">
            Create group
          </span>
        </button>
      </header>

      {/* MESSAGES */}
      {(message || error) && (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm font-semibold ${
            error
              ? "border-red-500/20 bg-red-500/10 text-red-200"
              : "border-moss-500/20 bg-moss-500/10 text-moss-100"
          }`}
        >
          {error || message}
        </div>
      )}

      {/* INVITATIONS */}
      {invitations.length > 0 && (
        <section className="mt-4 rounded-xl border border-gold-500/20 bg-gold-500/10 p-4">
          <p className="font-bold">
            Pending invitations
          </p>

          <div className="mt-3 space-y-2">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-wrap items-center gap-3 rounded-lg bg-white/5 p-3"
              >
                <p className="min-w-0 flex-1 text-sm">
                  <strong>
                    {invitation.groups?.name ??
                      "Group"}
                  </strong>{" "}
                  invited you to join.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void respond(
                      invitation.id,
                      true,
                    )
                  }
                  className="rounded-md bg-moss-600 px-3 py-2 text-xs font-bold text-white"
                >
                  Accept
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void respond(
                      invitation.id,
                      false,
                    )
                  }
                  className="rounded-md border border-white/10 px-3 py-2 text-xs font-bold"
                >
                  Decline
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* GROUP AREA */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[210px_minmax(0,1fr)]">
        {/* GROUP SIDEBAR */}
        <aside className="h-fit rounded-xl border border-white/10 bg-[#181b21] p-3">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-sm font-black">
              Your groups
            </p>

            <button
              type="button"
              onClick={() =>
                setShowCreateGroup(true)
              }
              className="grid size-8 place-items-center rounded-lg border border-dashed border-white/20 hover:bg-white/10"
              aria-label="Create group"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="mt-2 space-y-1">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => {
                  setGroupId(group.id);
                  setMessage("");
                  setError("");

                  void load(group.id);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-bold ${
                  group.id === groupId
                    ? "bg-moss-500/15 text-moss-100"
                    : "hover:bg-white/5"
                }`}
              >
                <span className="truncate">
                  {group.name}
                </span>

                <span className="ml-2 text-xs opacity-50">
                  {group.group_members?.length ??
                    0}
                </span>
              </button>
            ))}

            {!groups.length && (
              <div className="px-2 py-6 text-center text-xs text-[#858b95]">
                No groups yet.
              </div>
            )}
          </div>
        </aside>

        {/* CONTENT */}
        <main className="min-w-0">
          {!selectedGroup ? (
            <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
              <UsersRound
                size={30}
                className="mx-auto text-[#858b95]"
              />

              <p className="mt-3 font-bold">
                Create or join a group
              </p>
            </div>
          ) : (
            <>
              {/* GROUP HEADER */}
              <section className="rounded-xl border border-white/10 bg-[#181b21] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-black">
                      {selectedGroup.name}
                    </h2>

                    <button
                      type="button"
                      onClick={() =>
                        setShowMembers(true)
                      }
                      className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[#858b95] hover:text-white"
                    >
                      <UsersRound size={15} />

                      {selectedGroup.group_members
                        ?.length ??
                        members.length}{" "}
                      members
                    </button>
                  </div>

                  {/* ALL GROUP ACTIONS */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setShowActions(
                          (value) => !value,
                        )
                      }
                      className="grid size-9 place-items-center rounded-lg border border-white/10 hover:bg-white/10"
                      aria-label="Group options"
                    >
                      <MoreHorizontal
                        size={19}
                      />
                    </button>

                    {showActions && (
                      <div className="absolute right-0 top-11 z-40 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#181b21] p-1.5 shadow-2xl">
                        <button
                          type="button"
                          onClick={() => {
                            setShowActions(false);
                            setShowMembers(true);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-bold hover:bg-white/10"
                        >
                          <UsersRound size={15} />
                          View members
                        </button>

                        {owner && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowActions(false);
                              setShowInvite(true);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-bold hover:bg-white/10"
                          >
                            <UserPlus size={15} />
                            Invite member
                          </button>
                        )}

                        {selectedGroup.join_mode ===
                          "link" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                void copyJoinLink()
                              }
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-bold hover:bg-white/10"
                            >
                              <Copy size={15} />
                              Copy join link
                            </button>

                            {owner && (
                              <button
                                type="button"
                                onClick={() =>
                                  void regenerateJoinLink()
                                }
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-bold hover:bg-white/10"
                              >
                                <RefreshCw
                                  size={15}
                                />
                                Regenerate link
                              </button>
                            )}
                          </>
                        )}

                        {owner && (
                          <>
                            <button
                              type="button"
                              onClick={openEdit}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-bold hover:bg-white/10"
                            >
                              <Pencil size={15} />
                              Edit group
                            </button>

                            <div className="my-1 border-t border-white/10" />

                            <button
                              type="button"
                              onClick={() => {
                                setShowActions(
                                  false,
                                );
                                setShowDeleteGroup(
                                  true,
                                );
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-bold text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 size={15} />
                              Delete group
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </section>

              {/* LEADERBOARD */}
              <div className="mt-3">
                  <div className="mb-3 rounded-xl border border-white/10 bg-[#181b21] px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Trophy
                        size={16}
                        className="text-gold-400"
                      />

                      <div>
                        <p className="text-sm font-black">
                          Today&apos;s leaderboard
                        </p>

                        <p className="mt-0.5 text-[11px] leading-4 text-[#858b95]">
                          Members are ordered by how
                          closely they are tracking
                          their own shared calorie and
                          protein targets.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {rankedMembers.map(
                      (member, index) => {
                        const detailsOpen =
                          Boolean(
                            expandedMembers[
                              member.user_id
                            ],
                          );

                        const hasSharedDetails =
                          member.calories != null ||
                          member.protein != null ||
                          member.carbs != null ||
                          member.fat != null ||
                          member.weight_kg != null ||
                          member.meal_details?.length > 0;

                        return (
                          <article
                            key={member.user_id}
                            className={`rounded-lg border ${
                              index === 0
                                ? "border-gold-400/30 bg-gold-400/5"
                                : "border-white/10 bg-[#181b21]"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 p-3">
                              <div
                                className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-black ${
                                  index === 0
                                    ? "bg-gold-400 text-black"
                                    : "bg-white/10"
                                }`}
                              >
                                {index === 0
                                  ? "🥇"
                                  : index === 1
                                    ? "🥈"
                                    : index === 2
                                      ? "🥉"
                                      : index + 1}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="truncate text-sm font-black">
                                    {member.name}
                                  </p>

                                  <p className="shrink-0 text-[10px] text-[#858b95]">
                                    {index === 0
                                      ? "Top today"
                                      : `#${index + 1}`}
                                  </p>
                                </div>

                                {(() => {
                                  const progressValue =
                                    member.calories != null
                                      ? member.calories
                                      : member.protein;
                                  const progressTarget =
                                    member.calories != null
                                      ? member.calorie_target
                                      : member.protein_target;
                                  const progress = percentage(
                                    progressValue,
                                    progressTarget,
                                  );

                                  if (progress == null) return null;

                                  return (
                                    <div className="mt-1.5">
                                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                                        <div
                                          className="h-full rounded-full bg-moss-500 transition-all"
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  toggleMemberDetails(
                                    member.user_id,
                                  )
                                }
                                className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 text-[#858b95] transition hover:bg-white/10 hover:text-white"
                                aria-label={`${detailsOpen ? "Hide" : "Show"} ${member.name}'s shared details`}
                                aria-expanded={detailsOpen}
                              >
                                <ChevronDown
                                  size={16}
                                  className={`transition-transform ${
                                    detailsOpen
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                              </button>
                            </div>

                            {detailsOpen && (
                              <div className="border-t border-white/10 px-3 pb-3 pt-2.5">
                                {hasSharedDetails ? (
                                  <div className="grid gap-2">
                                    {member.calories != null && (
                                      <Metric
                                        label="Calories"
                                        value={member.calories}
                                        target={member.calorie_target}
                                        unit="kcal"
                                      />
                                    )}

                                    {member.protein != null && (
                                      <Metric
                                        label="Protein"
                                        value={member.protein}
                                        target={member.protein_target}
                                        unit="g"
                                      />
                                    )}

                                    {member.carbs != null && (
                                      <Metric
                                        label="Carbs"
                                        value={member.carbs}
                                        target={member.carb_target}
                                        unit="g"
                                      />
                                    )}

                                    {member.fat != null && (
                                      <Metric
                                        label="Fat"
                                        value={member.fat}
                                        target={member.fat_target}
                                        unit="g"
                                      />
                                    )}

                                    {member.weight_kg != null && (
                                      <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-[11px]">
                                        <span className="text-[#858b95]">
                                          Weight
                                        </span>
                                        <span className="font-bold">
                                          {member.weight_kg} kg
                                        </span>
                                      </div>
                                    )}

                                    {member.meal_details?.length > 0 && (
                                      <div className="overflow-hidden rounded-lg border border-white/10">
                                        <div className="px-3 py-2 text-[11px] font-bold">
                                          Shared meals
                                        </div>
                                        <div className="border-t border-white/10">
                                          {member.meal_details.map(
                                            (meal, mealIndex) => (
                                              <div
                                                key={`${member.user_id}-shared-${mealIndex}`}
                                                className="flex items-center justify-between gap-3 px-3 py-2 text-[11px]"
                                              >
                                                <div className="min-w-0">
                                                  <p className="truncate font-semibold">
                                                    {meal.name}
                                                  </p>
                                                  <p className="text-[#858b95]">
                                                    {meal.meal} · {meal.grams}g
                                                  </p>
                                                </div>
                                                <span className="shrink-0 text-[#858b95]">
                                                  {Math.round(meal.calories)} kcal
                                                </span>
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="py-1 text-[11px] text-[#858b95]">
                                    No additional details shared.
                                  </p>
                                )}
                              </div>
                            )}
                          </article>
                        );
                      },
                    )}
                  </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* MEMBERS */}
      {showMembers && (
        <Dialog
          title="Group members"
          description={`Members of ${
            selectedGroup?.name ?? "this group"
          }.`}
          onClose={() =>
            setShowMembers(false)
          }
        >
          <div className="mt-5 space-y-2">
            {selectedGroup?.group_members?.map(
              (groupMember: any) => {
                const member =
                  members.find(
                    (item) =>
                      item.user_id ===
                      groupMember.user_id,
                  );

                return (
                  <div
                    key={groupMember.user_id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 p-3"
                  >
                    <div className="grid size-9 place-items-center rounded-full bg-moss-600 text-sm font-black text-white">
                      {member?.name
                        ?.charAt(0)
                        ?.toUpperCase() ??
                        "M"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">
                        {member?.name ??
                          "Member"}
                      </p>

                      <p className="text-xs text-[#858b95]">
                        {member
                          ? "Shared progress available"
                          : "Private progress"}
                      </p>
                    </div>

                    {owner &&
                      groupMember.user_id !==
                        selectedGroup.created_by && (
                        <button
                          type="button"
                          onClick={() =>
                            void removeMember(
                              groupMember.user_id,
                            )
                          }
                          className="text-xs font-bold text-[#858b95] hover:text-red-300"
                        >
                          Remove
                        </button>
                      )}
                  </div>
                );
              },
            )}
          </div>
        </Dialog>
      )}

      {/* CREATE GROUP */}
      {showCreateGroup && (
        <Dialog
          title="Create a group"
          description="Choose how people can join."
          onClose={() => {
            if (!saving)
              setShowCreateGroup(false);
          }}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void createGroup();
            }}
          >
            <label
              htmlFor="new-group-name"
              className="mt-5 block text-sm font-bold"
            >
              Group name
            </label>

            <input
              id="new-group-name"
              autoFocus
              value={newGroupName}
              onChange={(event) =>
                setNewGroupName(
                  event.target.value,
                )
              }
              maxLength={80}
              placeholder="e.g. Gym Bros"
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 outline-none focus:border-moss-500"
            />

            <div className="mt-5 grid gap-2">
              <label className="rounded-lg border border-white/10 p-3">
                <input
                  type="radio"
                  checked={
                    joinMode ===
                    "invite_only"
                  }
                  onChange={() =>
                    setJoinMode(
                      "invite_only",
                    )
                  }
                  className="mr-2"
                />

                <span className="font-bold">
                  Invite only
                </span>
              </label>

              <label className="rounded-lg border border-white/10 p-3">
                <input
                  type="radio"
                  checked={
                    joinMode === "link"
                  }
                  onChange={() =>
                    setJoinMode("link")
                  }
                  className="mr-2"
                />

                <span className="font-bold">
                  Anyone with the link
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={
                saving ||
                !newGroupName.trim()
              }
              className="mt-4 w-full rounded-lg bg-moss-600 px-4 py-3 font-bold text-white disabled:opacity-40"
            >
              {saving
                ? "Creating…"
                : "Create group"}
            </button>
          </form>
        </Dialog>
      )}

      {/* INVITE */}
      {showInvite && (
        <Dialog
          title="Invite a member"
          description="Send an invitation to another MacroTrack user."
          onClose={() => {
            if (!saving)
              setShowInvite(false);
          }}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void invite();
            }}
          >
            <label
              htmlFor="invite-email"
              className="mt-5 block text-sm font-bold"
            >
              Email
            </label>

            <input
              id="invite-email"
              autoFocus
              type="email"
              value={inviteEmail}
              onChange={(event) =>
                setInviteEmail(
                  event.target.value,
                )
              }
              placeholder="friend@example.com"
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 outline-none focus:border-moss-500"
            />

            <button
              type="submit"
              disabled={
                saving ||
                !inviteEmail.trim()
              }
              className="mt-4 w-full rounded-lg bg-moss-600 px-4 py-3 font-bold text-white disabled:opacity-40"
            >
              {saving
                ? "Sending…"
                : "Send invitation"}
            </button>
          </form>
        </Dialog>
      )}

      {/* EDIT */}
      {showEditGroup && (
        <Dialog
          title="Edit group"
          description="Change the group name or join method."
          onClose={() => {
            if (!saving)
              setShowEditGroup(false);
          }}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void updateGroup();
            }}
          >
            <label
              htmlFor="edit-group-name"
              className="mt-5 block text-sm font-bold"
            >
              Group name
            </label>

            <input
              id="edit-group-name"
              autoFocus
              value={editGroupName}
              onChange={(event) =>
                setEditGroupName(
                  event.target.value,
                )
              }
              maxLength={80}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 outline-none focus:border-moss-500"
            />

            <div className="mt-5 grid gap-2">
              <label className="rounded-lg border border-white/10 p-3">
                <input
                  type="radio"
                  checked={
                    editJoinMode ===
                    "invite_only"
                  }
                  onChange={() =>
                    setEditJoinMode(
                      "invite_only",
                    )
                  }
                  className="mr-2"
                />

                <span className="font-bold">
                  Invite only
                </span>
              </label>

              <label className="rounded-lg border border-white/10 p-3">
                <input
                  type="radio"
                  checked={
                    editJoinMode === "link"
                  }
                  onChange={() =>
                    setEditJoinMode("link")
                  }
                  className="mr-2"
                />

                <span className="font-bold">
                  Anyone with the link
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={
                saving ||
                !editGroupName.trim()
              }
              className="mt-4 w-full rounded-lg bg-moss-600 px-4 py-3 font-bold text-white disabled:opacity-40"
            >
              {saving
                ? "Saving…"
                : "Save changes"}
            </button>
          </form>
        </Dialog>
      )}

      {/* DELETE */}
      {showDeleteGroup && (
        <Dialog
          title="Delete group?"
          description="Your personal nutrition history will not be deleted."
          onClose={() => {
            if (!saving)
              setShowDeleteGroup(false);
          }}
        >
          <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <p className="font-bold">
              {selectedGroup?.name}
            </p>

            <p className="mt-1 text-sm text-[#858b95]">
              This group and its memberships
              cannot be recovered.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                setShowDeleteGroup(false)
              }
              className="rounded-lg border border-white/10 px-4 py-3 font-bold"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() =>
                void deleteGroup()
              }
              disabled={saving}
              className="rounded-lg bg-red-600 px-4 py-3 font-bold text-white disabled:opacity-40"
            >
              {saving
                ? "Deleting…"
                : "Delete group"}
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}