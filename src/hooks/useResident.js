import { useCallback, useEffect, useMemo, useState } from "react";
import { errorMessage, getList } from "../lib/api";
import { normStatus } from "../lib/format";

/** The signed-in resident's requests. `requests` is null until the first load finishes. */
export const useMyRequests = () => {
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState("");

  const reload = useCallback(
    () =>
      getList("/requests/user")
        .then((list) => {
          setRequests(list);
          setError("");
        })
        .catch((err) => {
          setError(errorMessage(err, "We couldn't load your requests."));
          setRequests((r) => r || []);
        }),
    []
  );

  useEffect(() => {
    reload();
  }, [reload]);

  return { requests, setRequests, error, reload };
};

/**
 * Reviews this resident has written. Optional: if the endpoint isn't available the
 * app simply treats everyone as not-yet-rated.
 */
export const useMyReviews = (userId) => {
  const [reviews, setReviews] = useState([]);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (!userId) return;
    getList(`/feedback/user/${userId}`)
      .then(setReviews)
      .catch(() => {
        setReviews([]);
        setAvailable(false);
      });
  }, [userId]);

  const ratedIds = useMemo(() => new Set(reviews.map((f) => String(f.volunteerId))), [reviews]);
  const addReview = useCallback((review) => setReviews((list) => [...list, review]), []);
  return { reviews, ratedIds, addReview, available };
};

/** Volunteers who completed something for this resident, with the tasks they did. */
export const helpersFrom = (requests) => {
  const map = new Map();
  (requests || [])
    .filter((r) => normStatus(r.status) === "COMPLETED" && r.volunteer)
    .forEach((r) => {
      const v = map.get(r.volunteer.id) || { ...r.volunteer, tasks: [] };
      v.tasks.push(r);
      map.set(r.volunteer.id, v);
    });
  return Array.from(map.values());
};
