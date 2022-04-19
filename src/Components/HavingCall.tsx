import React, { useContext, useEffect, useMemo, useRef } from "react";
import { socket } from "../App";
import { CallContext } from "./CallContainer";

interface HavingCallProps {
  children?: React.ReactNode;
  media: MediaStream;
}

const HavingCall: React.FC<HavingCallProps> = ({ media }) => {
  const offerQued = useRef<RTCIceCandidateInit[]>([]);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteStream = new MediaStream();
  const sender = useRef<RTCRtpSender | null>(null);
  const { room } = useContext(CallContext);

  useEffect(() => {
    console.log("render");
  });

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
              // import.meta.env.VITE_STUNSERVER_3,
              // import.meta.env.VITE_STUNSERVER_4,
              // import.meta.env.VITE_STUNSERVER_5,
            ],
          },
        ],
        iceCandidatePoolSize: 10,
      }),
    []
  );

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = media;
    }

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

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }

    localConnection.ontrack = (event) => {
      console.log("adding remote track");
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    socket.on("get-offer", async ({ offer }) => {
      console.log("have-offer", offer);

      // ANCHOR Send IceCandidate To Server
      localConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // ANCHOR Sending candidate
          socket.emit("answer-send-candidate", {
            roomName: room,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      await localConnection.setRemoteDescription(offer).then(async () => {
        console.log("set offer as remote description");
        if (!localConnection.currentLocalDescription) {
          const answerDescription = await localConnection.createAnswer({});
          await localConnection.setLocalDescription(answerDescription);
          socket.emit("send-answer", {
            answer: answerDescription,

            roomName: room,
          });
        } else {
          console.log("have local connection");
        }

        if (offerQued.current.length > 0) {
          for (let i = 0; i < offerQued.current.length; i++) {
            // FIXME Is Await Needed
            await localConnection.addIceCandidate(
              new RTCIceCandidate(offerQued.current[i])
            );
          }
        }
      });
    });

    // ANCHOR Add ICE Candidate
    socket.on("add-offer-candidate", ({ offer }) => {
      console.log("%c add-offer-candidate", "background: green; color: white");
      if (localConnection.remoteDescription) {
        console.log("have remote des");
        const candidate = new RTCIceCandidate(offer);
        localConnection.addIceCandidate(candidate);
      } else {
        offerQued.current.push(offer);
        console.log(
          "%c Dont have remote description ",
          "background: red; color: white"
        );
      }
    });

    // ANCHOR Get On Change Event
    localConnection.onconnectionstatechange = () => {
      console.log(
        "%c connection state change: ",
        "background: red; color: white",
        localConnection.connectionState
      );
    };

    return () => {
      socket.off("get-offer");
      socket.off("add-offer-candidate");
    };
  }, []);

  return (
    <>
      <div className="videos">
        <span>
          <h3>Local</h3>
          <video ref={videoRef} autoPlay></video>
        </span>
        <span>
          <h3>Remote</h3>
          <video ref={remoteVideoRef} autoPlay></video>
        </span>
      </div>
    </>
  );
};
export default HavingCall;
