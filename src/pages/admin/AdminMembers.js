import React, { useMemo, useState } from "react";
import { Ban, RotateCcw, Search, Trash2, UserX } from "lucide-react";
import api, { errorMessage, getList } from "../../lib/api";
import { ROLES, ROLE_LABELS } from "../../lib/auth";
import { fullName, matches } from "../../lib/format";
import { useDocumentTitle, useHighlight, useResource } from "../../lib/hooks";
import { useConfirm, useSession, useToast } from "../../context/AppContext";
import { Alert, Avatar, EmptyState, PageHeader, SkeletonRows, Tabs } from "../../components/ui";

const ROLE_TONES = { [ROLES.ADMIN]: "accent", [ROLES.RESIDENT]: "info", [ROLES.VOLUNTEER]: "success" };

const FILTERS = [
  { id: "all", label: "All", test: () => true },
  { id: "residents", label: "Residents", test: (u) => u.role === ROLES.RESIDENT },
  { id: "volunteers", label: "Volunteers", test: (u) => u.role === ROLES.VOLUNTEER },
  { id: "admins", label: "Admins", test: (u) => u.role === ROLES.ADMIN },
  { id: "suspended", label: "Suspended", test: (u) => !!u.banned },
];

const AdminMembers = () => {
  useDocumentTitle("Members");
  const session = useSession();
  const toast = useToast();
  const confirm = useConfirm();
  const { data: users, error, loading, setData } = useResource(() => getList("/user/all"));
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(null);
  const highlight = useHighlight(!!users);

  const rows = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter);
    return (users || [])
      .filter(f.test)
      .filter((u) => matches(query, fullName(u, ""), u.email, u.phoneNo, u.houseNo))
      .sort((a, b) => a.role - b.role || fullName(a).localeCompare(fullName(b)));
  }, [users, filter, query]);

  const patch = (id, changes) => setData((list) => list.map((u) => (u.id === id ? { ...u, ...changes } : u)));

  // Suspending is reversible, so it happens instantly and rolls back if the server refuses.
  const setBanned = async (u, banned) => {
    patch(u.id, { banned });
    try {
      await api.put(`/user/${u.id}/${banned ? "ban" : "unban"}`);
      toast(banned ? `${fullName(u)} is suspended and can't log in.` : `${fullName(u)} can log in again.`, {
        action: { label: "Undo", onClick: () => setBanned(u, !banned) },
      });
    } catch (err) {
      patch(u.id, { banned: !banned });
      toast(errorMessage(err, "Couldn't update this account."), { tone: "error" });
    }
  };

  const remove = async (u) => {
    const ok = await confirm({
      title: `Delete ${fullName(u)}'s account?`,
      body:
        u.role === ROLES.VOLUNTEER
          ? "Their opportunity sign-ups are removed and any requests they had accepted go back on the board. This can't be undone."
          : "Their requests are removed with the account. This can't be undone. Consider suspending instead.",
      confirmLabel: "Delete account",
      icon: UserX,
    });
    if (!ok) return;
    setBusy(u.id);
    try {
      await api.delete(`/user/${u.id}`);
      setData((list) => list.filter((x) => x.id !== u.id));
      toast("Account deleted.");
    } catch (err) {
      toast(errorMessage(err, "Couldn't delete this account."), { tone: "error" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Moderation" title="Members" subtitle="Everyone with an account. Suspended members can't log in until you reinstate them." />
      <Alert>{error}</Alert>
      {loading && !users ? (
        <SkeletonRows rows={6} />
      ) : users ? (
        <>
          <div className="toolbar">
            <Tabs label="Filter members" tabs={FILTERS.map((f) => ({ id: f.id, label: f.label, count: users.filter(f.test).length }))} active={filter} onChange={setFilter} />
            <label className="search">
              <Search size={15} aria-hidden="true" />
              <span className="sr-only">Search members</span>
              <input className="input" data-page-search placeholder="Name, email or phone" value={query} onChange={(e) => setQuery(e.target.value)} />
              <kbd>/</kbd>
            </label>
          </div>
          {rows.length === 0 ? (
            <EmptyState art="users" title="No members match" compact>
              Try another filter or search.
            </EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table table--responsive">
                <thead>
                  <tr>
                    <th scope="col">Member</th>
                    <th scope="col">Role</th>
                    <th scope="col">Contact</th>
                    <th scope="col">House</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => {
                    const isSelf = String(u.id) === String(session.userId);
                    const manageable = u.role !== ROLES.ADMIN && !isSelf;
                    return (
                      <tr key={u.id} id={`item-${u.id}`} className={`${String(u.id) === highlight ? "is-highlighted" : ""} ${u.banned ? "is-muted" : ""}`}>
                        <td data-label="Member">
                          <span className="person">
                            <Avatar person={u} size="sm" />
                            <span className="person__text">
                              <span className="cell-main">
                                {fullName(u)} {isSelf && <span className="badge badge--outline">You</span>}
                              </span>
                              <span className="cell-sub">Age {u.age ?? "–"}</span>
                            </span>
                          </span>
                        </td>
                        <td data-label="Role">
                          <span className={`badge badge--${ROLE_TONES[u.role] || "outline"}`}>{ROLE_LABELS[u.role] ?? u.role}</span>
                        </td>
                        <td data-label="Contact">
                          <div>{u.email}</div>
                          <div className="cell-sub mono">{u.phoneNo}</div>
                        </td>
                        <td data-label="House">{u.houseNo || "–"}</td>
                        <td data-label="Status">
                          {u.banned ? (
                            <span className="badge badge--danger">
                              <span className="badge__dot" /> Suspended
                            </span>
                          ) : (
                            <span className="badge badge--success">
                              <span className="badge__dot" /> Active
                            </span>
                          )}
                        </td>
                        <td className="cell-actions">
                          {manageable && (
                            <span className="row">
                              <button type="button" className="btn btn--sm" onClick={() => setBanned(u, !u.banned)}>
                                {u.banned ? <RotateCcw size={13} /> : <Ban size={13} />} {u.banned ? "Reinstate" : "Suspend"}
                              </button>
                              <button
                                type="button"
                                className="btn btn--sm btn--danger btn--icon"
                                onClick={() => remove(u)}
                                disabled={busy === u.id}
                                aria-label={`Delete ${fullName(u)}`}
                                title="Delete account"
                              >
                                <Trash2 size={13} />
                              </button>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </>
  );
};

export default AdminMembers;
