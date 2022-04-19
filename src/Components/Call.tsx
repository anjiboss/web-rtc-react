import React, { useCallback, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { socket } from "../App";

interface CallProps {
  children?: React.ReactNode;
}

const Call: React.FC<CallProps> = ({}) => {
  const answerQued = useRef<any[]>([]);
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

  const calling = useCallback(async () => {
    if (localConnection) {
      localConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // ANCHOR Send event.candidate.toJson() to server
          socket.emit("offer-send-candidate", {
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // create offer
      const offerDescription = await localConnection.createOffer();
      await localConnection.setLocalDescription(offerDescription);
      // send offer to server
      // ANCHOR Send offer to server
      socket.emit("send-offer", {
        offer: offerDescription,
      });

      // Listen for remote answer
      // ANCHOR Take answer and set it to remoteDescription
      socket.on("answered", ({ answer }) => {
        console.log({ answer });
        if (!localConnection.currentRemoteDescription) {
          localConnection.setRemoteDescription(answer).then(async () => {
            console.log("set remote des");
            if (answerQued.current.length > 0) {
              for (let i = 0; i < answerQued.current.length; i++) {
                await localConnection.addIceCandidate(
                  new RTCIceCandidate(answerQued.current[i])
                );
              }
            }
          });
        } else {
          answerQued.current.push(answer);
        }
      });

      // When answered, add candidate to peer connections
      socket.on("add-answer-candidate", ({ answer }) => {
        if (localConnection.remoteDescription) {
          console.log("add-answer-candidate");
          const candidate = new RTCIceCandidate(answer);
          localConnection.addIceCandidate(candidate);
        }
      });
      localConnection.onconnectionstatechange = () => {
        console.log(
          "%c connection state change: ",
          "background: red; color: white",
          localConnection.connectionState
        );
      };
    } else {
      toast("No Local WebRTC PeerConnection");
    }
  }, [localConnection]);
  return (
    <>
      <button onClick={calling}>Call</button>
    </>
  );
};
export default Call;
