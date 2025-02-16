import React from "react";
import "./PrivacyPolicy.css";

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy-container">
      <header className="privacy-policy-header">
        <h1>Privacy Policy</h1>
      </header>

      <section className="privacy-policy-content">
        <p>
          At Neighbor-Aid, we are committed to protecting your privacy. This
          Privacy Policy outlines how we collect, use, and safeguard your
          information when you use our platform.
        </p>

        <h2>1. Information We Collect</h2>
        <ul>
          <li>Personal Information: Name, email address, phone number, etc.</li>
          <li>
            Account Information: Login credentials and information related to
            your account.
          </li>
          <li>
            Usage Data: Information about how you interact with our platform.
          </li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To provide and improve our services.</li>
          <li>To communicate with you about updates, offers, and opportunities.</li>
          <li>To ensure security and prevent fraud.</li>
        </ul>

        <h2>3. Sharing Your Information</h2>
        <p>
          We do not share your personal information with third parties without
          your consent, except as required by law or to provide our services
          effectively.
        </p>

        <h2>4. Data Security</h2>
        <p>
          We take appropriate measures to protect your data from unauthorized
          access, alteration, or destruction. However, no method of
          transmission over the Internet is completely secure.
        </p>

        <h2>5. Your Rights</h2>
        <ul>
          <li>Access: You can request a copy of your personal data.</li>
          <li>Correction: You can update or correct your personal information.</li>
          <li>
            Deletion: You can request that we delete your personal information.
          </li>
        </ul>

        <h2>6. Updates to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Any changes will
          be posted on this page, and we encourage you to review it regularly.
        </p>

        <h2>7. Contact Us</h2>
        <p>
          If you have any questions or concerns about this Privacy Policy,
          please contact us at <a href="mailto:support@neighboraid.com">support@neighboraid.com</a>.
        </p>
      </section>

      <footer className="privacy-policy-footer">
        <p>&copy; {new Date().getFullYear()} Neighbor-Aid. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
