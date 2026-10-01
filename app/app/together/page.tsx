/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Flame,
  Plus,
  Shield,
  Link2,
  Copy,
  RefreshCw,
  MoreHorizontal,
  Pencil,
  Trash2,
  Trophy,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { createClient } from "@/lib/supabase/client";
import { calculateGoalProgress } from "@/lib/nutrition/calculations";

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
  description: string;
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-2xl border border-[#e1e4e8] bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#181b21]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black">{title}</h2>
            <p className="mt-1 text-sm text-[#858b95]">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-[#858b95] hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export default function TogetherPage() {
  const supabase = useMemo(() => createClient(), []);

  const [groups, setGroups] = useState<any[]>([]);
  const [groupId, setGroupId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [owner, setOwner] = useState(false);

  const [newGroupName, setNewGroupName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showGroupActions, setShowGroupActions] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [showDeleteGroup, setShowDeleteGroup] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const [editGroupName, setEditGroupName] = useState("");
  const [editJoinMode, setEditJoinMode] =
    useState<"invite_only" | "link">("invite_only");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [joinMode, setJoinMode] =
    useState<"invite_only" | "link">("invite_only");

  const [joinLink, setJoinLink] = useState("");
  const [invitations, setInvitations] = useState<any[]>([]);

  const [day] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://macrotrack-ashy.vercel.app";

  async function load(preferredGroupId?: string) {
    setError("");

    const { data: userData } =
      await supabase.auth.getUser();

    const userId = userData.user?.id;

    const {
      data: g,
      error: groupsError,
    } = await supabase
      .from("groups")
      .select(
        "id,name,created_by,join_mode,join_token,group_members(user_id,role)",
      )
      .order("created_at", {
        ascending: false,
      });

    if (groupsError) {
      setError(groupsError.message);
      return;
    }

    const rows = g ?? [];

    setGroups(rows);

    const selected =
      rows.find(
        (x) =>
          x.id ===
          (preferredGroupId ?? groupId),
      ) ?? rows[0];

    if (selected) {
      setGroupId(selected.id);

      setJoinLink(
        selected.join_mode === "link" &&
          selected.join_token
          ? `${SITE_URL}/join/${selected.join_token}`
          : "",
      );

      setOwner(
        selected.created_by === userId,
      );

      const {
        data: p,
        error: progressError,
      } = await supabase.rpc(
        "group_shared_progress_v2",
        {
          target_group: selected.id,
          selected_day: day,
        },
      );

      if (progressError) {
        setError(progressError.message);
        setMembers([]);
      } else {
        setMembers(
          (Array.isArray(p)
            ? p
            : []) as Member[],
        );
      }
    } else {
      setGroupId("");
      setJoinLink("");
      setOwner(false);
      setMembers([]);
    }

    const {
      data: i,
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

    setInvitations(i ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createGroup() {
    const name = newGroupName.trim();

    if (!name) {
      setError("Give your group a name first.");
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
      `"${name}" created. You're the owner.`,
    );

    await load(data);
  }

  const selectedGroup = groups.find(
    (g) => g.id === groupId,
  );

  function openEditGroup() {
    if (!selectedGroup || !owner) return;

    setEditGroupName(
      selectedGroup.name ?? "",
    );

    setEditJoinMode(
      selectedGroup.join_mode === "link"
        ? "link"
        : "invite_only",
    );

    setShowGroupActions(false);
    setError("");
    setMessage("");
    setShowEditGroup(true);
  }

  async function updateGroup() {
    const name = editGroupName.trim();

    if (!groupId || !owner || !name) {
      setError("Give your group a name first.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

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
    setMessage(`"${name}" updated.`);

    await load(groupId);
  }

  async function deleteGroup() {
    if (!groupId || !owner) return;

    setSaving(true);
    setError("");
    setMessage("");

    const groupName =
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
    setShowGroupActions(false);

    setMessage(
      `"${groupName}" deleted.`,
    );

    await load();
  }

  async function copyJoinLink() {
    if (!joinLink) return;

    await navigator.clipboard.writeText(
      joinLink,
    );

    setMessage(
      "Join link copied to your clipboard.",
    );
  }

  async function regenerateJoinLink() {
    if (!groupId || !owner) return;

    setSaving(true);
    setError("");

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

    const token = String(data || "");

    const nextLink = token
      ? `${SITE_URL}/join/${token}`
      : "";

    setJoinLink(nextLink);

    setMessage(
      "Join link regenerated. The old link no longer works.",
    );

    await load(groupId);
  }

  async function invite() {
    const email =
      inviteEmail.trim().toLowerCase();

    if (!email || !groupId) return;

    setSaving(true);
    setError("");
    setMessage("");

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
      `Invitation sent to ${email}. They must accept it before joining.`,
    );

    await load();
  }

  async function respond(
    id: string,
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
        invitation_id: id,
      },
    );

    if (responseError) {
      setError(responseError.message);
    } else {
      setMessage(
        accept
          ? "Invitation accepted."
          : "Invitation declined.",
      );
    }

    await load();
  }

  async function removeMember(userId: string) {
    if (!groupId) return;

    setError("");

    const {
      error: removeError,
    } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    if (removeError) {
      setError(removeError.message);
    } else {
      setMessage(
        "Member removed from the group.",
      );
    }

    await load(groupId);
  }

  const ranked = [...members].sort(
    (a, b) => {
      const ap =
        Math.round(
          (
            calculateGoalProgress(
              Number(a.calories || 0),
              Number(
                a.calorie_target || 0,
              ),
            ) +
            calculateGoalProgress(
              Number(a.protein || 0),
              Number(
                a.protein_target || 0,
              ),
            )
          ) / 2,
        );

      const bp =
        Math.round(
          (
            calculateGoalProgress(
              Number(b.calories || 0),
              Number(
                b.calorie_target || 0,
              ),
            ) +
            calculateGoalProgress(
              Number(b.protein || 0),
              Number(
                b.protein_target || 0,
              ),
            )
          ) / 2,
        );

      return bp - ap;
    },
  );

  const topScore = ranked.length
    ? Math.round(
        (
          calculateGoalProgress(
            Number(
              ranked[0]?.calories || 0,
            ),
            Number(
              ranked[0]
                ?.calorie_target || 0,
            ),
          ) +
          calculateGoalProgress(
            Number(
              ranked[0]?.protein || 0,
            ),
            Number(
              ranked[0]
                ?.protein_target || 0,
            ),
          )
        ) / 2,
      )
    : 0;

  return (
    <>
      <SectionHeading
        eyebrow="Together"
        title="Track together"
        description="Choose invite-only or shareable-link groups. Nutrition data stays private according to each member's sharing settings."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setError("");
                setShowCreateGroup(true);
              }}
              className="flex items-center gap-2 rounded-lg border border-moss-600 px-4 py-3 text-sm font-bold text-moss-700 hover:bg-moss-50 dark:text-moss-100 dark:hover:bg-moss-500/10"
            >
              <Plus size={17} />
              Create group
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setShowInvite(true);
              }}
              disabled={!groupId || !owner}
              className="flex items-center gap-2 rounded-lg bg-moss-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <UserPlus size={17} />
              Invite member
            </button>
          </div>
        }
      />

      {(message || error) && (
        <div
          className={`mt-5 rounded-lg border px-4 py-3 text-sm font-semibold ${
            error
              ? "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-200"
              : "border-moss-500/20 bg-moss-500/10 text-moss-800 dark:text-moss-100"
          }`}
        >
          {error || message}
        </div>
      )}

      {invitations.length > 0 && (
        <section className="mt-5 rounded-lg border border-gold-200 bg-gold-50 p-4 dark:border-gold-500/20 dark:bg-gold-500/10">
          <div className="flex items-center gap-2 font-bold">
            <Shield size={18} />
            Pending invitations
          </div>

          {invitations.map((i) => (
            <div
              key={i.id}
              className="mt-3 flex flex-wrap items-center gap-3 rounded-md bg-white p-3 dark:bg-white/5"
            >
              <div className="flex-1 text-sm">
                <strong>
                  {i.groups?.name ?? "Group"}
                </strong>

                <span className="ml-2 text-[#858b95]">
                  You were invited to join.
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  void respond(i.id, true)
                }
                className="flex items-center gap-1 rounded-md bg-moss-600 px-3 py-2 text-xs font-bold text-white"
              >
                <Check size={15} />
                Accept
              </button>

              <button
                type="button"
                onClick={() =>
                  void respond(i.id, false)
                }
                className="flex items-center gap-1 rounded-md border px-3 py-2 text-xs font-bold"
              >
                <X size={15} />
                Decline
              </button>
            </div>
          ))}
        </section>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-lg border border-[#e1e4e8] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#181b21]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">
              Your groups
            </h2>

            <button
              type="button"
              onClick={() =>
                setShowCreateGroup(true)
              }
              aria-label="Create group"
              className="grid size-8 place-items-center rounded-md border border-dashed hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="mt-3 space-y-1">
            {groups.map((g) => (
              <button
                type="button"
                key={g.id}
                onClick={() => {
                  setGroupId(g.id);

                  setJoinLink(
                    g.join_mode ===
                      "link" &&
                      g.join_token
                      ? `${SITE_URL}/join/${g.join_token}`
                      : "",
                  );

                  setMessage("");
                  setError("");

                  void load(g.id);
                }}
                className={`w-full rounded-md px-3 py-2.5 text-left text-sm font-bold ${
                  g.id === groupId
                    ? "bg-moss-50 text-moss-700 dark:bg-moss-500/15 dark:text-moss-100"
                    : "hover:bg-[#f3f4f6] dark:hover:bg-white/5"
                }`}
              >
                {g.name}

                <span className="ml-2 text-xs opacity-60">
                  {g.group_members?.length ??
                    0}
                </span>
              </button>
            ))}

            {!groups.length && (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm text-[#858b95]">
                  Create your first group to
                  start tracking together.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setShowCreateGroup(true)
                  }
                  className="mt-3 inline-flex items-center gap-2 rounded-md bg-moss-600 px-3 py-2 text-sm font-bold text-white"
                >
                  <Plus size={16} />
                  Create group
                </button>
              </div>
            )}
          </div>
        </aside>

        <main>
          <section className="rounded-xl bg-ink p-5 text-white shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#b8bcc5]">
                  {selectedGroup?.name ??
                    "No group selected"}
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight">
                  Today, together.
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* FIXED MEMBERS BUTTON */}
                <button
                  type="button"
                  onClick={() =>
                    setShowMembers(true)
                  }
                  className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-bold transition hover:bg-white/15"
                >
                  <UsersRound size={16} />

                  {selectedGroup?.group_members
                    ?.length ??
                    members.length}{" "}
                  members
                </button>

                {selectedGroup &&
                  owner && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setShowGroupActions(
                            (open) => !open,
                          )
                        }
                        aria-label="Group settings"
                        className="grid size-9 place-items-center rounded-md bg-white/10 hover:bg-white/15"
                      >
                        <MoreHorizontal
                          size={18}
                        />
                      </button>

                      {showGroupActions && (
                        <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-lg border border-white/10 bg-[#181b21] p-1 shadow-xl">
                          <button
                            type="button"
                            onClick={
                              openEditGroup
                            }
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-bold text-white hover:bg-white/10"
                          >
                            <Pencil size={15} />
                            Edit group
                          </button>

                          {selectedGroup?.join_mode ===
                            "link" &&
                            owner && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowGroupActions(
                                    false,
                                  );
                                  void regenerateJoinLink();
                                }}
                                disabled={
                                  saving
                                }
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-bold text-white hover:bg-white/10 disabled:opacity-50"
                              >
                                <RefreshCw
                                  size={15}
                                />
                                Regenerate join link
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={() => {
                              setShowGroupActions(
                                false,
                              );
                              setShowDeleteGroup(
                                true,
                              );
                              setError("");
                              setMessage("");
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-bold text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 size={15} />
                            Delete group
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                {selectedGroup?.join_mode ===
                  "link" &&
                  joinLink &&
                  owner && (
                    <button
                      type="button"
                      onClick={() =>
                        void copyJoinLink()
                      }
                      className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-bold hover:bg-white/15"
                    >
                      <Copy size={15} />
                      Copy join link
                    </button>
                  )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-white/10 p-4">
                <div className="flex items-center gap-2 text-sm text-[#cbd8cd]">
                  <Trophy size={16} />
                  Daily grind
                </div>

                <p className="mt-1 text-2xl font-black">
                  {topScore}%
                </p>

                <p className="text-xs text-[#b8bcc5]">
                  top goal completion
                </p>
              </div>

              <div className="rounded-lg bg-white/10 p-4">
                <div className="flex items-center gap-2 text-sm text-[#cbd8cd]">
                  <Flame size={16} />
                  Group rhythm
                </div>

                <p className="mt-1 text-2xl font-black">
                  {members.length
                    ? "Active"
                    : "—"}
                </p>

                <p className="text-xs text-[#b8bcc5]">
                  keep logging consistently
                </p>
              </div>

              <div className="rounded-lg bg-white/10 p-4">
                <div className="text-sm text-[#cbd8cd]">
                  Privacy first
                </div>

                <p className="mt-1 text-sm font-bold">
                  Targets stay personal
                </p>

                <p className="text-xs text-[#b8bcc5]">
                  only shared metrics appear
                </p>
              </div>
            </div>
          </section>

          <div className="mt-5 grid gap-3">
            {ranked.map((m, index) => {
              const cp =
                calculateGoalProgress(
                  Number(
                    m.calories || 0,
                  ),
                  Number(
                    m.calorie_target ||
                      0,
                  ),
                );

              const pp =
                calculateGoalProgress(
                  Number(
                    m.protein || 0,
                  ),
                  Number(
                    m.protein_target ||
                      0,
                  ),
                );

              const score = Math.round(
                (
                  Math.min(cp, 100) +
                  Math.min(pp, 100)
                ) / 2,
              );

              return (
                <article
                  key={m.user_id}
                  className="rounded-lg border border-[#e1e4e8] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#181b21]"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-moss-600 text-sm font-black text-white">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black">
                          {m.name}
                        </h3>

                        {index === 0 && (
                          <span className="rounded-full bg-gold-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-gold-700">
                            Top today
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-[#858b95]">
                        Goal completion ·{" "}
                        {score}%
                      </p>
                    </div>

                    {owner &&
                      index > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            void removeMember(
                              m.user_id,
                            )
                          }
                          className="text-xs font-bold text-[#858b95] hover:text-red-600"
                        >
                          Remove
                        </button>
                      )}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {m.calorie_target !=
                      null && (
                      <div>
                        <div className="flex justify-between text-xs font-bold">
                          <span>
                            Calories
                          </span>

                          <span>
                            {m.calories ??
                              0}{" "}
                            /{" "}
                            {
                              m.calorie_target
                            }{" "}
                            kcal
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e4e6ea]">
                          <div
                            className="h-full rounded-full bg-moss-600"
                            style={{
                              width: `${Math.min(
                                cp,
                                100,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {m.protein_target !=
                      null && (
                      <div>
                        <div className="flex justify-between text-xs font-bold">
                          <span>
                            Protein
                          </span>

                          <span>
                            {m.protein ??
                              0}{" "}
                            /{" "}
                            {
                              m.protein_target
                            }{" "}
                            g
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e4e6ea]">
                          <div
                            className="h-full rounded-full bg-gold-400"
                            style={{
                              width: `${Math.min(
                                pp,
                                100,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {m.carb_target !=
                      null && (
                      <div className="rounded-lg bg-[#f3f4f6] p-3 dark:bg-white/5">
                        <div className="flex justify-between text-xs font-bold">
                          <span>
                            Carbs
                          </span>

                          <span>
                            {m.carbs ??
                              0}{" "}
                            /{" "}
                            {
                              m.carb_target
                            }{" "}
                            g
                          </span>
                        </div>

                        <div className="mt-1 text-xs text-[#858b95]">
                          Shared today
                        </div>
                      </div>
                    )}

                    {m.fat_target !=
                      null && (
                      <div className="rounded-lg bg-[#f3f4f6] p-3 dark:bg-white/5">
                        <div className="flex justify-between text-xs font-bold">
                          <span>
                            Fat
                          </span>

                          <span>
                            {m.fat ??
                              0}{" "}
                            /{" "}
                            {
                              m.fat_target
                            }{" "}
                            g
                          </span>
                        </div>

                        <div className="mt-1 text-xs text-[#858b95]">
                          Shared today
                        </div>
                      </div>
                    )}
                  </div>

                  {m.weight_kg !=
                    null && (
                    <p className="mt-3 text-xs text-[#858b95]">
                      Weight shared:{" "}
                      {m.weight_kg} kg
                    </p>
                  )}

                  {m.meal_details?.length >
                    0 && (
                    <details className="mt-4 rounded-lg border border-[#e1e4e8] p-3 dark:border-white/10">
                      <summary className="cursor-pointer text-sm font-bold">
                        View shared meals
                      </summary>

                      <div className="mt-3 space-y-2">
                        {m.meal_details.map(
                          (
                            item,
                            itemIndex,
                          ) => (
                            <div
                              key={`${item.name}-${itemIndex}`}
                              className="flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-bold">
                                  {
                                    item.name
                                  }
                                </p>

                                <p className="text-[#858b95]">
                                  {
                                    item.meal
                                  }{" "}
                                  ·{" "}
                                  {
                                    item.grams
                                  }{" "}
                                  g
                                </p>
                              </div>

                              <span className="shrink-0 text-[#858b95]">
                                {
                                  item.calories
                                }{" "}
                                kcal ·{" "}
                                {
                                  item.protein
                                }
                                g P
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </details>
                  )}
                </article>
              );
            })}

            {!ranked.length && (
              <div className="rounded-lg border border-dashed p-10 text-center text-sm text-[#858b95]">
                Create a group or accept an
                invitation to start tracking
                together.
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MEMBERS MODAL */}
      {showMembers && (
        <Dialog
          title="Group members"
          description={`Members of ${selectedGroup?.name ?? "this group"}.`}
          onClose={() =>
            setShowMembers(false)
          }
        >
          <div className="mt-5 space-y-2">
            {members.length > 0 ? (
              members.map((member) => (
                <div
                  key={member.user_id}
                  className="rounded-xl border border-[#e1e4e8] p-4 dark:border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-full bg-moss-600 text-sm font-black text-white">
                      {member.name
                        ?.charAt(0)
                        ?.toUpperCase() ??
                        "M"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold">
                        {member.name}
                      </p>

                      <p className="text-xs text-[#858b95]">
                        {member.calories ??
                          0}{" "}
                        kcal ·{" "}
                        {member.protein ??
                          0}
                        g protein
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-[#f3f4f6] p-2 dark:bg-white/5">
                      <span className="text-[#858b95]">
                        Carbs
                      </span>
                      <p className="font-bold">
                        {member.carbs ??
                          0}{" "}
                        g
                      </p>
                    </div>

                    <div className="rounded-lg bg-[#f3f4f6] p-2 dark:bg-white/5">
                      <span className="text-[#858b95]">
                        Fat
                      </span>
                      <p className="font-bold">
                        {member.fat ??
                          0}{" "}
                        g
                      </p>
                    </div>

                    <div className="rounded-lg bg-[#f3f4f6] p-2 dark:bg-white/5">
                      <span className="text-[#858b95]">
                        Weight
                      </span>
                      <p className="font-bold">
                        {member.weight_kg !=
                        null
                          ? `${member.weight_kg} kg`
                          : "Private"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-[#f3f4f6] p-2 dark:bg-white/5">
                      <span className="text-[#858b95]">
                        Meals
                      </span>
                      <p className="font-bold">
                        {member.meal_details
                          ?.length ??
                          0}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-[#858b95]">
                No shared member data is
                available yet.
              </div>
            )}
          </div>

          {selectedGroup?.group_members
            ?.length >
            members.length && (
            <p className="mt-4 rounded-lg bg-gold-500/10 p-3 text-xs text-[#858b95]">
              Some group members haven't
              shared progress data. Their
              personal nutrition data remains
              private until their sharing
              settings allow it.
            </p>
          )}
        </Dialog>
      )}

      {showEditGroup &&
        selectedGroup && (
          <Dialog
            title="Edit group"
            description="Update the group name or change who can join. Existing members stay in the group."
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
                className="mt-5 block text-sm font-bold"
                htmlFor="edit-group-name"
              >
                Group name
              </label>

              <input
                id="edit-group-name"
                autoFocus
                value={editGroupName}
                onChange={(e) =>
                  setEditGroupName(
                    e.target.value,
                  )
                }
                maxLength={80}
                className="mt-2 w-full rounded-lg border border-[#e1e4e8] bg-white px-3 py-3 outline-none focus:border-moss-500 dark:border-white/10 dark:bg-white/5"
              />

              <fieldset className="mt-5">
                <legend className="text-sm font-bold">
                  Who can join?
                </legend>

                <div className="mt-2 grid gap-2">
                  <label
                    className={`cursor-pointer rounded-lg border p-3 ${
                      editJoinMode ===
                      "invite_only"
                        ? "border-moss-500 bg-moss-50 dark:bg-moss-500/10"
                        : "border-[#e1e4e8] dark:border-white/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name="edit-join-mode"
                      value="invite_only"
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

                    <span className="mt-1 block pl-5 text-xs text-[#858b95]">
                      Only people you invite
                      can join.
                    </span>
                  </label>

                  <label
                    className={`cursor-pointer rounded-lg border p-3 ${
                      editJoinMode === "link"
                        ? "border-moss-500 bg-moss-50 dark:bg-moss-500/10"
                        : "border-[#e1e4e8] dark:border-white/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name="edit-join-mode"
                      value="link"
                      checked={
                        editJoinMode ===
                        "link"
                      }
                      onChange={() =>
                        setEditJoinMode(
                          "link",
                        )
                      }
                      className="mr-2"
                    />

                    <span className="font-bold">
                      Anyone with the link
                    </span>

                    <span className="mt-1 block pl-5 text-xs text-[#858b95]">
                      Anyone with the private
                      link can join after
                      signing in.
                    </span>
                  </label>
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={
                  saving ||
                  !editGroupName.trim()
                }
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-moss-600 px-4 py-3 font-bold text-white disabled:opacity-40"
              >
                <Pencil size={16} />

                {saving
                  ? "Saving…"
                  : "Save changes"}
              </button>
            </form>
          </Dialog>
        )}

      {showDeleteGroup &&
        selectedGroup && (
          <Dialog
            title="Delete group?"
            description="This permanently removes the group, its memberships, invitations, and group activity. Your personal food and weight history will not be deleted."
            onClose={() => {
              if (!saving)
                setShowDeleteGroup(false);
            }}
          >
            <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm">
              <p className="font-bold">
                {selectedGroup.name}
              </p>

              <p className="mt-1 text-[#858b95]">
                This action cannot be undone.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setShowDeleteGroup(false)
                }
                disabled={saving}
                className="rounded-lg border px-4 py-3 font-bold disabled:opacity-40"
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

      {showCreateGroup && (
        <Dialog
          title="Create a group"
          description="Choose who can join. You can share a private link or keep the group invite-only."
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
              className="mt-5 block text-sm font-bold"
              htmlFor="group-name"
            >
              Group name
            </label>

            <input
              id="group-name"
              autoFocus
              value={newGroupName}
              onChange={(e) =>
                setNewGroupName(
                  e.target.value,
                )
              }
              placeholder="e.g. Gym Bros"
              maxLength={80}
              className="mt-2 w-full rounded-lg border border-[#e1e4e8] bg-white px-3 py-3 outline-none focus:border-moss-500 dark:border-white/10 dark:bg-white/5"
            />

            <fieldset className="mt-5">
              <legend className="text-sm font-bold">
                Who can join?
              </legend>

              <div className="mt-2 grid gap-2">
                <label
                  className={`cursor-pointer rounded-lg border p-3 ${
                    joinMode ===
                    "invite_only"
                      ? "border-moss-500 bg-moss-50 dark:bg-moss-500/10"
                      : "border-[#e1e4e8] dark:border-white/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="join-mode"
                    value="invite_only"
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

                  <span className="mt-1 block pl-5 text-xs text-[#858b95]">
                    Only people you invite
                    can join.
                  </span>
                </label>

                <label
                  className={`cursor-pointer rounded-lg border p-3 ${
                    joinMode === "link"
                      ? "border-moss-500 bg-moss-50 dark:bg-moss-500/10"
                      : "border-[#e1e4e8] dark:border-white/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="join-mode"
                    value="link"
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

                  <span className="mt-1 block pl-5 text-xs text-[#858b95]">
                    Anyone with the private
                    link can join after
                    signing in.
                  </span>
                </label>
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={
                saving ||
                !newGroupName.trim()
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-moss-600 px-4 py-3 font-bold text-white disabled:opacity-40"
            >
              <Plus size={17} />

              {saving
                ? "Creating…"
                : "Create group"}
            </button>
          </form>
        </Dialog>
      )}

      {showInvite && (
        <Dialog
          title="Invite a member"
          description="They must accept the invitation before they can see or join the group."
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
              className="mt-5 block text-sm font-bold"
              htmlFor="invite-email"
            >
              Email address
            </label>

            <input
              id="invite-email"
              autoFocus
              type="email"
              value={inviteEmail}
              onChange={(e) =>
                setInviteEmail(
                  e.target.value,
                )
              }
              placeholder="friend@example.com"
              className="mt-2 w-full rounded-lg border border-[#e1e4e8] bg-white px-3 py-3 outline-none focus:border-moss-500 dark:border-white/10 dark:bg-white/5"
            />

            <button
              type="submit"
              disabled={
                saving ||
                !inviteEmail.trim() ||
                !groupId ||
                !owner
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
    </>
  );
}