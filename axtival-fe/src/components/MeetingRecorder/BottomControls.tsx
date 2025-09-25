import React from "react";
import { Play, Pause, StopCircle, Settings } from "lucide-react";
import { sprinkles } from "../../styles/sprinkles.css";
import {
  bottomControls,
  recordButton,
  controlButton,
} from "../../styles/meetingRecorder.css";

interface BottomControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  onStartRecording: () => void;
  onPauseResume: () => void;
  onStop: () => void;
}

const BottomControls: React.FC<BottomControlsProps> = ({
  isRecording,
  isPaused,
  onStartRecording,
  onPauseResume,
  onStop,
}) => {
  return (
    <div className={bottomControls}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {!isRecording ? (
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span className={sprinkles({ color: "neutral_6" })}>
                회의 시작하기
              </span>
              <button onClick={onStartRecording} className={recordButton} />
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button onClick={onPauseResume} className={controlButton}>
                {isPaused ? (
                  <Play className={sprinkles({ color: "primary" })} size={20} />
                ) : (
                  <Pause
                    className={sprinkles({ color: "primary" })}
                    size={20}
                  />
                )}
              </button>

              <button onClick={onStop} className={controlButton}>
                <StopCircle
                  className={sprinkles({ color: "primary" })}
                  size={20}
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BottomControls;
