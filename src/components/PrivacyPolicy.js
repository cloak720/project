import React from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "./ui";

const PrivacyPolicy = () => (
  <div className="container page page--narrow">
    <PageHeader eyebrow="Legal" title="Privacy policy" subtitle="What we collect, why, and who can see it." />
    <article className="card card--pad-lg prose">
      <p>NeighborAid only collects what it needs to connect neighbors safely.</p>

      <h2>1. What we collect</h2>
      <ul>
        <li>Account details: name, email, phone number, house number and age.</li>
        <li>What you post: requests, opportunities you join, messages to us and feedback you leave.</li>
      </ul>

      <h2>2. Who sees what</h2>
      <ul>
        <li>Volunteers see the title, details and house number of open requests.</li>
        <li>Your phone number is shown to the volunteer who accepts your request so they can coordinate with you.</li>
        <li>Administrators can see account and activity information in order to moderate the platform.</li>
      </ul>

      <h2>3. How we use it</h2>
      <ul>
        <li>To run the service: matching requests with volunteers and showing status updates.</li>
        <li>To keep the community safe: investigating reports and enforcing our terms.</li>
      </ul>
      <p>We don't sell your information or share it with third parties except where the law requires it.</p>

      <h2>4. Your choices</h2>
      <ul>
        <li>You can view and edit your details at any time on your profile page.</li>
        <li>You can withdraw a request before a volunteer accepts it.</li>
        <li>You can ask us to delete your account by sending us a message.</li>
      </ul>

      <h2>5. Security</h2>
      <p>We take reasonable steps to protect your data, but no system connected to the internet is perfectly secure.</p>

      <h2>6. Contact</h2>
      <p>
        Privacy questions? <Link to="/contact">Send us a message</Link>.
      </p>
    </article>
  </div>
);

export default PrivacyPolicy;
