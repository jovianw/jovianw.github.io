import { useEffect } from "react";

function TabTitle() {
  // User has switched back to the tab
  const onFocus = () => {
    document.title = "Jovian Wang | Home";
  };

  // User has switched away from the tab (AKA tab is hidden)
  const onBlur = () => {
    document.title = "Jovian Wang | 🥺 Come back";
  };

  useEffect(() => {
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    // Calls onFocus when the window first loads
    onFocus();
    // Specify how to clean up after this effect:
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return <></>;
}

export default TabTitle;
