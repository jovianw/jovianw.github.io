import { CommentDoc } from "./Comments";

interface Props {
  commentDocs: CommentDoc[];
}

function CommentsDisplay({ commentDocs }: Props) {
  console.log(commentDocs);
  return (
    <div id="comments-display">
      {commentDocs.map((commentDoc) => {
        <h1>asdf</h1>;
      })}
    </div>
  );
}

export default CommentsDisplay;
