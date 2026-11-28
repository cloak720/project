import React from "react";
import { Link } from "react-router-dom";
import { ROLES, homePathFor } from "../lib/auth";
import { useSession } from "../context/AppContext";
import useTitle from "../hooks/useTitle";
import { SignpostArt } from "../components/art/Scenes";

const NotFound = () => {
  useTitle("Page not found");
  const session = useSession();
  return (
    <div className="container page page--narrow not-found">
      <SignpostArt className="not-found__art" />
      <p className="kicker kicker--plain">Error 404</p>
      <h1>This page isn't in today's edition.</h1>
      <p className="lede">The link may be old, or the page may have moved. Let's get you back on familiar streets.</p>
      <div className="row">
        <Link to={session ? homePathFor(session.role) : "/"} className="btn btn--primary">
          Back to the front page
        </Link>
        {session && session.role !== ROLES.ADMIN && (
          <Link to="/contact" className="btn">
            Report a broken link
          </Link>
        )}
      </div>
    </div>
  );
};

export default NotFound;
