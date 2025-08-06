import React, { useEffect, useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "../App.css";
import { Button } from "react-bootstrap";
import Web3 from "web3";

const Create = () => {
  const navigate = useNavigate();
  const [depositId, setDepositId] = useState("");
  const [network, setNetwork] = useState("");
  const [dbNetwork, setDbNetwork] = useState([]);
  const [address, setAddress] = useState(0);
  const getCurrency = () => {
    axios.get(`http://localhost:8080/staking/getCurrency`).then((res) => {
      setDbNetwork(res.data);
      console.log(res.data);
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
      getCurrency();
    }
  }, [depositId]);

  const submit = async () => {
    try {
      let web3 = new Web3();
      let newAccount = web3.eth.accounts.create();

      console.log("Generated Account:", newAccount);
      setAddress(newAccount);

      await axios.post(`http://localhost:8080/staking/addAddress`, {
        userId: depositId,
        address: newAccount.address,
        currencyName: network,
        privateKey: newAccount.privateKey,
      });

      setNetwork("");
      alert(`Address created successfully`);
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  return (
    <div className="deposit-page">
      <div className="deposit-card">
        <Button onClick={() => navigate("/staking/home")} className="home-btn">
          Home
        </Button>
        <h1>Create Address</h1>
        <select value={network} onChange={(e) => setNetwork(e.target.value)}>
          <option value="">Select Network</option>
          {dbNetwork.map((net, idx) => (
            <option key={idx} value={net.currencyName}>
              {net.currencyName}
            </option>
          ))}
        </select>
        <p>Wallet Address: {address.address}</p>
        <button className="submit-btn" onClick={submit}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default Create;
