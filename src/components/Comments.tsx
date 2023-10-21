import { useEffect, useRef, useState } from "react";
import "./Comments.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleArrowUp } from "@fortawesome/free-solid-svg-icons";
import { auth, db } from "../firebase";
import Signin from "./Signin";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, query, onSnapshot } from "firebase/firestore";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import CommentsDisplay from "./CommentsDisplay";

export interface CommentDoc {
  body?: string;
  UID?: string;
  date?: Date;
  id: string;
}

function Comments() {
  // New comment text
  const [text, setText] = useState("");
  // Ref to textarea DOM object for dynamic textbox height
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Boolean to show sign in popup
  const [showSignin, setShowSignin] = useState(false);
  // Boolean to keep track of whether or not the comment is sending
  const [isSending, setIsSending] = useState(false);
  // FIREBASE
  const [commentDocs, setCommentDocs] = useState<CommentDoc[]>([]);

  // Read firebase
  useEffect(() => {
    const q = query(collection(db, "comments"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let commentsDocsArr: CommentDoc[] = [];

      querySnapshot.forEach((doc) => {
        commentsDocsArr.push({ ...doc.data(), id: doc.id });
      });
      setCommentDocs(commentsDocsArr);
    });

    return () => unsubscribe();
  }, []);

  // Handle comment submission
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) return;
    if (!auth.currentUser) {
      // Login first
      setShowSignin(true);
      return;
    }
    setIsSending(true);

    try {
      await addDoc(collection(db, "comments"), {
        body: text,
        UID: auth.currentUser.uid,
        date: new Date(),
      });
    } catch (error) {
      console.error(error);
    }

    setText("");
    setIsSending(false);
  };

  // Adjust textarea height based on changes to text
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [text]);

  // Observe to keep currUser up-to-date
  const [user, setUser] = useState({ loggedIn: false });
  user;

  function onAuthStateChange(
    callback: React.Dispatch<
      React.SetStateAction<{
        loggedIn: boolean;
      }>
    >
  ) {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback({ loggedIn: true });
      } else {
        callback({ loggedIn: false });
      }
    });
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChange(setUser);
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div id="comments">
      <CommentsDisplay commentDocs={commentDocs} />
      <div id="comments-input-container">
        <img
          src={
            auth?.currentUser?.photoURL
              ? auth.currentUser.photoURL
              : "/guest_photo.png"
          }
          alt="user avatar"
          id="comments-pfp"
          onClick={() => {
            setShowSignin(true);
          }}
        />

        <form
          id="comments-form"
          onSubmit={(e) => {
            handleTextSubmit(e);
          }}
        >
          <textarea
            id="comments-textarea"
            placeholder="Leave a comment..."
            name="textInput"
            value={text}
            ref={textareaRef}
            onChange={(e) => {
              setText(e.target.value);
            }}
          />
          <button type="submit" id="comments-submit" disabled={isSending}>
            {isSending ? (
              <FontAwesomeIcon icon={faSpinner} />
            ) : (
              <FontAwesomeIcon icon={faCircleArrowUp} />
            )}
          </button>
        </form>
      </div>
      <Signin showSignin={showSignin} setShowSignin={setShowSignin} />
    </div>
  );
}

export default Comments;
