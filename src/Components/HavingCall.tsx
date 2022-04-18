import React, { useEffect, useMemo, useRef, useState } from "react";
import { socket } from "../App";

interface HavingCallProps {
  children?: React.ReactNode;
}

const HavingCall: React.FC<HavingCallProps> = ({}) => {
  const offerQued = useRef<RTCIceCandidateInit[]>([]);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteStream = new MediaStream();
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

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

  useEffect(() => {
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
            candidate: event.candidate.toJSON(),
          });
        }
      };

      await localConnection.setRemoteDescription(offer).then(async () => {
        console.log("set offer as remote description");
        if (!localConnection.currentLocalDescription) {
          const answerDescription = await localConnection.createAnswer({});
          await localConnection.setLocalDescription(answerDescription);
          socket.emit("send-answer", { answer: answerDescription });
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

  useEffect(() => {
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach((track) => {
        console.log("adding track", track);
        localConnection.addTrack(track, mediaStream);
      });
    }
  }, [mediaStream]);

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
          <button
            onClick={() => {
              if (videoRef.current) {
                const localVideo = videoRef.current;
                navigator.mediaDevices
                  .getUserMedia({
                    audio: false,
                    video: true,
                  })
                  .then((mediaStream) => {
                    setMediaStream(mediaStream);
                    // mediaStream.getTracks().forEach((track) => {
                    //   console.log("adding track");
                    //   localConnection.addTrack(track, mediaStream);
                    // });
                    localVideo.srcObject = mediaStream;
                  });
              }
            }}
          >
            Open WebCam
          </button>
        </span>
      </div>
    </>
  );
};
export default HavingCall;
