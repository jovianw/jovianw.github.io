import "./Overlay.css";

interface Props {
  label?: string;
}

function Overlay({ label }: Props) {
  return <div id="overlay">{label}</div>;
}

export default Overlay;
