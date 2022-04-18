import React, { useEffect, useMemo, useRef } from "react";

interface CallProps {
  children?: React.ReactNode;
  videoStream: MediaStream | null;
}

const Call: React.FC<CallProps> = ({ videoStream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log(videoStream);
    if (videoStream) {
      if (videoRef.current) {
        videoRef.current.srcObject = videoStream;
        const player = videoRef.current;
        videoRef.current.onloadedmetadata = () => {
          player.play();
        };
      }
    }
  }, [videoRef.current, videoStream]);

  const localConnection = useMemo(
    () =>
      new RTCPeerConnection({
        iceServers: [
          {
            urls: [import.meta.env.VITE_STUNSERVER_1],
          },
          {
            username: import.meta.env.VITE_XIRSYS_USERNAME,
            credential: import.meta.env.VITE_XIRSYS_CREDENTIAL,
            urls: [
              import.meta.env.VITE_STUNSERVER_2,
              import.meta.env.VITE_STUNSERVER_3,
              import.meta.env.VITE_STUNSERVER_4,
              import.meta.env.VITE_STUNSERVER_5,
            ],
          },
        ],
        iceCandidatePoolSize: 10,
      }),
    []
  );

  return (
    <>
      <video ref={videoRef}></video>
    </>
  );
};
export default Call;
