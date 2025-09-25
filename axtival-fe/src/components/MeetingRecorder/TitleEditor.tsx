import React from "react";
import { Edit2 } from "lucide-react";
import { sprinkles } from "../../styles/sprinkles.css";
import { titleInput } from "../../styles/meetingRecorder.css";

interface TitleEditorProps {
  title: string;
  isEditing: boolean;
  onTitleChange: (title: string) => void;
  onStartEdit: () => void;
  onSaveEdit: (
    e:
      | React.KeyboardEvent<HTMLInputElement>
      | React.FocusEvent<HTMLInputElement>
  ) => void;
}

const TitleEditor: React.FC<TitleEditorProps> = ({
  title,
  isEditing,
  onTitleChange,
  onStartEdit,
  onSaveEdit,
}) => {
  return (
    <div style={{ flex: 1 }}>
      {isEditing ? (
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onSaveEdit}
          onKeyDown={onSaveEdit}
          className={titleInput}
          autoFocus
        />
      ) : (
        <div style={{ display: "flex", alignItems: "center" }}>
          <h1
            className={sprinkles({
              fontSize: "2xlarge",
              fontWeight: "semibold",
              color: "neutral_6",
            })}
            style={{ marginRight: "8px" }}
          >
            {title}
          </h1>
          <button
            onClick={onStartEdit}
            className={sprinkles({
              padding: 4,
            })}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Edit2 className={sprinkles({ color: "neutral_3" })} size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TitleEditor;
