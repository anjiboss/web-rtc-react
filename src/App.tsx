import React from "react";
import "./App.css";
import io from "socket.io-client";
import { ToastContainer } from "react-toastify";
import CallContainer from "./Components/CallContainer";

export const socket = io(import.meta.env.VITE_SERVER);

const App: React.FC = () => {
  return (
    <>
      <ToastContainer />
      <CallContainer />
    </>
  );
};

export default App;
