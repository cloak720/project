import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  ClipboardCheck,
  Command,
  Gauge,
  HandHeart,
  Home as HomeIcon,
  ListTodo,
  MapPin,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { useDocumentTitle } from "../../lib/hooks";
import NeighborhoodMap from "../../components/art/NeighborhoodMap";
import { LogoMark } from "../../components/art/Logo";
import { Kbd, Stepper, UrgencyBadge } from "../../components/ui";

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, delay, ease: [0.2, 0.8, 0.2, 1] },
});

const SAMPLE_REQUESTS = [
  { title: "Pick up a prescription", meta: "Medical · House 14B", urgency: "High", due: "2h left" },
  { title: "Weekly groceries", meta: "Groceries · House 3", urgency: "Medium", due: "Tomorrow" },
  { title: "Fix a dripping tap", meta: "Household · House 27", urgency: "Low", due: "In 4 days" },
];

/** A product screenshot built from real UI pieces, so it always matches the app's theme. */
const HeroShot = () => (
  <div className="shot" aria-hidden="true">
    <div className="shot__chrome">
      <span className="shot__dots">
        <i />
        <i />
        <i />
      </span>
      <span className="shot__url">neighboraid / request board</span>
      <span className="shot__k">
        <Kbd keys={["mod", "K"]} />
      </span>
    </div>
    <div className="shot__body">
      <div className="shot__side">
        <div className="shot__brand">
          <LogoMark size={20} />
        </div>
        {[HandHeart, ClipboardCheck, Sparkles, Users].map((Icon, i) => (
          <span key={i} className={`shot__nav ${i === 0 ? "is-active" : ""}`}>
            <Icon size={15} />
          </span>
        ))}
      </div>
      <div className="shot__main">
        <div className="shot__head">
          <div>
            <div className="shot__eyebrow">
              <span className="live-dot" /> 5 open nearby
            </div>
            <div className="shot__title">Request board</div>
          </div>
          <div className="segmented shot__seg">
            <span className="segmented__tab is-active">
              <span className="segmented__pill" />
              <span className="segmented__label">Urgent first</span>
            </span>
            <span className="segmented__tab">
              <span className="segmented__label">Soonest</span>
            </span>
          </div>
        </div>
        <div className="shot__grid">
          <div className="shot__list">
            {SAMPLE_REQUESTS.map((r, i) => (
              <div key={r.title} className={`shot__card ${i === 0 ? "is-focus" : ""}`}>
                <div className="row row--between">
                  <strong>{r.title}</strong>
                  <UrgencyBadge urgency={r.urgency} />
                </div>
                <div className="row row--between small muted">
                  <span>{r.meta}</span>
                  <span className="mono">{r.due}</span>
                </div>
                {i === 0 && (
                  <div className="shot__accept">
                    <span className="btn btn--primary btn--sm">
                      <HandHeart size={13} /> I can help
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="shot__map">
            <NeighborhoodMap />
          </div>
        </div>
      </div>
    </div>
    <div className="shot__toast">
      <CheckCircle2 size={16} />
      <span>
        <strong>Sam</strong> is picking up your prescription
      </span>
    </div>
    <div className="shot__palette">
      <div className="shot__palette-row is-active">
        <PlusCircle size={14} /> New request <Kbd keys={["N"]} />
      </div>
      <div className="shot__palette-row">
        <ListTodo size={14} /> My requests <Kbd keys={["G", "R"]} />
      </div>
    </div>
  </div>
);

const STEPS = [
  {
    icon: PlusCircle,
    title: "Post what you need",
    text: "A title, a few details and a deadline. Set the urgency so the right people see it first.",
  },
  {
    icon: HandHeart,
    title: "A neighbor accepts",
    text: "Volunteers see open requests on a live board and take the ones they can do. You're notified straight away.",
  },
  {
    icon: Star,
    title: "Done, and thanked",
    text: "Track progress from posted to done, then rate the volunteer so good helpers get recognised.",
  },
];

const FEATURES = [
  {
    icon: ListTodo,
    title: "Requests with a clear lifecycle",
    text: "Every request moves through posted, accepted and done, so nobody wonders whether it's handled.",
    demo: (
      <div className="bento__demo">
        <Stepper status="ACCEPTED" />
      </div>
    ),
    wide: true,
  },
  {
    icon: BellRing,
    title: "Notified when it matters",
    text: "Acceptances, completions and replies land in your inbox bell.",
  },
  {
    icon: Sparkles,
    title: "Community projects",
    text: "Clean-ups, food drives and homework clubs with live spot counts.",
  },
  {
    icon: ShieldCheck,
    title: "Moderated by real people",
    text: "Admins can suspend accounts, remove posts and answer every message.",
  },
  {
    icon: Command,
    title: "Fast for power users",
    text: "A command menu, two-key shortcuts and instant, optimistic updates.",
    demo: (
      <div className="bento__demo bento__keys">
        <Kbd keys={["mod", "K"]} />
        <Kbd keys={["G", "H"]} />
        <Kbd keys={["N"]} />
        <Kbd keys={["?"]} />
      </div>
    ),
    wide: true,
  },
];

const ROLES = [
  {
    icon: HomeIcon,
    title: "Residents",
    text: "Ask for help with errands, lifts and small jobs.",
    points: ["Post a request in under a minute", "See who accepted and when", "Rate the volunteers who helped"],
    cta: { to: "/register?role=1", label: "Ask for help" },
  },
  {
    icon: HandHeart,
    title: "Volunteers",
    text: "Lend a hand when it suits you, close to home.",
    points: ["Live board sorted by urgency", "Contact details once you accept", "Join community projects"],
    cta: { to: "/register?role=2", label: "Start volunteering" },
    featured: true,
  },
  {
    icon: Gauge,
    title: "Organisers",
    text: "Keep the community healthy and the projects full.",
    points: ["Overview of every request", "Member moderation tools", "Inbox for every message"],
  },
];

const Landing = () => {
  useDocumentTitle("");
  return (
    <>
      <section className="hero">
        <div className="hero__grid" aria-hidden="true" />
        <div className="container hero__inner">
          <motion.div {...rise()} className="hero__pill">
            <span className="live-dot" /> Neighbors helping neighbors, block by block
          </motion.div>
          <motion.h1 {...rise(0.05)} className="hero__title">
            Help is <span className="hero__accent">one street</span> away.
          </motion.h1>
          <motion.p {...rise(0.1)} className="hero__lead">
            NeighborAid routes everyday requests like groceries, lifts and small repairs to volunteers who live nearby,
            and gives organisers the tools to run community projects.
          </motion.p>
          <motion.div {...rise(0.15)} className="hero__ctas">
            <Link to="/register?role=1" className="btn btn--primary btn--lg">
              Ask for help <ArrowRight size={17} />
            </Link>
            <Link to="/register?role=2" className="btn btn--lg">
              <HandHeart size={17} /> Become a volunteer
            </Link>
          </motion.div>
          <motion.p {...rise(0.2)} className="hero__note">
            Free for residents and volunteers. Already a member? <Link to="/login">Log in</Link>
          </motion.p>
        </div>
        <motion.div
          className="container hero__shot"
          initial={{ opacity: 0, y: 40, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <HeroShot />
        </motion.div>
      </section>

      <section className="container section" id="how">
        <motion.div {...rise()} className="section__head">
          <p className="eyebrow">How it works</p>
          <h2 className="section__title">From “I need a hand” to “thank you” in three steps.</h2>
        </motion.div>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <motion.li key={s.title} className="step" {...rise(0.08 * i)}>
              <span className="step__node">
                <s.icon size={18} aria-hidden="true" />
              </span>
              <span className="step__num mono">0{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      <section className="container section" id="features">
        <motion.div {...rise()} className="section__head">
          <p className="eyebrow">Features</p>
          <h2 className="section__title">Built like a product, run like a neighborhood.</h2>
        </motion.div>
        <div className="bento">
          {FEATURES.map((f, i) => (
            <motion.article key={f.title} className={`bento__cell ${f.wide ? "bento__cell--wide" : ""}`} {...rise(0.05 * i)}>
              <span className="bento__icon">
                <f.icon size={17} aria-hidden="true" />
              </span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
              {f.demo}
            </motion.article>
          ))}
          <motion.article className="bento__cell bento__cell--map" {...rise(0.25)}>
            <span className="bento__icon">
              <MapPin size={17} aria-hidden="true" />
            </span>
            <h3>Local by design</h3>
            <p>Requests show a house number, not a full address, and the volunteer who accepts gets your number to arrange the details.</p>
            <div className="bento__map" aria-hidden="true">
              <NeighborhoodMap />
            </div>
          </motion.article>
        </div>
      </section>

      <section className="container section" id="roles">
        <motion.div {...rise()} className="section__head">
          <p className="eyebrow">Get involved</p>
          <h2 className="section__title">One platform, three ways to take part.</h2>
        </motion.div>
        <div className="roles">
          {ROLES.map((r, i) => (
            <motion.article key={r.title} className={`role-card ${r.featured ? "role-card--featured" : ""}`} {...rise(0.06 * i)}>
              <span className="bento__icon">
                <r.icon size={17} aria-hidden="true" />
              </span>
              <h3>{r.title}</h3>
              <p className="muted">{r.text}</p>
              <ul>
                {r.points.map((p) => (
                  <li key={p}>
                    <CheckCircle2 size={15} aria-hidden="true" /> {p}
                  </li>
                ))}
              </ul>
              {r.cta ? (
                <Link to={r.cta.to} className={`btn ${r.featured ? "btn--primary" : ""} btn--block`}>
                  {r.cta.label} <ArrowRight size={15} />
                </Link>
              ) : (
                <span className="small muted">Organiser accounts are set up by the NeighborAid team.</span>
              )}
            </motion.article>
          ))}
        </div>
      </section>

      <section className="container section">
        <motion.div className="cta-band" {...rise()}>
          <div className="cta-band__art" aria-hidden="true">
            <NeighborhoodMap />
          </div>
          <div className="cta-band__copy">
            <h2>Your street is already a support network.</h2>
            <p>Make it easy to ask, and easy to help.</p>
            <div className="hero__ctas" style={{ justifyContent: "flex-start" }}>
              <Link to="/register" className="btn btn--primary btn--lg">
                Create a free account <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </>
  );
};

export default Landing;
