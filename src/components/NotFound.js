import React from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { EmptyState } from "./ui";

const NotFound = () => (
  <div className="container page page--narrow">
    <EmptyState
      icon={Compass}
      title="We couldn't find that page"
      action={
        <Link to="/" className="btn btn--primary btn--sm">
          Go home
        </Link>
      }
    >
      The link may be broken or the page may have moved.
    </EmptyState>
  </div>
);

export default NotFound;
