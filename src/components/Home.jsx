import axios from "axios";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Table from "react-bootstrap/Table";
import Web3 from "web3";
import "../App.css";
import NavDropdown from "react-bootstrap/NavDropdown";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import { toast, ToastContainer } from "react-toastify";
import { Button } from "react-bootstrap";

const PORT = "http://localhost:8080/staking";

const Home = () => {
  const [userId, setUserId] = useState("");
  const [newAccount, setNewAccount] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState("ETH");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [toCurrency, setToCurrency] = useState("USD");
  const [convertedAmount, setConvertedAmount] = useState(1);
  const [amount, setAmount] = useState(1);
  const [open, setOpen] = useState(false);
  const [staking, setStaking] = useState([]);
  const [stakeHistory, setStakeHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("home");

  const navigate = useNavigate();

  const getWallets = async (toCurrency) => {
    const type = toCurrency.toLowerCase();
    setOpen(true);
    try {
      const res = await axios.get(`${PORT}/address/${userId}`);
      const wallets = res.data;
      console.log("wallets", wallets);

      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=ethereum,avalanche-2&vs_currencies=${type}`
      );
      const ethRate = response.data.ethereum[type];
      const avaxRate = response.data["avalanche-2"][type];

      const updatedWallets = wallets.map((wallet) => {
        let rate = 1;
        if (wallet.currencyType === "ETH") rate = ethRate;
        else if (wallet.currencyType === "AVAX") rate = avaxRate;

        const virtualMoneyInCrypto = wallet.amount / rate;
        return { ...wallet, virtualMoneyInCrypto };
      });

      setTransactions(updatedWallets);
      setOpen(false);
    } catch (err) {
      console.error("Wallet fetch error", err);
    }
  };

  useEffect(() => {
    const stateUserId = localStorage.getItem("userId");
    if (stateUserId) {
      setUserId(stateUserId);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      getWallets(toCurrency);

      const fetchExchangeRate = async () => {
        try {
          const response = await fetch(
            "https://api.exchangerate-api.com/v4/latest/USD"
          );
          const data = await response.json();
          setExchangeRate(data.rates[toCurrency]);
        } catch (error) {
          console.error("Error fetching exchange rate:", error);
        }
      };

      fetchExchangeRate();
    }
  }, [userId, toCurrency]);

  useEffect(() => {
    setConvertedAmount((amount * exchangeRate).toFixed(2));
  }, [amount, exchangeRate]);

  const createAccounts = async () => {
    const web3 = new Web3();
    const account = web3.eth.accounts.create();

    setNewAccount(account.address);
    setPrivateKey(account.privateKey);

    await axios.post("http://localhost:8080/staking/wallet", {
      user_id: userId,
      address: account.address,
      key: account.privateKey,
      type: selectedNetwork,
    });
  };

  const goToDeposit = () => {
    navigate("/staking/deposit", { state: userId });
  };

  const goToCreateAddress = () => {
    navigate("/staking/create");
  };

  const customerStakeDetails = () => {
    setActiveTab("stake");
    axios
      .get(`http://localhost:8080/staking/customerStake/${userId}`)
      .then((res) => {
        setStaking(res.data);
        console.log("res.data", res.data);
      });
  };

  const handleStakeHistory = () => {
    setActiveTab("history");
    axios
      .get(`http://localhost:8080/staking/stakeHistory/${userId}`)
      .then((res) => {
        setStakeHistory(res.data);
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <div>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
        open={open}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Navbar bg="dark" data-bs-theme="dark">
        <Container>
          <Navbar.Brand onClick={() => setActiveTab("home")}>
            User Wallets
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse>
            <Nav className="me-auto">
              <Nav.Link onClick={goToCreateAddress}>Create Account</Nav.Link>
              <Nav.Link onClick={goToDeposit}>Deposit</Nav.Link>
              <Nav.Link onClick={() => navigate("/staking/withdraw")}>
                Withdraw
              </Nav.Link>
              <NavDropdown
                title={`Currency: ${toCurrency}`}
                id="currency-nav-dropdown"
              >
                <NavDropdown.Item onClick={() => setToCurrency("USD")}>
                  USD
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => setToCurrency("INR")}>
                  INR
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => setToCurrency("EUR")}>
                  EUR
                </NavDropdown.Item>
              </NavDropdown>
              {activeTab === "home" && (
                <Button onClick={customerStakeDetails}>Stake Details</Button>
              )}
              {activeTab === "stake" && (
                <Button onClick={() => setActiveTab("home")}>
                  Back to home
                </Button>
              )}
            </Nav>
          </Navbar.Collapse>
          <Nav>
            <Nav.Link
              onClick={handleLogout}
              id="logout"
              className="bg-warning text-dark"
            >
              Logout
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      {activeTab === "home" && (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>No</th>
              <th>Network</th>
              <th className="text-center">Logo</th>
              <th>Address</th>
              <th>Balance</th>
              <th>Balance in (ETH/AVAX)</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((wallet, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{wallet.currencyType}</td>
                <td className="text-center">
                  <img
                    src={
                      wallet.currencyType === "ETH"
                        ? "https://assets.coingecko.com/coins/images/279/large/ethereum.png"
                        : "https://assets.coingecko.com/coins/images/12559/large/coin-round-red.png"
                    }
                    alt={wallet.currencyType}
                    width="30"
                    height="30"
                  />
                </td>
                <td>{wallet.address}</td>
                <td>
                  {(wallet.amount * exchangeRate).toFixed(2)} {toCurrency}
                  <div style={{ marginTop: 10 }}>
                    <button
                      onClick={() => {
                        navigate("/staking/stake", {
                          state: {
                            walletId: wallet._id,
                            address: wallet.address,
                            type: wallet.currencyType,
                            amount: wallet.amount,
                          },
                        });
                      }}
                      style={{
                        background: "green",
                        color: "white",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Stake
                    </button>
                  </div>
                </td>

                <td>
                  {wallet.virtualMoneyInCrypto
                    ? wallet.virtualMoneyInCrypto.toFixed(8) +
                      " " +
                      wallet.currencyType
                    : "0" + " " + wallet.currencyType}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {activeTab === "stake" && (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>No</th>
              <th>Stake Address</th>
              <th>Stake Amount</th>
              <th>Remaining Balance</th>
              <th>Stake Type</th>
              <th>Status</th>
              <th>Rewards</th>
            </tr>
          </thead>
          <tbody>
            {staking.map((stake, index) => {
              const total = stake.amount + stake.stakeDetails.amount;
              const finalTotal = total.toFixed(2);
              console.log(total.toFixed(0));

              return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{stake.stakeDetails.address}</td>
                  <td>{stake.amount.toFixed(2)}</td>
                  <td>{stake.stakeDetails.amount.toFixed(2)}</td>
                  <td>{stake.type}</td>
                  <td
                    className={
                      stake.status === "completed"
                        ? "bg-success text-light"
                        : stake.status === "cancelled"
                        ? "bg-danger text-light"
                        : "bg-warning"
                    }
                  >
                    {stake.status}
                  </td>
                  <td>{stake.rewards.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
      <ToastContainer />
    </div>
  );
};

export default Home;
