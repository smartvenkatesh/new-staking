import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [userName, setUserName] = useState("");
  const [userId, setUserIdState] = useState(null);
  const [authenticated, setAuthenticated] = useState(null);
  const [email, setEmail] = useState();
  const [name, setName] = useState("");
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [role, setRole] = useState("");
  const [show, setShow] = useState([]);
  const [wait, setWait] = useState("");
  const [storedUserId, setStoredUserId] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserIdState(storedUserId);
      setStoredUserId(storedUserId);
      console.log("storedUserid:", storedUserId);
    }
  }, []);

  // Update both state and localStorage
  const setUserId = (id) => {
    if (id) {
      localStorage.setItem("userId", id);
    } else {
      localStorage.removeItem("userId");
    }
    setUserIdState(id);
    setAuthenticated(id);
    console.log("userID:", userId);
    console.log("authenticated", authenticated);
  };

  return (
    <UserContext.Provider
      value={{
        storedUserId,
        wait,
        setWait,
        authenticated,
        setAuthenticated,
        userId,
        setUserId,
        email,
        setEmail,
        name,
        setName,
        userName,
        setUserName,
        selectedRoutes,
        setSelectedRoutes,
        role,
        setRole,
        show,
        setShow,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
