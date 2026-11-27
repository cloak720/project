import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Mail, Search, Send } from "lucide-react";
import api, { errorMessage, getList } from "../../lib/api";
import { matches } from "../../lib/format";
import { useDocumentTitle, useResource } from "../../lib/hooks";
import { useToast } from "../../context/AppContext";
import { useShell } from "../../components/shell/AppShell";
import { LogoMark } from "../../components/art/Logo";
import { Alert, Avatar, EmptyState, Kbd, PageHeader, SkeletonRows, Tabs } from "../../components/ui";

const FILTERS = [
  { id: "open", label: "Needs reply", test: (m) => !m.reply?.trim() },
  { id: "done", label: "Answered", test: (m) => !!m.reply?.trim() },
  { id: "all", label: "All", test: () => true },
];

const senderOf = (m) => {
  const [firstName = "", lastName = ""] = (m.name || m.email || "?").split(" ");
  return { firstName, lastName, id: m.email };
};

const AdminInbox = () => {
  useDocumentTitle("Inbox");
  const toast = useToast();
  const shell = useShell();
  const [params, setParams] = useSearchParams();
  const { data: messages, error, loading, setData } = useResource(() => getList("/contact"));
  const [filter, setFilter] = useState("open");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const selectedId = params.get("highlight");

  const list = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter);
    return (messages || []).filter(f.test).filter((m) => matches(query, m.subject, m.message, m.name, m.email)).sort((a, b) => b.id - a.id);
  }, [messages, filter, query]);

  const selected = (messages || []).find((m) => String(m.id) === selectedId);

  // Opening a link to an answered message should show it, not hide it behind the "Needs reply" tab.
  useEffect(() => {
    if (selected && selected.reply?.trim() && filter === "open") setFilter("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  useEffect(() => {
    setDraft(selected?.reply || "");
  }, [selected?.id, selected?.reply]);

  const open = (m) => setParams(m ? { highlight: String(m.id) } : {}, { replace: true });

  const send = async () => {
    const text = draft.trim();
    if (!selected || !text || sending) return;
    setSending(true);
    try {
      await api.put(`/contact/${selected.id}/reply`, { reply: text });
      setData((all) => all.map((m) => (m.id === selected.id ? { ...m, reply: text } : m)));
      toast(`Reply sent to ${selected.name || selected.email}.`);
      shell.refresh();
      // Move on to the next message that still needs a reply.
      const next = (messages || []).filter((m) => m.id !== selected.id && !m.reply?.trim()).sort((a, b) => b.id - a.id)[0];
      if (filter === "open") open(next || null);
    } catch (err) {
      toast(errorMessage(err, "Couldn't send the reply."), { tone: "error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Support" title="Inbox" subtitle="Messages from residents and volunteers. Replies appear in their notifications." />
      <Alert>{error}</Alert>
      {loading && !messages ? (
        <SkeletonRows rows={5} />
      ) : messages ? (
        <div className={`inbox ${selected ? "has-selection" : ""}`}>
          <section className="inbox__list card" aria-label="Messages">
            <div className="inbox__tools">
              <Tabs label="Filter" tabs={FILTERS.map((f) => ({ id: f.id, label: f.label, count: messages.filter(f.test).length }))} active={filter} onChange={setFilter} />
              <label className="search">
                <Search size={15} aria-hidden="true" />
                <span className="sr-only">Search messages</span>
                <input className="input" data-page-search placeholder="Search messages" value={query} onChange={(e) => setQuery(e.target.value)} />
                <kbd>/</kbd>
              </label>
            </div>
            {list.length === 0 ? (
              <EmptyState art={filter === "open" ? "check" : "message"} title={filter === "open" ? "Inbox zero" : "No messages"} compact>
                {filter === "open" ? "Every message has a reply." : "Nothing matches."}
              </EmptyState>
            ) : (
              <ul className="inbox__items">
                {list.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      className={`inbox__item ${String(m.id) === selectedId ? "is-active" : ""}`}
                      onClick={() => open(m)}
                      aria-current={String(m.id) === selectedId ? "true" : undefined}
                    >
                      <Avatar person={senderOf(m)} size="sm" />
                      <span className="inbox__item-text">
                        <span className="row row--between" style={{ flexWrap: "nowrap" }}>
                          <strong className="truncate">{m.name || m.email}</strong>
                          {!m.reply?.trim() && <span className="dot dot--accent" aria-label="Needs reply" />}
                        </span>
                        <span className="truncate small">{m.subject}</span>
                        <span className="truncate small muted">{m.message}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="inbox__detail card" aria-label="Conversation">
            {!selected ? (
              <EmptyState art="message" title="Select a message" compact>
                Pick a conversation on the left to read and reply.
              </EmptyState>
            ) : (
              <>
                <header className="inbox__head">
                  <button type="button" className="btn btn--ghost btn--sm inbox__back" onClick={() => open(null)}>
                    <ArrowLeft size={14} /> All messages
                  </button>
                  <h2>{selected.subject}</h2>
                  <a href={`mailto:${selected.email}`} className="small row" style={{ gap: 6 }}>
                    <Mail size={13} aria-hidden="true" /> {selected.email}
                  </a>
                </header>
                <div className="inbox__thread">
                  <div className="bubble">
                    <Avatar person={senderOf(selected)} size="sm" />
                    <div>
                      <span className="bubble__from">{selected.name || selected.email}</span>
                      <p>{selected.message}</p>
                    </div>
                  </div>
                  {selected.reply?.trim() && (
                    <div className="bubble bubble--team">
                      <LogoMark size={24} />
                      <div>
                        <span className="bubble__from">Your reply</span>
                        <p>{selected.reply}</p>
                      </div>
                    </div>
                  )}
                </div>
                <form
                  className="inbox__composer"
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                >
                  <label htmlFor="reply" className="sr-only">
                    Reply
                  </label>
                  <textarea
                    id="reply"
                    className="input"
                    rows={4}
                    maxLength={1000}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder={`Reply to ${selected.name || selected.email}…`}
                  />
                  <div className="row row--between">
                    <span className="muted small row">
                      <Kbd keys={["mod", "Enter"]} /> to send
                    </span>
                    <button type="submit" className={`btn btn--primary btn--sm ${sending ? "is-loading" : ""}`} disabled={sending || !draft.trim()}>
                      <Send size={13} /> {selected.reply?.trim() ? "Update reply" : "Send reply"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
};

export default AdminInbox;
