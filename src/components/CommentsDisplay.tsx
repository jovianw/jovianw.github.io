import { useEffect, useRef } from "react";
import { CommentDoc } from "./Comments";
import "./CommentsDisplay.css";

interface Props {
  commentDocs: CommentDoc[];
  scrollNow: boolean;
  setScrollNow: React.Dispatch<React.SetStateAction<boolean>>;
}

function CommentsDisplay({ commentDocs, scrollNow, setScrollNow }: Props) {
  // Ref to dummy div for chat scrolling
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollNow) {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
      setScrollNow(false);
    }
  }, [scrollNow]);

  return (
    <div className="comments-display" ref={scrollRef}>
      {commentDocs
        .map((commentDoc, index, array) => {
          // Get date string
          var raw_date = commentDoc.date;
          var dateString;
          if (raw_date) {
            var date = new Date(raw_date);
            dateString = date.toLocaleDateString();
          }

          // Figure out if it's a double text
          var doubleText = false;
          if (
            raw_date &&
            index > 0 &&
            commentDoc.UID === array[index - 1].UID
          ) {
            // Same user
            var raw_prevDate = array[index - 1].date;
            if (raw_prevDate && raw_date - raw_prevDate < 1000 * 60 * 4) {
              // Within 4 minutes
              doubleText = true;
            }
          }

          return (
            // You need to return JSX elements here
            <div
              key={commentDoc.id}
              className={
                !doubleText
                  ? "comments-display-container comments-display-top"
                  : "comments-display-container"
              }
            >
              {!doubleText && (
                <>
                  <img src={commentDoc.pfp} className="comments-display-pfp" />
                  <span className="comments-display-name">
                    {commentDoc.displayName}
                  </span>
                  <span className="comments-display-date">{dateString}</span>
                </>
              )}
              <p className="comments-display-body">{commentDoc.body}</p>
            </div>
          );
        })
        .slice(0)
        .reverse()}
      <div className="comments-display-gradient" />
      {/* <div style={{ float: "left", clear: "both" }} ref={scrollRef} /> */}
    </div>
  );
}

export default CommentsDisplay;
