import React from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../../lib/hooks";

const TERMS = {
  title: "Terms of use",
  intro: "The ground rules that keep NeighborAid safe and friendly. By creating an account or using the platform you agree to them.",
  sections: [
    ["Who can join", <p key="p">You must be at least 18 and give accurate information when you register and when you post requests.</p>],
    [
      "Residents and volunteers",
      <ul key="u">
        <li>Residents post honest, lawful requests and can be reached at the phone number they provide.</li>
        <li>Volunteers only accept requests they can realistically complete, and mark them done only when they are.</li>
        <li>Everyone treats others with respect. Harassment, discrimination or asking for payment is not allowed.</li>
      </ul>,
    ],
    [
      "Safety",
      <p key="p">
        NeighborAid introduces neighbors to each other; it does not employ volunteers or vet every interaction. Use common sense:
        meet in safe places where possible, never share passwords or bank details, and report anything worrying to us.
      </p>,
    ],
    ["Moderation", <p key="p">Organisers may remove requests, opportunities or feedback, and suspend accounts that break these terms.</p>],
    [
      "Privacy",
      <p key="p">
        How we handle your information is described in our <Link to="/privacy">Privacy Policy</Link>.
      </p>,
    ],
    [
      "Liability",
      <p key="p">
        The platform is provided as is. NeighborAid is not liable for loss or damage arising from help arranged through it, or for
        service interruptions.
      </p>,
    ],
    ["Changes", <p key="p">We may update these terms. If you keep using NeighborAid after a change, you accept the updated terms.</p>],
  ],
};

const PRIVACY = {
  title: "Privacy policy",
  intro: "NeighborAid only collects what it needs to connect neighbors safely. Here is what that is, and who can see it.",
  sections: [
    [
      "What we collect",
      <ul key="u">
        <li>Account details: name, email, phone number, house number and age.</li>
        <li>What you post: requests, opportunities you join, messages to us and feedback you leave.</li>
      </ul>,
    ],
    [
      "Who sees what",
      <ul key="u">
        <li>Volunteers see the title, details, category and house number of open requests.</li>
        <li>Your phone number is shown to the volunteer who accepts your request so they can arrange the details with you.</li>
        <li>Organisers can see account and activity information in order to moderate the platform.</li>
      </ul>,
    ],
    [
      "How we use it",
      <>
        <ul key="u">
          <li>To run the service: matching requests with volunteers and showing status updates.</li>
          <li>To keep the community safe: investigating reports and enforcing our terms.</li>
        </ul>
        <p key="p">We don't sell your information or share it with third parties except where the law requires it.</p>
      </>,
    ],
    [
      "Your choices",
      <ul key="u">
        <li>You can view and edit your details at any time on your profile page.</li>
        <li>You can withdraw a request until a volunteer accepts it.</li>
        <li>You can ask us to delete your account by sending us a message.</li>
      </ul>,
    ],
    ["Security", <p key="p">We take reasonable steps to protect your data, but no system connected to the internet is perfectly secure.</p>],
  ],
};

const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, "-");

const Legal = ({ kind }) => {
  const doc = kind === "privacy" ? PRIVACY : TERMS;
  useDocumentTitle(doc.title);
  return (
    <div className="container legal">
      <aside className="legal__toc" aria-label="On this page">
        <p className="eyebrow">On this page</p>
        <ol>
          {doc.sections.map(([h]) => (
            <li key={h}>
              <a href={`#${slug(h)}`}>{h}</a>
            </li>
          ))}
        </ol>
      </aside>
      <article className="legal__body prose">
        <p className="eyebrow">Legal</p>
        <h1>{doc.title}</h1>
        <p className="legal__intro">{doc.intro}</p>
        {doc.sections.map(([h, body], i) => (
          <section key={h} id={slug(h)}>
            <h2>
              <span className="mono muted">{String(i + 1).padStart(2, "0")}</span> {h}
            </h2>
            {body}
          </section>
        ))}
        <p className="legal__contact">
          Questions? <Link to="/messages">Send us a message</Link> once you're logged in.
        </p>
      </article>
    </div>
  );
};

export default Legal;
