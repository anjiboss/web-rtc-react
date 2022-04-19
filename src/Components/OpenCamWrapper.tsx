import React, { useContext, useEffect, useRef, useState } from "react";
import { socket } from "../App";
import { CallContext } from "./CallContainer";
import HavingCall from "./HavingCall";

interface OpenCamWrapperProps {
  children?: React.ReactNode;
}

const OpenCamWrapper: React.FC<OpenCamWrapperProps> = ({}) => {
  const [media, setMedia] = useState<null | MediaStream>(null);
  const send = useRef<number>(0);
  const { room } = useContext(CallContext);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
      })
      .then((mediastream) => {
        setMedia(mediastream);
        // FIXME Find another better way!!
        if (send.current === 0) {
          socket.emit("accept", { roomName: room });
          send.current++;
        }
      });
  }, []);

  return <>{media ? <HavingCall media={media} /> : <>Cam not ready</>}</>;
};
export default OpenCamWrapper;
