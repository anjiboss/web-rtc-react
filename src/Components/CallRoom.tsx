import React, { useEffect, useRef, useState } from "react";
import { socket } from "../App";
// import { startCapture } from "../utils/creenCapture";
import Myselft from "./Myselft";
import Other from "./Other";
import { Room } from "./Room";

interface CallRoomProps {
  children?: React.ReactNode;
  room: Room;
}

const CallRoom: React.FC<CallRoomProps> = ({ room }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [media, setMedia] = useState<MediaStream | null>(null);
  const [haveMedia, setHaveMedia] = useState(false);

  // ANCHOR Open WebCam
  // const screen = async () => {
  //   if (videoRef.current) {
  //     const cam = videoRef.current;
  //     const screen = await startCapture({});
  //     cam.srcObject = screen;
  //     setMedia(screen);
  //   }
  // };

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
      })
      .then((media) => {
        if (videoRef.current) {
          videoRef.current.srcObject = media;
        }
        setMedia(media);
        setTimeout(() => {
          setHaveMedia(true);
        }, 3000);
      });
  }, []);

  useEffect(() => {
    console.log("room changed", room);
  }, [room]);

  return (
    <>
      <div>
        <h2>Joined Room: {room.roomName}</h2>
      </div>
      <div className="videos">
        <span>
          <h3>Local</h3>
          <video autoPlay ref={videoRef}></video>
        </span>
      </div>
      {/* <button onClick={screen}>Open Screen</button> */}
      <button onClick={() => {}}>Open WebCam</button>

      {haveMedia && (
        <div>
          {/* <button onClick={offerCall}>Call</button> */}
          <Myselft />
          <h1>Other</h1>
          {room.users.map((user, i) => {
            if (user.socket !== undefined && user.socket !== socket.id) {
              return <Other media={media!} key={i} user={user} />;
            } else return undefined;
          })}
        </div>
      )}
    </>
  );
};
export default CallRoom;
