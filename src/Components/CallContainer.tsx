import React, { useEffect, useState } from "react";
import { socket } from "../App";
import Calling from "./Calling";
import OpenCamWrapper from "./OpenCamWrapper";
import { Room } from "./Room";

interface CallContainerProps {
  children?: React.ReactNode;
  room: Room;
}
interface Context {
  room: string;
  users: string[];
}

export const CallContext = React.createContext<Context>({
  room: "",
  users: [],
});

const CallContainer: React.FC<CallContainerProps> = ({ room }) => {
  const [haveCall, setHaveCall] = useState(false);
  const [accept, setAccept] = useState(false);
  const [calling, setCalling] = useState(false);

  useEffect(() => {
    socket.on("incoming-call", () => {
      console.log("incoming call");
      setHaveCall(true);
    });

    return () => {
      socket.off("incoming-call");
    };
  }, []);

  const answerCall = () => {
    setHaveCall(false);
    setAccept(true);
  };

  const denyCall = () => {
    socket.emit("deny", { roomName: room });
    setHaveCall(false);
  };

  const call = () => {
    setCalling(true);
  };

  return (
    <CallContext.Provider value={{ room: room.roomName, users: room.users }}>
      <h2>Joined Room: {room.roomName}</h2>
      {haveCall ? (
        <div>
          <div>Have new call</div>
          <div>
            <button onClick={answerCall}>Accept</button>
            <button onClick={denyCall}>Deny</button>
          </div>
        </div>
      ) : (
        <></>
      )}

      {accept ? <OpenCamWrapper /> : undefined}
      {calling ? (
        <Calling />
      ) : (
        <>
          <button onClick={call}>Call</button>
        </>
      )}
    </CallContext.Provider>
  );
};
export default CallContainer;
