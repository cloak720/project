import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  HandHeart,
  Home as HomeIcon,
  Inbox,
  MessageSquareHeart,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { ROLES, homePathFor } from "../lib/auth";
import { formatDate, normStatus, relativeDays } from "../lib/format";
import { useSession } from "../context/AppContext";
import { Alert, Spinner, StatusBadge, UrgencyBadge } from "./ui";
import heroImage from "../images/community_volunteers.jpg";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: "easeOut" },
};

/* ---------- Public landing page ---------- */

const STEPS = [
  { icon: PlusCircle, title: "Post what you need", text: "Groceries, a lift to the clinic, help moving a sofa. Say when and how urgent." },
  { icon: HandHeart, title: "A neighbor accepts", text: "Volunteers nearby see open requests and pick up the ones they can help with." },
  { icon: CheckCircle2, title: "Get it done, say thanks", text: "Track progress, then rate the volunteer so good helpers get recognised." },
];

const Landing = () => (
  <div>
    <section className="hero">
      <div className="container hero__inner">
        <motion.div className="hero__copy" {...fadeUp}>
          <p className="eyebrow">Community help, close to home</p>
          <h1 className="hero__title">
            Help is closer than you think. <em>It lives next door.</em>
          </h1>
          <p className="hero__lead">
            NeighborAid connects people who need a hand with volunteers in their neighborhood. Errands, rides,
            repairs and community projects all start here.
          </p>
          <div className="row">
            <Link to="/register" className="btn btn--primary btn--lg">
              Get started <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn--lg">
              I already have an account
            </Link>
          </div>
          <ul className="hero__trust">
            <li>
              <ShieldCheck size={16} /> Moderated community
            </li>
            <li>
              <Users size={16} /> Residents &amp; volunteers
            </li>
            <li>
              <Sparkles size={16} /> Free to use
            </li>
          </ul>
        </motion.div>
        <motion.div className="hero__art" {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
          <img src={heroImage} alt="Volunteers planting trees together in a park" />
        </motion.div>
      </div>
    </section>

    <section className="container section">
      <div className="section__head">
        <p className="eyebrow">How it works</p>
        <h2 className="section__title">Three steps from "I need a hand" to "thank you"</h2>
      </div>
      <div className="steps">
        {STEPS.map((s, i) => (
          <motion.div key={s.title} className="step" {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 * i }}>
            <span className="step__num">{i + 1}</span>
            <s.icon size={26} className="step__icon" aria-hidden="true" />
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </motion.div>
        ))}
      </div>
    </section>

    <section className="container section">
      <div className="split-cta">
        <div className="split-cta__card">
          <HomeIcon size={24} aria-hidden="true" />
          <h3>Need help?</h3>
          <p>Create a resident account and post your first request in under a minute.</p>
          <Link to="/register?role=1" className="btn btn--primary">
            Ask for help
          </Link>
        </div>
        <div className="split-cta__card split-cta__card--accent">
          <HandHeart size={24} aria-hidden="true" />
          <h3>Want to help?</h3>
          <p>Join as a volunteer to pick up requests and sign up for community projects.</p>
          <Link to="/register?role=2" className="btn btn--accent">
            Become a volunteer
          </Link>
        </div>
      </div>
    </section>
  </div>
);

/* ---------- Resident home ---------- */

const UserHome = ({ session }) => {
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/requests/user")
      .then((r) => setRequests(Array.isArray(r.data) ? r.data : []))
      .catch((err) => {
        setError(errorMessage(err, "Couldn't load your requests."));
        setRequests([]);
      });
  }, []);

  const count = (s) => (requests || []).filter((r) => normStatus(r.status) === s).length;
  const active = (requests || [])
    .filter((r) => normStatus(r.status) !== "COMPLETED")
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);
  const toRate = (requests || []).filter((r) => normStatus(r.status) === "COMPLETED" && r.volunteer).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="container page">
      <motion.section className="welcome" {...fadeUp}>
        <div>
          <p className="eyebrow">{greeting}</p>
          <h1>Hi {session.firstName || "there"}, what can your neighbors help with?</h1>
          <p className="page-header__sub">Post a request and nearby volunteers will see it straight away.</p>
        </div>
        <Link to="/user-request" className="btn btn--primary btn--lg">
          <PlusCircle size={18} /> New request
        </Link>
      </motion.section>

      {error && <Alert>{error}</Alert>}

      {requests === null ? (
        <Spinner label="Loading your requests…" />
      ) : (
        <div className="stack stack--lg">
          <div className="stats">
            <div className="stat">
              <span className="stat__label">
                <Clock size={16} /> Waiting for a volunteer
              </span>
              <span className="stat__value">{count("PENDING")}</span>
            </div>
            <div className="stat">
              <span className="stat__label">
                <HandHeart size={16} /> In progress
              </span>
              <span className="stat__value">{count("ACCEPTED")}</span>
            </div>
            <div className="stat">
              <span className="stat__label">
                <CheckCircle2 size={16} /> Completed
              </span>
              <span className="stat__value">{count("COMPLETED")}</span>
            </div>
          </div>

          <section>
            <div className="section-title">
              <h2>Active requests</h2>
              <Link to="/my-requests" className="small">
                View all <ArrowRight size={14} style={{ verticalAlign: "-2px" }} />
              </Link>
            </div>
            {active.length === 0 ? (
              <div className="empty">
                <span className="empty__icon">
                  <Inbox size={22} />
                </span>
                <p className="empty__title">Nothing open right now</p>
                <p className="empty__text">When you need a hand, post a request and it will show up here.</p>
                <Link to="/user-request" className="btn btn--primary btn--sm">
                  Ask for help
                </Link>
              </div>
            ) : (
              <div className="grid">
                {active.map((r) => (
                  <Link key={r.id} to={`/my-requests?highlight=${r.id}`} className="item-card item-card--link">
                    <div className="item-card__head">
                      <h3>{r.requestType}</h3>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="item-card__desc">{r.description}</p>
                    <div className="meta">
                      <span>
                        <CalendarClock size={14} /> {formatDate(r.deadline)} · {relativeDays(r.deadline)}
                      </span>
                    </div>
                    <div className="badges">
                      <span className="badge">{r.category}</span>
                      <UrgencyBadge urgency={r.urgency} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="grid grid--2">
            <Link to="/volunteer-opportunities" className="quick-link">
              <Users size={22} />
              <div>
                <strong>Community opportunities</strong>
                <span>See projects happening in your area.</span>
              </div>
              <ArrowRight size={18} />
            </Link>
            <Link to="/contact?tab=feedback" className="quick-link">
              <MessageSquareHeart size={22} />
              <div>
                <strong>Rate a volunteer</strong>
                <span>
                  {toRate > 0 ? `${toRate} completed request${toRate > 1 ? "s" : ""} to review.` : "Share how your request went."}
                </span>
              </div>
              <ArrowRight size={18} />
            </Link>
          </section>
        </div>
      )}
    </div>
  );
};

const Home = () => {
  const session = useSession();
  if (!session) return <Landing />;
  if (session.role !== ROLES.USER) return <Navigate to={homePathFor(session.role)} replace />;
  return <UserHome session={session} />;
};

export default Home;
