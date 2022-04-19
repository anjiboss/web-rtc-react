import React, { useContext, useEffect, useMemo, useRef } from "react";
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
  const isSetedLocal = useRef(false);
  const answerQued = useRef<RTCIceCandidateInit[]>([]);
  const offerQued = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    console.log("render");
  });

  useEffect(() => {
    console.log(socket.id);
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

  // SECTION Calling
  const calling = async () => {
    console.log("%c invoke calling", "background: red; color: white");
    // create offer
    const offerDescription = await localConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    console.log({ offerDescription, user: user.username });
    isSetedLocal.current = true;
    await localConnection.setLocalDescription(offerDescription).then(() => {
      console.log("set local description");
    });
    // send offer to server
    // ANCHOR Send offer to server
    socket.emit("send-offer", {
      from: username,
      to: user.socket,
      offer: offerDescription,
    });
  };

  useEffect(() => {
    if (!isSetedLocal.current) {
      isSetedLocal.current = true;
      // ANCHOR Send_Call
      // calling();

      socket.on("answered", ({ answer, from }) => {
        if (from === user.username) {
          console.log("have answer: ", { answer });
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
        } else {
          console.log("%c user is differrent", "background: red; color:white");
        }
      });

      // ANCHOR Add Answer ICE Candidate
      socket.on("add-answer-candidate", async ({ answer, from }) => {
        if (from === user.username) {
          console.log("add-answer-candidate");
          if (localConnection.remoteDescription) {
            console.log("%c storing answer", "background: green; color:white");
            const candidate = new RTCIceCandidate(answer);
            await localConnection.addIceCandidate(candidate);
          } else {
            answerQued.current.push(answer);
          }
        }
      });
      localConnection.onicecandidate = (event) => {
        console.log("adding remote track");
        if (event.candidate) {
          // ANCHOR Send event.candidate.toJson() to server
          socket.emit("offer-send-candidate", {
            candidate: event.candidate.toJSON(),
            from: username,
            to: user.socket,
          });
        }
      };
    } else {
      console.log(
        "%c somehow trying to call calling second time",
        "background: red; color: white"
      );
    }
  }, []);
  // !SECTION

  // SECTION Receiving
  useEffect(() => {
    socket.on("get-offer", async ({ from, offer }) => {
      if (from === user.username) {
        console.log("get offer");
        if (!localConnection.currentRemoteDescription) {
          await localConnection.setRemoteDescription(offer).then(async () => {
            console.log("set local description");

            // ANCHOR Set qued ICECandidate
            if (offerQued.current.length > 0) {
              for (let i = 0; i < offerQued.current.length; i++) {
                // FIXME Is Await Needed
                console.log("storing...");
                await localConnection.addIceCandidate(
                  new RTCIceCandidate(offerQued.current[i])
                );
              }
            }
          });

          const answerDescription = await localConnection.createAnswer();
          socket.emit("send-answer", {
            from: username,
            to: user.socket,
            answer: answerDescription,
          });
        }
      }
    });

    // ANCHOR Add ICE Candidate
    socket.on("add-offer-candidate", ({ offer, from }) => {
      if (from === user.username) {
        console.log(
          "%c add-offer-candidate",
          "background: green; color: white"
        );
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
      }
    });
    // ANCHOR Send IceCandidate To Server
    localConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // ANCHOR Sending candidate
        socket.emit("answer-send-candidate", {
          candidate: event.candidate.toJSON(),
          from: username,
          to: user.socket,
        });
      }
    };

    localConnection.onconnectionstatechange = () => {
      console.log(
        "%c " + localConnection.connectionState,
        "background: red; color:white"
      );
    };
    return () => {
      socket.off("get-offer");
    };
  }, []);
  // !SECTION

  return (
    <>
      <div>User: {user.username}</div>{" "}
      <div>
        <button onClick={calling}>Call </button>
      </div>
    </>
  );
};
export default Other;
