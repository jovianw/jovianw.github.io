import "./Signin.css";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, githubProvider, googleProvider } from "../firebase";

interface Props {
  showSignin: boolean; // Boolean representing whether or not to show this component
  setShowSignin: React.Dispatch<React.SetStateAction<boolean>>; // Set boolean state
}

function Signin({ showSignin, setShowSignin }: Props) {
  // Sign in with Google
  const handleSignInWithGoogle = async () => {
    console.log("signing in with google...");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
    }

    setShowSignin(false);
  };

  // Sign in with Github
  const handleSignInWithGithub = async () => {
    console.log("signing in with github...");
    try {
      await signInWithPopup(auth, githubProvider);
    } catch (err) {
      console.error(err);
    }

    setShowSignin(false);
  };

  // Sign out
  const handleSignout = async () => {
    console.log("signing out...");
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    showSignin && (
      <div id="signin">
        <button
          id="signin-exit"
          onClick={() => {
            setShowSignin(false);
          }}
        >
          <FontAwesomeIcon icon={faXmark} size="2x" />
        </button>
        {auth?.currentUser ? (
          <h3>Sign into another account</h3>
        ) : (
          <h3>Sign in to comment</h3>
        )}
        <div id="signin-container">
          <img
            src="/google_logo.png"
            alt="google sign-on"
            className="signin-img"
            onClick={handleSignInWithGoogle}
          />
          <img
            src="/github-mark-white.png"
            alt="github sign-on"
            className="signin-img"
            onClick={handleSignInWithGithub}
          />
        </div>
        {auth?.currentUser && <a onClick={handleSignout}>Sign out</a>}
      </div>
    )
  );
}

export default Signin;
