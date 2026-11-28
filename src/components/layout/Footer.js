import React from "react";
import { Link } from "react-router-dom";
import { ROLES } from "../../lib/auth";
import { useSession } from "../../context/AppContext";
import { LogoMark } from "../art/Logo";

const linksFor = (session) => {
  if (!session) {
    return [
      { to: "/register?role=1", label: "Ask for help" },
      { to: "/register?role=2", label: "Become a volunteer" },
      { to: "/login", label: "Log in" },
    ];
  }
  if (session.role === ROLES.USER) {
    return [
      { to: "/user-request", label: "Ask for help" },
      { to: "/my-requests", label: "My requests" },
      { to: "/volunteer-opportunities", label: "Opportunities" },
    ];
  }
  if (session.role === ROLES.VOLUNTEER) {
    return [
      { to: "/volunteer-home", label: "Open requests" },
      { to: "/volunteer-opportunities", label: "Opportunities" },
      { to: "/user-profile", label: "Your profile" },
    ];
  }
  return [
    { to: "/admin-dashboard", label: "Dashboard" },
    { to: "/create-opportunity", label: "New opportunity" },
    { to: "/user-profile", label: "Your profile" },
  ];
};

const Footer = () => {
  const session = useSession();
  const canContact = !session || session.role !== ROLES.ADMIN;
  return (
    <footer className="colophon">
      <div className="container">
        <hr className="rule-double" />
        <div className="colophon__grid">
          <div className="colophon__brand">
            <LogoMark className="colophon__mark" />
            <p className="colophon__name">
              Neighbor<i>Aid</i>
            </p>
            <p className="colophon__motto">
              A small, friendly network for the errands, lifts and fix-its that are easier together.
            </p>
          </div>
          <nav aria-label="Get involved" className="colophon__col">
            <p className="colophon__heading">Get involved</p>
            {linksFor(session).map((l) => (
              <Link key={l.to} to={l.to}>
                {l.label}
              </Link>
            ))}
          </nav>
          <nav aria-label="The fine print" className="colophon__col">
            <p className="colophon__heading">The fine print</p>
            <Link to="/terms">Terms of use</Link>
            <Link to="/privacy">Privacy</Link>
            {canContact && <Link to="/contact">Contact us</Link>}
          </nav>
        </div>
        <div className="colophon__base">
          <span>© {new Date().getFullYear()} NeighborAid</span>
          <span>Set in Fraunces &amp; Instrument Sans. Drawn by hand, delivered by neighbors.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
