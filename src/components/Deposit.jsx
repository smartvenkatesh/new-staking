import React, { useEffect, useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "../App.css";
import { Button } from "react-bootstrap";

const Deposit = () => {
  const navigate = useNavigate();
  const [depositId, setDepositId] = useState("");
  const [account, setAccount] = useState("");
  const [dbAddresses, setDbAddresses] = useState([]);
  const [amount, setAmount] = useState(0);
  const getAddress = () => {
    axios
      .get(`http://localhost:8080/staking/getAddress/${depositId}`)
      .then((res) => {
        setDbAddresses(res.data);
      });
  };
  useEffect(() => {
    const stateUserId = localStorage.getItem("userId");
    if (stateUserId) {
      setDepositId(stateUserId);
    }
  }, []);

  useEffect(() => {
    if (depositId) {
      getAddress();
    }
  }, [depositId]);

  const submit = () => {
    axios
      .post(`http://localhost:8080/staking/addAmount/${account}/${amount}`)
      .then((res) => console.log(res.data.message));
    setAccount("");
    setAmount(0);
    alert("amount added successfully");
  };

  return (
    <div className="deposit-page">
      <div className="deposit-card">
        <Button onClick={() => navigate("/staking/home")} className="home-btn">
          Home
        </Button>
        <h1>Deposit</h1>
        <select value={account} onChange={(e) => setAccount(e.target.value)}>
          <option value="">Select Address</option>
          {dbAddresses.map((addr, idx) => (
            <option key={idx} value={addr.address}>
              {addr.address}
            </option>
          ))}
        </select>

        <label>Enter Amount :</label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button className="submit-btn" onClick={submit}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default Deposit;
