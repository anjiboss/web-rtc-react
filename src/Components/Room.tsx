import React, { useCallback, useEffect, useState } from "react";
import { socket } from "../App";
import CallContainer from "./CallContainer";
import CallRoom from "./CallRoom";

interface RoomProps {
  children?: React.ReactNode;
}

export interface Room {
  roomName: string;
  users: string[];
}

const Room: React.FC<RoomProps> = ({}) => {
  const [newRoom, setNewRoom] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    // ANCHOR Rooms
    socket.emit("room-list");
    socket.on("rooms", ({ rooms }) => {
      console.log(rooms);
      setRooms(rooms);
    });

    socket.on("user-leave-room", ({ user }) => {
      setSelectedRoom((prev) => {
        prev!.users = prev!.users.filter((u) => u !== user);
        return prev;
      });
    });

    socket.on("user-join-room", ({ user }) => {
      setSelectedRoom((prev) => {
        let tmp = prev!;
        tmp.users = [...prev!.users, user];
        return tmp;
      });
    });

    socket.on("new-room", (newRoom) => {
      setRooms((prev) => [...prev, newRoom]);
    });

    return () => {
      socket.off("rooms");
      // socket.emit("leave-room", { roomName: selectedRoom, user: username });
      socket.off("user-leave-room");
      socket.off("user-join-room");
      socket.off("new-room");
    };
  }, []);

  useEffect(() => {
    console.log({
      rooms,
      selectedRoom,
    });
  }, [rooms, selectedRoom]);

  const createNewRoom = useCallback(() => {
    console.log("do");
    socket.emit("create-room", { roomName: newRoom, user: username });
    setSelectedRoom({ roomName: newRoom, users: [username] });
    setRooms((prev) => {
      console.log("set room");
      let tmp = prev;
      tmp = [...tmp, { roomName: newRoom, users: [username] }];
      return tmp;
    });
  }, [newRoom, username]);

  const joinRoom = useCallback(
    (room: Room) => {
      socket.emit("join-room", { roomName: room.roomName, user: username });
      setRooms((prev) => {
        let tmp = prev;
        tmp.forEach((r, i) => {
          if (r.roomName === room.roomName) {
            tmp[i].users = [...tmp[i].users, username];
          }
        });
        return tmp;
      });
      setSelectedRoom({ ...room, users: [...room.users, username] });
    },
    [username]
  );
  return (
    <>
      <div>
        <div>
          <span>Username:</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
          />
        </div>
        <span>
          <h3>New Room</h3>
          <input
            type="text"
            value={newRoom}
            onChange={(e) => {
              setNewRoom(e.currentTarget.value);
            }}
          />
          <button onClick={createNewRoom}>Create Room {"&"} Join Room</button>
        </span>
      </div>
      <div>
        <h3>Room List: </h3>
        {rooms.map((room, i) => (
          <div key={i}>
            <h4>{room.roomName}</h4>
            <button onClick={() => joinRoom(room)}>Join This Room</button>
          </div>
        ))}
      </div>

      {selectedRoom ? <CallRoom /> : undefined}
    </>
  );
};
export default Room;
