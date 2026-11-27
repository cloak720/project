import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorMessage } from "../lib/api";
import { useToast } from "../context/AppContext";
import { PageHeader } from "./ui";
import OpportunityForm, { EMPTY_OPPORTUNITY } from "./OpportunityForm";

const CreateOpportunity = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [error, setError] = useState("");

  const handleCreate = async (payload) => {
    setError("");
    try {
      await api.post("/opportunities", payload);
      toast("Opportunity published.");
      navigate("/volunteer-opportunities");
    } catch (err) {
      setError(errorMessage(err, "Couldn't create the opportunity."));
    }
  };

  return (
    <div className="container page page--narrow">
      <PageHeader eyebrow="New opportunity" title="Rally some volunteers" subtitle="Volunteers will see this on their dashboard and can sign up until it's full." />
      <OpportunityForm initial={EMPTY_OPPORTUNITY} submitLabel="Publish" busyLabel="Publishing…" onSubmit={handleCreate} serverError={error} />
    </div>
  );
};

export default CreateOpportunity;
