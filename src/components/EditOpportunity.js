import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { errorMessage } from "../lib/api";
import { toLocalInput } from "../lib/format";
import { useToast } from "../context/AppContext";
import { Alert, PageHeader, Spinner } from "./ui";
import OpportunityForm from "./OpportunityForm";

const EditOpportunity = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [initial, setInitial] = useState(null);
  const [joined, setJoined] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/opportunities/${id}`)
      .then(({ data }) => {
        setJoined(data.volunteers?.length || 0);
        // The API returns an ISO timestamp; the date input needs local "YYYY-MM-DDTHH:mm".
        setInitial({
          name: data.name || "",
          description: data.description || "",
          category: data.category || "",
          location: data.location || "",
          deadline: toLocalInput(data.deadline),
          volunteerLimit: String(data.volunteerLimit ?? 1),
        });
      })
      .catch((err) =>
        setLoadError(err.response?.status === 404 ? "This opportunity doesn't exist any more." : errorMessage(err, "Couldn't load this opportunity."))
      );
  }, [id]);

  const handleSave = async (payload) => {
    setError("");
    try {
      await api.put(`/opportunities/${id}`, payload);
      toast("Changes saved.");
      navigate("/volunteer-opportunities");
    } catch (err) {
      setError(errorMessage(err, "Couldn't save your changes."));
    }
  };

  return (
    <div className="container page page--narrow">
      <PageHeader eyebrow="Edit opportunity" title={initial?.name || "Edit opportunity"} subtitle={joined ? `${joined} volunteer${joined > 1 ? "s have" : " has"} already joined.` : undefined} />
      {loadError ? (
        <div className="stack">
          <Alert>{loadError}</Alert>
          <Link to="/volunteer-opportunities" className="btn" style={{ alignSelf: "flex-start" }}>
            Back to opportunities
          </Link>
        </div>
      ) : !initial ? (
        <Spinner />
      ) : (
        <OpportunityForm initial={initial} minLimit={Math.max(1, joined)} submitLabel="Save changes" busyLabel="Saving…" onSubmit={handleSave} serverError={error} />
      )}
    </div>
  );
};

export default EditOpportunity;
