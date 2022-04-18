import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { socket } from "../App";
import { startCapture } from "../utils/creenCapture";

interface CallingProps {
  children?: React.ReactNode;
}

const Calling: React.FC<CallingProps> = ({}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const remoteStream = new MediaStream();
  const [isCamOpen, setIsCamOpen] = useState(false);
  const answerQued = useRef<RTCIceCandidateInit[]>([]);

  const offerCall = () => {
    socket.emit("calling");
  };

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
    localConnection.onicecandidate = (event) => {
      console.log("adding remote track");
      if (event.candidate) {
        // ANCHOR Send event.candidate.toJson() to server
        socket.emit("offer-send-candidate", {
          candidate: event.candidate.toJSON(),
        });
      }
    };

    if (remoteRef.current) {
      remoteRef.current.srcObject = remoteStream;
    }
    localConnection.ontrack = (event) => {
      console.log("on track!", event.streams[0]);
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };
  }, []);

  const calling = async () => {
    console.log("invoke calling");
    // create offer
    const offerDescription = await localConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await localConnection.setLocalDescription(offerDescription);
    // send offer to server
    // ANCHOR Send offer to server
    socket.emit("send-offer", {
      offer: offerDescription,
    });
  };

  useEffect(() => {
    socket.on("denied", () => {
      console.log("denied");
      toast("denied", {
        type: "error",
      });
    });

    // ANCHOR Accept
    socket.on("accepted", () => {
      console.log("accepted");
      calling();
    });

    localConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // ANCHOR Send event.candidate.toJson() to server
        socket.emit("offer-send-candidate", {
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Listen for remote answer
    // ANCHOR Take answer and set it to remoteDescription
    socket.on("answered", ({ answer }) => {
      console.log({ answer });
      if (!localConnection.currentRemoteDescription) {
        localConnection.setRemoteDescription(answer).then(async () => {
          console.log("set answer as remote description");
          if (answerQued.current.length > 0) {
            for (let i = 0; i < answerQued.current.length; i++) {
              await localConnection.addIceCandidate(
                new RTCIceCandidate(answerQued.current[i])
              );
            }
          }
        });
      }
    });

    // When answered, add candidate to peer connections
    socket.on("add-answer-candidate", async ({ answer }) => {
      console.log("add-answer-candidate");
      if (localConnection.remoteDescription) {
        const candidate = new RTCIceCandidate(answer);
        await localConnection.addIceCandidate(candidate);
      } else {
        answerQued.current.push(answer);
      }
    });
    localConnection.onconnectionstatechange = () => {
      console.log(
        "%c connection state change: ",
        "background: red; color: white",
        localConnection.connectionState
      );
    };

    return () => {
      socket.off("denied");
      socket.off("accepted");
      socket.off("add-answer-candidate");
      socket.off("answered");
    };
  }, []);

  // ANCHOR Open WebCam
  const openWebCam = async () => {
    if (videoRef.current) {
      const cam = videoRef.current;
      const screen = await startCapture({});
      cam.srcObject = screen;
      setIsCamOpen(true);
      screen!.getTracks().forEach((track) => {
        localConnection.addTrack(track, screen!);
      });
    }
  };

  return (
    <>
      Wanna Call!
      <video ref={videoRef} autoPlay></video>
      <video ref={remoteRef} autoPlay></video>
      <button onClick={openWebCam}>Open Video</button>
      <button disabled={!isCamOpen} onClick={offerCall}>
        Call
      </button>
    </>
  );
};
export default Calling;
