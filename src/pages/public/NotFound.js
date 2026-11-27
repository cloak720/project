import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSession } from "../../context/AppContext";
import { homePathFor } from "../../lib/auth";
import { useDocumentTitle } from "../../lib/hooks";
import { EmptyArt } from "../../components/art/Glyphs";

const NotFound = () => {
  useDocumentTitle("Page not found");
  const session = useSession();
  return (
    <div className="container notfound">
      <EmptyArt name="search" />
      <p className="mono notfound__code">404</p>
      <h1>This page isn't on the map</h1>
      <p className="muted">The link may be old, or the page may have moved.</p>
      <Link to={session ? homePathFor(session.role) : "/"} className="btn btn--primary">
        <ArrowLeft size={15} /> {session ? "Back to your dashboard" : "Back to home"}
      </Link>
    </div>
  );
};

export default NotFound;
