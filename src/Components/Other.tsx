import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { socket } from "../App";
import { RoomContext } from "./Room";

interface OtherProps {
  children?: React.ReactNode;
  media: MediaStream;
  user: { username: string; socket: string };
}

const Other: React.FC<OtherProps> = ({ media, user }) => {
  const sender = useRef<RTCRtpSender | null>(null);
  const { username } = useContext(RoomContext);
  useEffect(() => {
    // ANCHOR Pushing track to localConnection
    if (sender.current === null) {
      media.getTracks().forEach((track) => {
        sender.current = localConnection.addTrack(track, media);
      });
    } else {
      console.log("replace track");
      media.getTracks().forEach(async (track) => {
        sender.current!.replaceTrack(track);
      });
    }
  }, []);

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
            urls: [import.meta.env.VITE_STUNSERVER_2],
          },
        ],
        iceCandidatePoolSize: 10,
      }),
    []
  );

  const calling = useCallback(async () => {
    const offer = await localConnection.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: true,
    });
    if (!localConnection.currentLocalDescription) {
      await localConnection.setLocalDescription(offer);
    }
    console.log("sending offer", { from: username, to: user.socket });
    socket.emit("send-offer", { from: username, to: user.socket, offer });
  }, []);

  useEffect(() => {
    calling();

    socket.on("get-offer", ({ offer }) => {
      console.log("get", offer);
    });
  }, []);

  return <>Other </>;
};
export default Other;
