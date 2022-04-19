import React, { useEffect } from "react";
import "./App.css";
import io from "socket.io-client";
import { toast, ToastContainer } from "react-toastify";
import Room from "./Components/Room";

export const socket = io(import.meta.env.VITE_SERVER);

const App: React.FC = () => {
  useEffect(() => {
    socket.on("notify", ({ message }) => {
      toast(message);
    });
    return () => {
      socket.off("notify");
    };
  }, []);
  return (
    <>
      <ToastContainer />
      <Room />
    </>
  );
};

export default App;
