import React from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "./ui";

const TermsAndConditions = () => (
  <div className="container page page--narrow">
    <PageHeader eyebrow="Legal" title="Terms and conditions" subtitle="The ground rules that keep NeighborAid safe and friendly." />
    <article className="card card--pad-lg prose">
      <p>
        Welcome to NeighborAid. By creating an account or using the platform you agree to these terms. If you don't agree,
        please don't use the service.
      </p>

      <h2>1. Who can join</h2>
      <p>You must be at least 18 years old and give accurate information when you register and when you post requests.</p>

      <h2>2. Residents and volunteers</h2>
      <ul>
        <li>Residents post honest, lawful requests and are reachable at the phone number they provide.</li>
        <li>Volunteers only accept requests they can realistically complete, and mark them completed only when they are done.</li>
        <li>Everyone treats others with respect. Harassment, discrimination or asking for payment is not allowed.</li>
      </ul>

      <h2>3. Safety</h2>
      <p>
        NeighborAid introduces neighbors to each other; it does not employ volunteers or vet every interaction. Use common
        sense: meet in safe places where possible, never share passwords or bank details, and report anything worrying to us.
      </p>

      <h2>4. Moderation</h2>
      <p>
        Administrators may remove requests, opportunities or feedback and suspend accounts that break these terms.
      </p>

      <h2>5. Privacy</h2>
      <p>
        How we handle your information is described in our <Link to="/privacy">Privacy Policy</Link>.
      </p>

      <h2>6. Liability</h2>
      <p>
        The platform is provided as is. NeighborAid is not liable for loss or damage arising from help arranged through
        it, or for service interruptions.
      </p>

      <h2>7. Changes</h2>
      <p>We may update these terms. If you keep using NeighborAid after a change, you accept the updated terms.</p>

      <h2>8. Contact</h2>
      <p>
        Questions? <Link to="/contact">Send us a message</Link>.
      </p>
    </article>
  </div>
);

export default TermsAndConditions;
