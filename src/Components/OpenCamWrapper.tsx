import React, { useEffect, useRef, useState } from "react";
import { socket } from "../App";
import HavingCall from "./HavingCall";

interface OpenCamWrapperProps {
  children?: React.ReactNode;
}

const OpenCamWrapper: React.FC<OpenCamWrapperProps> = ({}) => {
  const [media, setMedia] = useState<null | MediaStream>(null);
  const send = useRef<number>(0);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
      })
      .then((mediastream) => {
        setMedia(mediastream);
        // FIXME Find another better way!!
        if (send.current === 0) {
          socket.emit("accept");
          send.current++;
        }
      });
  }, []);

  return <>{media ? <HavingCall media={media} /> : <>Cam not ready</>}</>;
};
export default OpenCamWrapper;
