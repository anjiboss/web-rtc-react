import React, { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import io from "socket.io-client";
import ReactModal from "react-modal";
import Call from "./Components/Call";
import { startCapture } from "./utils/creenCapture";

export const socket = io(import.meta.env.VITE_SERVER);

interface Props {
  children?: React.ReactNode;
}

const App: React.FC<Props> = () => {
  const [incomingCall, setInComingCall] = useState(false);
  const [call, setCall] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    socket.on("get-offer", () => {
      console.log("get-offer");
      setInComingCall(true);
    });

    return () => {
      socket.off("get-offer");
    };
  }, []);

  const cancelCall = useCallback(() => {
    socket.emit("call-cancelled");
    setInComingCall(false);
  }, []);

  const answerCall = useCallback(() => {
    setInComingCall(false);
    setCall(true);
  }, []);

  return (
    <>
      <ReactModal
        isOpen={incomingCall}
        ariaHideApp={false}
        onRequestClose={cancelCall}
      >
        <div>You have new call</div>
        <button onClick={answerCall}>Answer</button>
        <button onClick={cancelCall}>Cancel</button>
      </ReactModal>
      <div className="videos">
        <span>
          <h3>Local Stream</h3>
          <video ref={video} autoPlay></video>
        </span>
        <span>
          <h3>Remote Stream</h3>
          <video ref={remoteVideo} autoPlay></video>
        </span>
      </div>
      <button
        onClick={() =>
          navigator.mediaDevices
            .getUserMedia({ audio: true, video: true })
            .then((mediaStream) => {
              if (video.current) {
                const camera = video.current;
                video.current.srcObject = mediaStream;
                setMediaStream(mediaStream);
                video.current.onloadedmetadata = function (e) {
                  camera.play();
                };
              }
            })
        }
      >
        WebCam
      </button>
      <button
        onClick={async () => {
          const screenStream = await startCapture({
            audio: false,
          });
          if (video.current && screenStream) {
            const camera = video.current;
            camera.srcObject = screenStream;
            setMediaStream(screenStream);
            camera.onloadedmetadata = () => {
              camera.play();
            };
          }
        }}
      >
        Share Screen
      </button>

      {call && <Call videoStream={mediaStream} />}
    </>
  );
};

export default App;
