import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { Button } from "react-bootstrap";

const PORT = "http://localhost:8080/staking";

const Stake = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [stakeAmount, setStakeAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [stakeType, setStakeType] = useState("fixed");

  const handleStakeSubmit = async () => {
    if (!stakeAmount || !duration) {
      toast.error("Please enter stake amount and duration");
      return;
    }

    try {
      await axios.post(`${PORT}/stake`, {
        userId: localStorage.getItem("userId"),
        walletId: state.walletId,
        amount: stakeAmount,
        duration,
        network: state.type,
        stakeType,
      });

      toast.success("Staking successful!");
      setDuration("");
      setStakeAmount("");
      setStakeType("fixed");
      setTimeout(() => navigate("/staking/home"), 1500);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Stake failed");
    }
  };

  return (
    <div className="deposit-page">
      <div className="deposit-card">
        <Button onClick={() => navigate("/staking/home")} className="home-btn">
          Home
        </Button>
        <h2>Stake Wallet</h2>
        <p>
          <strong>Address:</strong> {state.address}
        </p>
        <p>
          <strong>Balance:</strong> {state.amount} USD
        </p>

        <div>
          <label>Amount: </label>
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        <div>
          <label>Duration (days): </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Enter duration"
          />
        </div>

        <div>
          <label>Stake Type: </label>
          <select
            value={stakeType}
            onChange={(e) => setStakeType(e.target.value)}
          >
            <option value="fixed">Fixed</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>

        <button
          onClick={handleStakeSubmit}
          style={{
            marginTop: "10px",
            background: "green",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Confirm Stake
        </button>
      </div>
      <div className="deposit-card-read">
        <h1>Read before staking</h1>
        <p>* minimum stake amount 30 USD</p>
        <p>* maximum stake amount 140 USD</p>
        <p>* interest calculate APR method </p>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Stake;
