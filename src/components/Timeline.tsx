import content from "../assets/content.json";
import "./Timeline.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
// import Comments from "./Comments";

interface Props {
  handleOnReady: () => void;
}

function Timeline({ handleOnReady }: Props) {
  const handleOnLoad = (index: number) => {
    if (index === content.cards.length - 1) {
      handleOnReady();
    }
  };

  return (
    <div id="timeline">
      {content.cards.map((card, index) => (
        <div
          className="timeline-card"
          key={card.title}
          onClick={() => void 0}
          onTouchStart={() => void 0}
        >
          <img
            src={"/card_images/".concat(card.image)}
            alt={card.title}
            className="timeline-image"
            onLoad={() => {
              handleOnLoad(index);
            }}
          ></img>
          <div className="timeline-bg"></div>
          <div className="timeline-text resizable">
            <h3>{card.title}</h3>
            <h4>{card.year}</h4>
            <p className="resizable" style={{ whiteSpace: "pre-line" }}>
              {card.description.split("<br/>").join("\n")}
            </p>
            {card.link !== undefined && (
              <form
                className="timeline-form"
                action={card.link.url}
                target="_blank"
              >
                <button type="submit" className="timeline-button">
                  <p>{card.link.text}</p>{" "}
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    transform={{ rotate: -45 }}
                  />
                </button>
              </form>
            )}
          </div>
        </div>
      ))}
      {/* <div className="timeline-card" id="comments-container">
        <Comments />
      </div> */}
    </div>
  );
}

export default Timeline;
