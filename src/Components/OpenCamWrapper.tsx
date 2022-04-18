import React, { useEffect, useState } from "react";
import { socket } from "../App";
import HavingCall from "./HavingCall";

interface OpenCamWrapperProps {
  children?: React.ReactNode;
}

const OpenCamWrapper: React.FC<OpenCamWrapperProps> = ({}) => {
  const [media, setMedia] = useState<null | MediaStream>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
      })
      .then((mediastream) => {
        setMedia(mediastream);
        socket.emit("accept");
      });
  }, []);

  return <>{media ? <HavingCall media={media} /> : <>Cam not ready</>}</>;
};
export default OpenCamWrapper;
