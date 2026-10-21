"use client";
import { useState } from "react";
import {
  Bell,
  BellOff,
  CornerDownRight,
  Paperclip,
  Pencil,
  Pin,
  Send,
  Trash2,
  X,
} from "lucide-react";
import type { Locale } from "@/lib/crm-data";
import {
  currentRole,
  currentWorkspace,
  saveComment,
  updateComment,
} from "@/lib/records/model";
import { commitCrm } from "@/lib/records/store";
import type { Attachment, Comment, CrmState } from "@/lib/records/types";
import { buttonClass, Empty, inputClass } from "./ui";
export default function Comments({
  state,
  recordId,
  locale,
  notify,
}: {
  state: CrmState;
  recordId: string;
  locale: Locale;
  notify: (message: string) => void;
}) {
  const [body, setBody] = useState(""),
    [parentId, setParentId] = useState(""),
    [attachments, setAttachments] = useState<Attachment[]>([]),
    [editing, setEditing] = useState(""),
    [editText, setEditText] = useState("");
  const t = (en: string, fa: string) => (locale === "en" ? en : fa);
  const workspace = currentWorkspace(state);
  const writable = currentRole(state) !== "viewer";
  const comments = state.comments.filter(
    (c) => c.workspaceId === state.activeWorkspaceId && c.recordId === recordId,
  );
  const subscribed = (state.subscriptions[recordId] ?? []).includes(
    state.currentMemberId,
  );
  function action(
    id: string,
    kind: "delete" | "pin" | "react" | "edit",
    value = "",
  ) {
    try {
      commitCrm((s) => updateComment(s, id, kind, value));
    } catch (e) {
      notify((e as Error).message);
    }
  }
  async function attach(files: FileList | null) {
    if (!files) return;
    try {
      const additions: Attachment[] = [];
      for (const file of [...files]) {
        if (
          file.size > 512000 ||
          ![
            "image/png",
            "image/jpeg",
            "application/pdf",
            "text/plain",
          ].includes(file.type)
        )
          throw Error(
            t(
              "Use PNG, JPG, PDF or text under 500 KB.",
              "از تصویر، پی‌دی‌اف یا متن کوچک‌تر از ۵۰۰ کیلوبایت استفاده کنید.",
            ),
          );
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        additions.push({
          id: crypto.randomUUID(),
          name: file.name,
          mime: file.type,
          size: file.size,
          dataUrl,
        });
      }
      setAttachments([...attachments, ...additions].slice(0, 5));
    } catch (e) {
      notify((e as Error).message);
    }
  }
  function send() {
    try {
      commitCrm((s) =>
        saveComment(s, { recordId, parentId, body, attachments }),
      );
      setBody("");
      setParentId("");
      setAttachments([]);
    } catch (e) {
      notify((e as Error).message);
    }
  }
  function thread(comment: Comment, depth = 0) {
    const author = workspace.members.find((m) => m.id === comment.authorId);
    const children = comments.filter((c) => c.parentId === comment.id);
    const own =
      comment.authorId === state.currentMemberId ||
      ["owner", "admin"].includes(currentRole(state));
    return (
      <article
        key={comment.id}
        className={`min-w-0 ${depth ? "border-s-2 border-[#e0d4ea] ps-3" : "rounded-2xl border border-white bg-white/65 p-4"}`}
      >
        <header className="flex flex-wrap items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-[#e8dff1] text-xs font-bold text-[#8c729d]">
            {author?.name.slice(0, 1) ?? "?"}
          </span>
          <strong className="text-sm font-semibold text-[#5d4c6e]">
            {author?.name ?? t("Former member", "عضو سابق")}
          </strong>
          {comment.pinned && <Pin size={12} className="text-[#a08ab1]" />}
          <time className="ms-auto text-[11px] text-[#ad9cb7]">
            {new Date(comment.createdAt).toLocaleDateString(
              locale === "fa" ? "fa-IR" : "en-US",
              { month: "short", day: "numeric" },
            )}
            {comment.editedAt && t(" · edited", " · ویرایش‌شده")}
          </time>
        </header>
        {editing === comment.id ? (
          <div className="my-3">
            <textarea
              className={inputClass}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <button
              className={buttonClass}
              onClick={() => {
                action(comment.id, "edit", editText);
                setEditing("");
              }}
            >
              {t("Save", "ذخیره")}
            </button>
          </div>
        ) : (
          <p className="my-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#7c6b89]">
            {comment.body.split(/(@[\p{L}]+)/u).map((part, i) =>
              part.startsWith("@") ? (
                <span
                  key={i}
                  className="rounded bg-[#e4d7ef] px-1 text-[#8a64a5]"
                >
                  {part}
                </span>
              ) : (
                part
              ),
            )}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {comment.attachments.map((file) => (
            <a
              key={file.id}
              href={file.dataUrl}
              download={file.name}
              className="flex max-w-full items-center gap-1 rounded-lg border border-[#e4dbea] px-2 py-1 text-xs text-[#957fa6]"
            >
              <Paperclip size={12} />
              <span className="truncate">{file.name}</span>
            </a>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1">
          {["👍", "❤️", "🎉", "👀", "✅", "🙏"].map((emoji) => (
            <button
              key={emoji}
              disabled={!writable}
              aria-label={`${emoji} ${t("reaction", "واکنش")}`}
              aria-pressed={(comment.reactions[emoji] ?? []).includes(
                state.currentMemberId,
              )}
              className={`rounded-lg px-1.5 py-1 text-xs ${(comment.reactions[emoji] ?? []).includes(state.currentMemberId) ? "bg-[#dfcfee]" : "hover:bg-[#eee6f5]"}`}
              onClick={() => action(comment.id, "react", emoji)}
            >
              {emoji} {comment.reactions[emoji]?.length || ""}
            </button>
          ))}
          <button
            disabled={!writable || depth >= 4}
            className="ms-auto p-1.5 text-[#a390b1]"
            onClick={() => setParentId(comment.id)}
            aria-label={t("Reply to comment", "پاسخ به نظر")}
          >
            <CornerDownRight size={14} />
          </button>
          <button
            disabled={!writable}
            className="p-1.5 text-[#a390b1]"
            onClick={() => action(comment.id, "pin")}
            aria-label={t("Pin comment", "سنجاق نظر")}
          >
            <Pin size={13} />
          </button>
          {own && (
            <>
              <button
                disabled={!writable}
                className="p-1.5 text-[#a390b1]"
                onClick={() => {
                  setEditing(comment.id);
                  setEditText(comment.body);
                }}
                aria-label={t("Edit comment", "ویرایش نظر")}
              >
                <Pencil size={13} />
              </button>
              <button
                disabled={!writable}
                className="p-1.5 text-[#a390b1]"
                onClick={() => action(comment.id, "delete")}
                aria-label={t("Delete comment", "حذف نظر")}
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
        {children.length > 0 && (
          <div className="mt-3 space-y-3">
            {children.map((child) => thread(child, depth + 1))}
          </div>
        )}
      </article>
    );
  }
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold">
          {t("A conversation around the work", "گفت‌وگو در کنار کارها")}
        </h3>
        <button
          className={buttonClass}
          onClick={() =>
            commitCrm((s) => ({
              ...s,
              subscriptions: {
                ...s.subscriptions,
                [recordId]: subscribed
                  ? (s.subscriptions[recordId] ?? []).filter(
                      (id) => id !== s.currentMemberId,
                    )
                  : [...(s.subscriptions[recordId] ?? []), s.currentMemberId],
              },
            }))
          }
        >
          {subscribed ? <BellOff size={14} /> : <Bell size={14} />}
          <span className="hidden sm:inline">
            {subscribed
              ? t("Following", "دنبال می‌کنید")
              : t("Follow", "دنبال کردن")}
          </span>
        </button>
      </div>
      <div className="space-y-3">
        {comments
          .filter((c) => !c.parentId)
          .sort(
            (a, b) =>
              Number(b.pinned) - Number(a.pinned) ||
              a.createdAt.localeCompare(b.createdAt),
          )
          .map((c) => thread(c))}
      </div>
      {!comments.length && (
        <Empty
          title={t("Start the conversation", "گفت‌وگو را شروع کنید")}
          description={t(
            "Mention a teammate or add an attachment.",
            "یکی از اعضای تیم را منشن کنید یا فایل پیوست کنید.",
          )}
        />
      )}
      <form
        className="mt-4 rounded-2xl border border-[#ddd0e8] bg-[#eee6f5] p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        {parentId && (
          <div className="mb-2 flex items-center justify-between text-xs text-[#9a7dad]">
            {t("Replying to a comment", "در حال پاسخ به نظر")}
            <button type="button" onClick={() => setParentId("")}>
              <X size={13} />
            </button>
          </div>
        )}
        <textarea
          disabled={!writable}
          aria-label={t("Write a comment", "نوشتن نظر")}
          placeholder={t(
            "Share an update. Use @ to mention someone…",
            "یک خبر بنویسید. برای منشن از @ استفاده کنید…",
          )}
          rows={3}
          className="w-full resize-y rounded-xl bg-white/80 p-3 text-sm outline-none placeholder:text-[#b3a0bf]"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        {body.match(/@[\p{L}]*$/u) && (
          <div className="my-2 flex flex-wrap gap-1">
            {workspace.members.map((member) => (
              <button
                type="button"
                key={member.id}
                className="rounded-lg bg-white px-2 py-1 text-xs text-[#8a6c9c]"
                onClick={() =>
                  setBody(
                    body.replace(
                      /@[\p{L}]*$/u,
                      `@${member.name.split(" ")[0]} `,
                    ),
                  )
                }
              >
                @{member.name.split(" ")[0]}
              </button>
            ))}
          </div>
        )}
        <div className="my-2 flex flex-wrap gap-1">
          {attachments.map((file) => (
            <button
              type="button"
              key={file.id}
              onClick={() =>
                setAttachments(attachments.filter((f) => f.id !== file.id))
              }
              className="flex items-center gap-1 rounded bg-white px-2 py-1 text-xs text-[#9b85a9]"
            >
              {file.name}
              <X size={11} />
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <label
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-[#9a7ead] ${writable ? "cursor-pointer" : "opacity-40"}`}
          >
            <Paperclip size={16} />
            {t("Attach", "پیوست")}
            <input
              disabled={!writable}
              type="file"
              multiple
              accept="image/png,image/jpeg,application/pdf,text/plain"
              className="sr-only"
              aria-label={t("Attach files", "پیوست فایل")}
              onChange={(e) => attach(e.target.files)}
            />
          </label>
          <button
            disabled={!writable || (!body.trim() && !attachments.length)}
            className="flex items-center gap-2 rounded-xl bg-[#a58cbd] px-3 py-2 text-sm font-semibold text-white"
          >
            <Send size={14} />
            {t("Post", "ارسال")}
          </button>
        </div>
      </form>
    </section>
  );
}
