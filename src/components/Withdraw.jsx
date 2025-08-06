import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Modal from "react-bootstrap/Modal";
import { toast, ToastContainer } from "react-toastify";

const Withdraw = () => {
  const navigate = useNavigate();
  const [account, setAccount] = useState("");
  const [dbAddresses, setDbAddresses] = useState([]);
  const [withdrawId, setWithdrawId] = useState("");
  const [stake, setStake] = useState("");
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const getAddress = () => {
    axios
      .get(`http://localhost:8080/staking/getAddress/${withdrawId}`)
      .then((res) => {
        setDbAddresses(res.data);
        console.log(res.data);
      });
  };

  const getStakeAmount = () => {
    axios
      .get(`http://localhost:8080/staking/stakeAmount/${account}`)
      .then((res) => {
        console.log("res.data", res.data);
        setStake(res.data);
      })
      .catch((err) => alert(err.response.data.message));
  };
  useEffect(() => {
    const stateUserId = localStorage.getItem("userId");
    if (stateUserId) {
      setWithdrawId(stateUserId);
    }
  }, []);

  useEffect(() => {
    if (withdrawId) {
      getAddress();
    }
    if (account) {
      getStakeAmount();
    }
  }, [withdrawId, account]);

  const withdrawAmount = () => {
    axios
      .post("http://localhost:8080/staking/withdraw", { account, stake })
      .then((res) => {
        toast.success(res.data.message);
        handleClose();
        setTimeout(() => navigate("/staking/home"), 3000);
      })
      .catch((err) => toast.error(err.response.data.message));
  };
  return (
    <div className="deposit-page">
      <span>
        Note : Withdraw your stake amount without during days or hours
        completed,no rewards added your address
      </span>
      <div className="deposit-card">
        <Button onClick={() => navigate("/staking/home")} className="home-btn">
          Home
        </Button>
        <h1>WithDraw</h1>
        <select value={account} onChange={(e) => setAccount(e.target.value)}>
          <option value="">Select Address</option>
          {dbAddresses.map((addr, idx) => (
            <option key={idx} value={addr.address}>
              {addr.address}
            </option>
          ))}
        </select>
        {account && <p>Total Stake Amount : {stake}</p>}
        <Button onClick={handleShow}>Withdraw</Button>
        <Modal className="text-center" show={show} onHide={handleClose}>
          <h1 className="pt-3">Withdraw</h1>
          <hr />
          <Modal.Body>Are you sure withdraw stake amount</Modal.Body>
          <Modal.Footer>
            <Button variant="success" onClick={withdrawAmount}>
              yes
            </Button>
            <Button variant="danger" onClick={handleClose}>
              no
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Withdraw;
