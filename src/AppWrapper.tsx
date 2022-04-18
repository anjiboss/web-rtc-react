import React, { useCallback, useEffect, useState } from "react";
import io from "socket.io-client";
import ReactModal from "react-modal";

interface Context {
  localConnection?: RTCPeerConnection;
}

export const socket = io(import.meta.env.VITE_SERVER);

const localConnection = new RTCPeerConnection({
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
});

const GlobalContext = React.createContext<Context>({
  localConnection,
});

interface Props {
  children?: React.ReactNode;
}

const AppWrapper: React.FC<Props> = ({ children }) => {
  const [incomingCall, setInComingCall] = useState(false);
  useEffect(() => {
    socket.on("get-offer", () => {
      console.log("get-offer");
      setInComingCall(true);
    });

    return () => {
      socket.off("get-offer");
    };
  }, []);

  const cancelCall = useCallback(() => {
    socket.emit("call-cancelled");
    setInComingCall(false);
  }, []);

  const answerCall = useCallback(() => {}, []);

  return (
    <GlobalContext.Provider value={{ localConnection }}>
      <ReactModal
        isOpen={incomingCall}
        ariaHideApp={false}
        onRequestClose={cancelCall}
      >
        <div>You have new call</div>
        <button onClick={answerCall}>Answer</button>
        <button onClick={cancelCall}>Cancel</button>
      </ReactModal>
      {children}
    </GlobalContext.Provider>
  );
};

export default AppWrapper;
