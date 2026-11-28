import React from "react";
import { Link } from "react-router-dom";
import useTitle from "../hooks/useTitle";
import { PageHead } from "../components/ui";

/** Long-form reading layout with a table of contents that stays in view on wide screens. */
const LegalPage = ({ kicker, title, lede, intro, sections }) => {
  useTitle(title);
  const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div className="container page">
      <PageHead kicker={kicker} title={title} lede={lede} />
      <div className="legal">
        <nav className="legal__toc" aria-label="On this page">
          <p className="kicker kicker--plain">On this page</p>
          <ol>
            {sections.map((s) => (
              <li key={s.title}>
                <a href={`#${slug(s.title)}`}>{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="prose">
          <p className="dropcap">{intro}</p>
          {sections.map((s, i) => (
            <section key={s.title} id={slug(s.title)}>
              <h2>
                <span className="prose__num">{i + 1}.</span> {s.title}
              </h2>
              {s.body}
            </section>
          ))}
          <p className="prose__updated">Last updated November 2026.</p>
        </article>
      </div>
    </div>
  );
};

const contactLink = (
  <p>
    Questions? <Link to="/contact">Send us a message</Link> and a member of the team will get back to you.
  </p>
);

export const Terms = () => (
  <LegalPage
    kicker="The fine print"
    title="Terms of use"
    lede="The ground rules that keep NeighborAid safe, friendly and worth using."
    intro="Welcome to NeighborAid. By creating an account or using the platform you agree to these terms. They're written to be read, so please do. If you don't agree, please don't use the service."
    sections={[
      { title: "Who can join", body: <p>You must be at least 18 years old and give accurate information when you register and when you post requests.</p> },
      {
        title: "Residents and volunteers",
        body: (
          <ul>
            <li>Residents post honest, lawful requests and are reachable at the phone number they provide.</li>
            <li>Volunteers only accept requests they can realistically complete, and mark them done only when they are.</li>
            <li>Everyone treats others with respect. Harassment, discrimination or asking for payment is not allowed.</li>
          </ul>
        ),
      },
      {
        title: "Safety",
        body: (
          <p>
            NeighborAid introduces neighbors to each other; it does not employ volunteers or vet every interaction. Use common sense: meet in safe places
            where you can, never share passwords or bank details, and tell us about anything worrying.
          </p>
        ),
      },
      { title: "Moderation", body: <p>Moderators may remove requests, opportunities or reviews, and suspend accounts that break these terms.</p> },
      {
        title: "Privacy",
        body: (
          <p>
            How we handle your information is described in our <Link to="/privacy">privacy notice</Link>.
          </p>
        ),
      },
      {
        title: "Liability",
        body: <p>The platform is provided as is. NeighborAid is not liable for loss or damage arising from help arranged through it, or for interruptions to the service.</p>,
      },
      { title: "Changes", body: <p>We may update these terms. If you keep using NeighborAid after a change, you accept the updated terms.</p> },
      { title: "Contact", body: contactLink },
    ]}
  />
);

export const Privacy = () => (
  <LegalPage
    kicker="The fine print"
    title="Privacy notice"
    lede="What we collect, why we need it, and who can see it."
    intro="NeighborAid only collects what it needs to connect neighbors safely. We don't sell your information, we don't show ads, and we don't share your details with anyone outside the community except where the law requires it."
    sections={[
      {
        title: "What we collect",
        body: (
          <ul>
            <li>Account details: name, email, phone number, house number and age.</li>
            <li>What you post: requests, opportunities you join, messages to us and ratings you leave.</li>
          </ul>
        ),
      },
      {
        title: "Who sees what",
        body: (
          <ul>
            <li>Volunteers see the headline, details, your first name and house number on open requests.</li>
            <li>The volunteer who accepts your request sees your phone number so they can arrange things with you, and you see theirs.</li>
            <li>Moderators can see account and activity information so they can look after the community.</li>
          </ul>
        ),
      },
      {
        title: "How we use it",
        body: (
          <ul>
            <li>To run the service: matching requests with volunteers and showing progress updates.</li>
            <li>To keep the community safe: looking into reports and enforcing our terms.</li>
          </ul>
        ),
      },
      {
        title: "Your choices",
        body: (
          <ul>
            <li>You can view and edit your details at any time on your profile.</li>
            <li>You can withdraw a request until a volunteer accepts it.</li>
            <li>You can ask us to delete your account by sending us a message.</li>
          </ul>
        ),
      },
      { title: "Security", body: <p>We take reasonable steps to protect your data, but no system connected to the internet is perfectly secure.</p> },
      { title: "Contact", body: contactLink },
    ]}
  />
);
