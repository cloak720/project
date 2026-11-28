import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, HandHeart, Lock, PlusCircle, ShieldCheck, Sparkles, Star } from "lucide-react";
import { getList } from "../lib/api";
import { ROLES, homePathFor } from "../lib/auth";
import { formatDate, greeting, normStatus, plural, relativeDays } from "../lib/format";
import { useSession } from "../context/AppContext";
import { helpersFrom, useMyRequests, useMyReviews } from "../hooks/useResident";
import useTitle from "../hooks/useTitle";
import { HeroScene, NoticeboardArt } from "../components/art/Scenes";
import CategoryArt from "../components/art/Spots";
import Stamp from "../components/art/Stamp";
import RequestCard from "../components/RequestCard";
import { Alert, EmptyState, Note, NoteAction, SectionHead, SkeletonGrid, fadeUp, listItem } from "../components/ui";

/* ---------- Public front page ---------- */

const STEPS = [
  {
    title: "Post a notice",
    text: "Say what you need, when you need it by and how urgent it is. Groceries, a lift to the clinic, a dripping tap.",
  },
  {
    title: "A neighbor raises a hand",
    text: "Volunteers nearby see open requests on their noticeboard and commit to the ones they can do. You'll see who's coming.",
  },
  {
    title: "Done, and a thank-you",
    text: "Your helper marks it complete. Leave them a rating so good neighbors get the recognition they deserve.",
  },
];

const ASKS = [
  { category: "Groceries", title: "A shop run", text: "Milk, bread, the heavy bags." },
  { category: "Medical", title: "Prescription pick-ups", text: "From the pharmacy to your door." },
  { category: "Transport", title: "Lifts", text: "To appointments and back again." },
  { category: "Household", title: "Small fix-its", text: "Taps, shelves, flat-pack." },
  { category: "Companionship", title: "Company", text: "A cuppa, a chat, a walk." },
  { category: "Environment", title: "Community days", text: "Clean-ups, planting, food drives." },
];

const PROMISES = [
  { icon: ShieldCheck, title: "Moderated", text: "Local organizers review members and can suspend anyone who breaks the house rules." },
  { icon: Lock, title: "Discreet", text: "Your phone number and house number are only shared with volunteers, never published." },
  { icon: Sparkles, title: "Always free", text: "No fees, no tips, no ads. Neighbors helping neighbors because they want to." },
];

const Underline = () => (
  <svg className="hero__underline" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
    <motion.path
      d="M4 14C60 6 140 4 200 8s80 6 94 2"
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.9, delay: 0.5, ease: "easeInOut" }}
    />
  </svg>
);

const Landing = () => {
  useTitle();
  return (
    <div className="landing">
      <section className="hero">
        <div className="container hero__inner">
          <motion.div className="hero__copy" {...fadeUp}>
            <p className="kicker">The neighborhood front page</p>
            <h1 className="hero__title">
              Help is closer than you think. It lives{" "}
              <span className="hero__mark">
                next door.
                <Underline />
              </span>
            </h1>
            <p className="lede hero__lede">
              NeighborAid connects people who could use a hand with volunteers on their own streets. Errands, lifts, repairs and
              community projects, all arranged in a few taps.
            </p>
            <div className="row hero__ctas">
              <Link to="/register?role=1" className="btn btn--primary btn--lg">
                I need a hand <ArrowRight size={18} />
              </Link>
              <Link to="/register?role=2" className="btn btn--lg">
                <HandHeart size={18} /> I can help
              </Link>
            </div>
            <p className="scribble" aria-hidden="true">
              <svg className="scribble__arrow" viewBox="0 0 60 40" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M56 34 C 40 36, 20 30, 10 8" />
                <path d="M4 14 L 10 6 L 17 12" />
              </svg>
              free, and it takes about a minute
            </p>
            <p className="small muted">
              Already a member? <Link to="/login">Log in</Link>
            </p>
          </motion.div>
          <motion.div
            className="hero__art"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <HeroScene />
            <Stamp className="hero__stamp" />
          </motion.div>
        </div>
      </section>

      <section className="container section" id="how-it-works" aria-labelledby="how-title">
        <SectionHead id="how-title" title="How it works" action={<span className="kicker kicker--plain">In three short columns</span>} />
        <ol className="columns">
          {STEPS.map((s, i) => (
            <motion.li key={s.title} className="column" {...listItem(i)}>
              <span className="column__num">No. {i + 1}</span>
              <h3>{s.title}</h3>
              <p className="dropcap">{s.text}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      <section className="container section" aria-labelledby="asks-title">
        <SectionHead id="asks-title" title="What neighbors ask for" />
        <ul className="asks">
          {ASKS.map((a, i) => (
            <motion.li key={a.title} className="ask" {...listItem(i)}>
              <CategoryArt category={a.category} className="ask__art" />
              <div>
                <h3>{a.title}</h3>
                <p>{a.text}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </section>

      <section className="container section" aria-label="Who NeighborAid is for">
        <div className="spread">
          <article className="spread__half">
            <p className="kicker">For residents</p>
            <h2>Ask without feeling like a bother.</h2>
            <ul className="ticks">
              <li>Post a request in under a minute, from any device.</li>
              <li>Follow it from “posted” to “done” and see who's helping.</li>
              <li>Withdraw it any time before someone accepts.</li>
            </ul>
            <Link to="/register?role=1" className="btn btn--primary">
              Join as a resident
            </Link>
          </article>
          <article className="spread__half spread__half--alt">
            <p className="kicker">For volunteers</p>
            <h2>Lend a hand when it suits you.</h2>
            <ul className="ticks">
              <li>Browse a live noticeboard sorted by urgency.</li>
              <li>Commit to what you can do; get the resident's details instantly.</li>
              <li>Sign up for community projects and collect kind words.</li>
            </ul>
            <Link to="/register?role=2" className="btn btn--ink">
              Join as a volunteer
            </Link>
          </article>
        </div>
      </section>

      <section className="container section" aria-labelledby="rules-title">
        <SectionHead id="rules-title" title="House rules" />
        <div className="promises">
          {PROMISES.map((p) => (
            <div key={p.title} className="promise">
              <p.icon size={22} aria-hidden="true" />
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="closing">
        <div className="container closing__inner">
          <h2>
            Your street is <em className="accent">waiting</em>.
          </h2>
          <div className="row">
            <Link to="/register" className="btn btn--primary btn--lg">
              Create a free account
            </Link>
            <Link to="/login" className="btn btn--lg closing__secondary">
              Log in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

/* ---------- Resident front page ---------- */

// Requests someone is already helping with come first.
const ACTIVE_ORDER = { ACCEPTED: 0, PENDING: 1 };

const UpcomingList = () => {
  const [items, setItems] = useState(null);
  useEffect(() => {
    getList("/opportunities/available")
      .then((list) => setItems(list.sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 3)))
      .catch(() => setItems([]));
  }, []);
  if (!items) return <div className="skeleton" style={{ height: 160 }} />;
  if (!items.length) return <p className="small muted">No community projects are scheduled right now.</p>;
  return (
    <ul className="mini-list">
      {items.map((o) => (
        <li key={o.id}>
          <span className="mini-list__date">{formatDate(o.deadline)}</span>
          <strong>{o.name}</strong>
          <span className="small muted">{o.location}</span>
        </li>
      ))}
    </ul>
  );
};

const names = (people) => {
  const first = Array.from(new Set(people.map((p) => p.firstName || "a neighbor")));
  return first.length <= 2 ? first.join(" and ") : `${first.slice(0, -1).join(", ")} and ${first[first.length - 1]}`;
};

/** A few plain sentences about the resident's requests, written the way a neighbor would say them. */
const residentNote = ({ pending, accepted, completed, toRate }) => {
  const lines = accepted
    .slice(0, 2)
    .map((r) => `${r.volunteer?.firstName || "A neighbor"} is helping with “${r.requestType}”, due ${relativeDays(r.deadline)}.`);
  if (accepted.length > 2) lines.push(`…and ${plural(accepted.length - 2, "more request")} with a helper on it.`);

  if (pending.length === 1) lines.push(`“${pending[0].requestType}” is still up on the noticeboard, waiting for someone.`);
  else if (pending.length > 1) lines.push(`${pending.length} of your requests are still waiting for someone to pick them up.`);

  if (toRate.length) {
    lines.push(
      <>
        {names(toRate)} finished a job for you. <NoteAction to="/my-requests">Say thanks</NoteAction>, it means more than you'd think.
      </>
    );
  } else if (completed.length) {
    lines.push(`Neighbors have helped you ${completed.length === 1 ? "once" : `${completed.length} times`} so far.`);
  }

  if (!lines.length) {
    lines.push(
      <>
        Nothing on your list today. If something comes up, big or small, <NoteAction to="/user-request">just ask</NoteAction>.
      </>
    );
  }
  return lines;
};

const ResidentHome = ({ session }) => {
  useTitle("Home");
  const { requests, error } = useMyRequests();
  const { ratedIds } = useMyReviews(session.userId);

  const summary = useMemo(() => {
    const list = requests || [];
    const by = (s) => list.filter((r) => normStatus(r.status) === s);
    const toRate = helpersFrom(list).filter((v) => !ratedIds.has(String(v.id)));
    const active = list
      .filter((r) => normStatus(r.status) !== "COMPLETED")
      .sort((a, b) => ACTIVE_ORDER[normStatus(a.status)] - ACTIVE_ORDER[normStatus(b.status)] || new Date(a.deadline) - new Date(b.deadline));
    return { pending: by("PENDING"), accepted: by("ACCEPTED"), completed: by("COMPLETED"), toRate, active };
  }, [requests, ratedIds]);

  const weekday = new Date().toLocaleDateString(undefined, { weekday: "long" });
  const headline =
    summary.accepted.length > 0
      ? `${plural(summary.accepted.length, "neighbor is", "neighbors are")} helping you right now.`
      : summary.pending.length > 0
      ? `${plural(summary.pending.length, "request is", "requests are")} up on the noticeboard.`
      : "Nothing on your list. What could a neighbor help with?";

  return (
    <div className="container page">
      <motion.header className="front" {...fadeUp}>
        <div>
          <p className="kicker">{weekday}'s edition</p>
          <h1 className="front__title">
            {greeting()}, <em className="accent">{session.firstName || "neighbor"}</em>.
          </h1>
          <p className="lede">{headline}</p>
        </div>
        <Link to="/user-request" className="btn btn--primary btn--lg">
          <PlusCircle size={18} /> Ask for help
        </Link>
      </motion.header>

      <Alert>{error}</Alert>

      {requests === null ? (
        <SkeletonGrid count={3} />
      ) : (
        <>
          <Note label="Where things stand" lines={residentNote(summary)} signOff="— from the NeighborAid desk" />

          <div className="front__grid">
            <section aria-labelledby="active-title">
              <SectionHead
                id="active-title"
                title="Your open requests"
                count={summary.active.length || undefined}
                action={
                  <Link to="/my-requests" className="arrow-link">
                    All requests <ArrowRight size={15} />
                  </Link>
                }
              />
              {summary.active.length === 0 ? (
                <EmptyState
                  art={NoticeboardArt}
                  title="Your noticeboard is clear"
                  action={
                    <Link to="/user-request" className="btn btn--primary btn--sm">
                      Post a request
                    </Link>
                  }
                >
                  When you need a hand, post a request and volunteers nearby will see it straight away.
                </EmptyState>
              ) : (
                <div className="stack">
                  {summary.active.slice(0, 3).map((r, i) => (
                    <motion.div key={r.id} {...listItem(i)}>
                      <RequestCard
                        request={r}
                        view="resident"
                        footer={
                          <>
                            <span className="small text-2">
                              {r.volunteer ? `${r.volunteer.firstName} is on it` : `Posted · needed ${relativeDays(r.deadline)}`}
                            </span>
                            <Link to={`/my-requests?highlight=${r.id}`} className="arrow-link">
                              Details <ArrowRight size={15} />
                            </Link>
                          </>
                        }
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            <aside className="sidebar" aria-label="Around the neighborhood">
              {summary.toRate.length > 0 && (
                <div className="side-card side-card--accent">
                  <p className="kicker kicker--plain">Say thanks</p>
                  <h3>
                    {summary.toRate.length === 1
                      ? `How did ${summary.toRate[0].firstName} do?`
                      : `${summary.toRate.length} helpers are waiting for your rating`}
                  </h3>
                  <p className="small text-2">A quick rating helps good volunteers get recognized.</p>
                  <Link to="/contact?tab=feedback" className="btn btn--sm btn--ink">
                    <Star size={14} /> Rate a helper
                  </Link>
                </div>
              )}
              <div className="side-card">
                <div className="row row--between">
                  <p className="kicker kicker--plain">What's on nearby</p>
                  <Link to="/volunteer-opportunities" className="arrow-link">
                    See all <ArrowRight size={15} />
                  </Link>
                </div>
                <UpcomingList />
              </div>
              <div className="side-card">
                <p className="kicker kicker--plain">Questions?</p>
                <p className="small text-2">The NeighborAid team reads every message and replies within a day or two.</p>
                <Link to="/contact" className="arrow-link">
                  Write to us <ArrowRight size={15} />
                </Link>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

const Home = () => {
  const session = useSession();
  if (!session) return <Landing />;
  if (session.role !== ROLES.USER) return <Navigate to={homePathFor(session.role)} replace />;
  return <ResidentHome session={session} />;
};

export default Home;
