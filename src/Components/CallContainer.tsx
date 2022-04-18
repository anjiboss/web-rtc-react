import React, { useEffect, useState } from "react";
import { socket } from "../App";
import Calling from "./Calling";
import HavingCall from "./HavingCall";

interface CallContainerProps {
  children?: React.ReactNode;
}

const CallContainer: React.FC<CallContainerProps> = ({}) => {
  const [haveCall, setHaveCall] = useState(false);
  const [accept, setAccept] = useState(false);
  const [calling, setCalling] = useState(false);

  useEffect(() => {
    socket.on("incoming-call", () => {
      setHaveCall(true);
    });

    return () => {
      socket.off("incoming-call");
    };
  }, []);

  const answerCall = () => {
    socket.emit("accept");
    setHaveCall(false);
    setAccept(true);
  };

  const denyCall = () => {
    socket.emit("deny");
    setHaveCall(false);
  };

  const call = () => {
    setCalling(true);
  };

  return (
    <>
      {haveCall ? (
        <div>
          <div>Have new call</div>
          <div>
            <button onClick={answerCall}>Accept</button>
            <button onClick={denyCall}>Deny</button>
          </div>
        </div>
      ) : (
        <>
          <button onClick={call}>Call</button>
        </>
      )}

      {accept ? <HavingCall /> : undefined}
      {calling ? <Calling /> : undefined}
    </>
  );
};
export default CallContainer;
