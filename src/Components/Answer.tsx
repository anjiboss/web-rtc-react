import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { socket } from "../App";

interface CallProps {
  children?: React.ReactNode;
  videoStream: MediaStream | null;
  offer: RTCSessionDescriptionInit;
  offerQued: any[];
}

const Answer: React.FC<CallProps> = ({
  videoStream,
  offer,
  offerQued: offers,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const offerQued = useRef<any[]>(offers);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const remoteStream = useMemo(() => new MediaStream(), []);

  console.log(offers);

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

  // ANCHOR Setting Video Stream Object
  useEffect(() => {
    if (videoStream) {
      if (videoRef.current) {
        videoRef.current.srcObject = videoStream;
        const player = videoRef.current;
        videoRef.current.onloadedmetadata = () => {
          player.play();
        };
        // Push tracks from local stream to peer connection
        videoStream.getTracks().forEach((track) => {
          localConnection.addTrack(track, videoStream);
        });
      }
    }
  }, [videoRef.current]);

  useEffect(() => {
    console.log("set up ...");
    // Add candidate from Peer A (Offer)
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
    localConnection.onconnectionstatechange = () => {
      console.log(
        "%c connection state change: ",
        "background: red; color: white",
        localConnection.connectionState
      );
    };

    return () => {
      socket.off("add-offer-candidate");
    };
  }, [socket, localConnection]);

  // _HANDLER
  const handler = useCallback(async () => {
    console.log("get-offer", offer);
    localConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // ANCHOR Sending candidate
        socket.emit("answer-send-candidate", {
          candidate: event.candidate.toJSON(),
        });
      }
    };

    await localConnection
      .setRemoteDescription(new RTCSessionDescription(offer))
      .then(async () => {
        console.log("set offer as remote description");
        if (!localConnection.currentLocalDescription) {
          const answerDescription = await localConnection.createAnswer();
          await localConnection.setLocalDescription(answerDescription);
          socket.emit("send-answer", { answer: answerDescription });
        }
        if (offerQued.current.length > 0) {
          for (let i = 0; i < offerQued.current.length; i++) {
            await localConnection.addIceCandidate(
              new RTCIceCandidate(offerQued.current[i])
            );
          }
        }
      });
  }, []);

  // ANCHOR Handle Take Offer
  useEffect(() => {
    handler().then(() => {});

    return () => {
      // socket.off("add-offer-candidate");
    };
  }, []);

  // ANCHOR Setting Remote Video
  useEffect(() => {
    if (remoteRef.current) {
      const remoteVideo = remoteRef.current;
      // Pull tracks from remote stream, add to video stream
      remoteVideo.onloadedmetadata = () => {
        remoteVideo.play();
      };
      remoteVideo.srcObject = remoteStream;
      localConnection.ontrack = (event) => {
        console.log("one-track");
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
      };
    }
  }, []);

  return (
    <>
      <div className="videos">
        <span>
          <h3>Local</h3>
          <video ref={videoRef}></video>
        </span>
        <span>
          <h3>Remote Stream</h3>
          <video ref={remoteRef} autoPlay />
        </span>
      </div>
    </>
  );
};
export default Answer;
