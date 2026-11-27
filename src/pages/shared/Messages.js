import React, { useState } from "react";
import { Send } from "lucide-react";
import api, { errorMessage, getList } from "../../lib/api";
import { fullName } from "../../lib/format";
import { useDocumentTitle, useHighlight, useResource } from "../../lib/hooks";
import { useSession, useToast } from "../../context/AppContext";
import { LogoMark } from "../../components/art/Logo";
import { Alert, Avatar, EmptyState, Field, Kbd, PageHeader, SkeletonRows, fieldProps } from "../../components/ui";

const SUBJECT_MAX = 120;
const MESSAGE_MAX = 1000;

const Messages = () => {
  useDocumentTitle("Messages");
  const session = useSession();
  const toast = useToast();
  const { data: history, error, loading, setData } = useResource(() => getList("/contact/mine"));
  const [form, setForm] = useState({ subject: "", message: "" });
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const highlight = useHighlight(!!history);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e?.preventDefault();
    if (sending) return;
    if (!form.subject.trim() || !form.message.trim()) {
      setFormError("Add a subject and a message.");
      return;
    }
    setFormError("");
    setSending(true);
    try {
      const payload = { name: fullName(session, ""), email: session.email, subject: form.subject.trim(), message: form.message.trim() };
      const { data } = await api.post("/contact", payload);
      setData((list) => [...(list || []), data && typeof data === "object" ? data : { ...payload, id: Date.now(), reply: null }]);
      setForm({ subject: "", message: "" });
      toast("Message sent. We'll reply here and in your notifications.");
    } catch (err) {
      setFormError(errorMessage(err, "Couldn't send your message."));
    } finally {
      setSending(false);
    }
  };

  const threads = [...(history || [])].reverse();

  return (
    <>
      <PageHeader title="Messages" subtitle="Questions, problems or ideas for the NeighborAid team. We read every message." />
      <div className="composer">
        <section aria-labelledby="threads-heading">
          <h2 id="threads-heading" className="sr-only">
            Your conversations
          </h2>
          <Alert>{error}</Alert>
          {loading && !history ? (
            <SkeletonRows rows={3} />
          ) : threads.length === 0 ? (
            <EmptyState art="message" title="No conversations yet">
              Messages you send and our replies will appear here.
            </EmptyState>
          ) : (
            <ul className="threads">
              {threads.map((m) => (
                <li key={m.id} id={`item-${m.id}`} className={`thread ${String(m.id) === highlight ? "is-highlighted" : ""}`}>
                  <div className="thread__head">
                    <strong>{m.subject}</strong>
                    {m.reply ? (
                      <span className="badge badge--success">
                        <span className="badge__dot" /> Answered
                      </span>
                    ) : (
                      <span className="badge">
                        <span className="badge__dot" /> Awaiting reply
                      </span>
                    )}
                  </div>
                  <div className="bubble bubble--me">
                    <Avatar person={{ ...session, id: session.userId }} size="sm" />
                    <p>{m.message}</p>
                  </div>
                  {m.reply && (
                    <div className="bubble bubble--team">
                      <LogoMark size={24} />
                      <div>
                        <span className="bubble__from">NeighborAid team</span>
                        <p>{m.reply}</p>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <form className="card card--pad form composer__preview" onSubmit={submit} noValidate>
          <div>
            <h2 className="card__title">New message</h2>
            <p className="muted small" style={{ marginTop: 4 }}>
              Replies go to <strong>{session.email || "your account"}</strong>.
            </p>
          </div>
          <Alert>{formError}</Alert>
          <Field label="Subject" htmlFor="subject">
            <input {...fieldProps("subject")} value={form.subject} onChange={set} maxLength={SUBJECT_MAX} placeholder="What's it about?" />
          </Field>
          <Field label="Message" htmlFor="message" aside={<span className="field__hint mono">{form.message.length}/{MESSAGE_MAX}</span>}>
            <textarea
              {...fieldProps("message")}
              value={form.message}
              onChange={set}
              rows={6}
              maxLength={MESSAGE_MAX}
              placeholder="Tell us more…"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
              }}
            />
          </Field>
          <div className="form-actions">
            <span className="muted small row">
              <Kbd keys={["mod", "Enter"]} /> to send
            </span>
            <button type="submit" className={`btn btn--primary ${sending ? "is-loading" : ""}`} disabled={sending}>
              <Send size={14} /> Send
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Messages;
