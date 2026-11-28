import { useEffect } from "react";

/** Sets the browser tab title for the current page. */
const useTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} · NeighborAid` : "NeighborAid · Help from the people next door";
  }, [title]);
};

export default useTitle;
