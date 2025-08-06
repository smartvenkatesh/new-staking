import express from "express";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import Web3 from "web3";
import Wallet from "../models/Wallet.js";
import mongoose from "mongoose";
import Staking from "../models/Staking.js";
import cron from "node-cron";
import Currency from "../models/Currency.js";
const fetchCryptoRates = async () => {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,avalanche-2&vs_currencies=usd"
    );

    const data = await response.json();

    const ethRate = data.ethereum.usd;
    console.log("ethRate", ethRate);

    const avaxRate = data["avalanche-2"].usd;

    return { ethRate, avaxRate };
  } catch (error) {
    console.error("Error fetching crypto rates:", error);
    return { ethRate: 0, avaxRate: 0 };
  }
};

const getBalance = async (address, network) => {
  let rpcUrl;
  let cryptoRate;

  const { ethRate, avaxRate } = await fetchCryptoRates();

  if (network === "ETH") {
    rpcUrl = "https://sepolia.infura.io/v3/1a91b5d9c415499e9ef832508938e497";
    cryptoRate = ethRate;
    console.log("cryptoRate", cryptoRate);
  } else if (network === "AVAX") {
    rpcUrl = "https://api.avax.network/ext/bc/C/rpc";
    cryptoRate = avaxRate;
  }

  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

  const balance = await web3.eth.getBalance(address);
  console.log("balance", balance);

  const balanceInEth = web3.utils.fromWei(balance, "ether");
  console.log("balanceInEth", balanceInEth);

  const virtualMoneyInUsd = 100;

  const virtualMoneyInCrypto = virtualMoneyInUsd / cryptoRate;

  console.log(
    "Virtual money in crypto (ETH/AVAX equivalent):",
    virtualMoneyInCrypto
  );

  return { balanceInEth, virtualMoneyInCrypto };
};

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body.formData;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newAppUser = {
      username,
      email,
      password,
    };

    const saved = await User.create(newAppUser);

    res
      .status(200)
      .json({ message: "user successfully register", userId: saved._id });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body.form;
  try {
    const user = await User.findOne({ email: email });

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid Password" });
    }

    const jwtToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "5hr",
    });
    console.log("jwtToken", jwtToken);

    res.status(200).json({
      message: "Login successful",
      token: jwtToken,
      user_id: user._id,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/addCurrency", async (req, res) => {
  const { currencyName, currencySymbol, usdValue } = req.body;
  try {
    const currency = await Currency.findOne({ currencySymbol });
    if (currency) {
      return res.status(400).json({ message: "This currency already added" });
    }

    const addCurrency = new Currency({
      currencyName,
      currencySymbol,
      usdValue,
    });

    await addCurrency.save();
    res.status(200).json({ message: "New Currency Added" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/wallet", async (req, res) => {
  const { user_id, address, key, type } = req.body;

  try {
    const addAddress = await User.findById(user_id);
    const addWallets = new Wallet({
      customerId: user_id,
      address: address,
      privateKey: key,
      type: type,
      amount: 0,
    });
    await addWallets.save();

    res.status(200).json(addWallets);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Wallet creation failed" });
  }
});

router.get("/address/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId || userId === "null") {
    return res.status(400).json({ message: "Invalid userId" });
  }
  const newUserId = new mongoose.Types.ObjectId(userId);

  try {
    const user = await Wallet.find({ userId: newUserId });

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/getCurrency", async (req, res) => {
  try {
    const getCurrency = await Currency.find({});
    res.json(getCurrency);
  } catch (error) {
    console.log(error);
  }
});

router.post("/addAddress", async (req, res) => {
  const { userId, address, currencyName, privateKey } = req.body;
  try {
    const currency = await Currency.findOne(
      { currencyName: currencyName },
      { _id: 1, currencySymbol: 1 }
    );
    const exists = await Wallet.findOne({ currencyId: currency._id });
    if (exists) {
      return res
        .status(400)
        .json({ message: "Already address created this currency" });
    }

    const addAddress = {
      userId,
      currencyId: currency._id,
      address,
      currencyType: currency.currencySymbol,
      privateKey,
    };
    console.log("addAddress", addAddress);

    await Wallet.create(addAddress);
    res.status(200).json({ message: "Address created Succefully" });
  } catch (error) {
    console.log(error);
  }
});

router.get("/balance/:address/:network", async (req, res) => {
  const { address, network } = req.params;

  try {
    const wallet = await Wallet.findOne({ address });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const virtualUsd = parseFloat(wallet.amount || 0);

    const { ethRate, avaxRate } = await fetchCryptoRates();

    let virtualInCrypto;
    if (network === "ETH") {
      virtualInCrypto = virtualUsd / ethRate;
      console.log("virtualInCrypto", virtualInCrypto);
    } else if (network === "AVAX") {
      virtualInCrypto = virtualUsd / avaxRate;
    }

    const realBal = await getBalance(address, network);

    res.json({
      address,
      network,
      realBalanceInCrypto: realBal.balanceInEth,
      virtualUsd,
      virtualInCrypto: virtualInCrypto.toFixed(6),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching balance" });
  }
});

router.get("/getAddress/:depositId", async (req, res) => {
  const { depositId } = req.params;
  const newUserId = new mongoose.Types.ObjectId(depositId);

  try {
    const getUser = await Wallet.find(
      { userId: newUserId },
      { _id: 1, address: 1 }
    );

    res.status(200).json(getUser);
  } catch (error) {
    console.log(error);
  }
});

router.post("/addAmount/:account/:amount", async (req, res) => {
  const { account, amount } = req.params;
  try {
    let wallet = await Wallet.findOne({ address: account });

    wallet.amount = (parseFloat(wallet.amount) || 0) + parseFloat(amount);
    await wallet.save();

    res.status(200).json({ message: "Amount added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/all-wallets", async (req, res) => {
  try {
    const wallets = await Wallet.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "customerId",
          foreignField: "_id",
          as: "admin",
        },
      },
      { $unwind: "$admin" },
      {
        $project: {
          _id: 1,
          address: 1,
          type: 1,
          amount: 1,
          "admin.username": 1,
        },
      },
    ]);
    res.status(200).json(wallets);
  } catch (err) {
    res.status(500).json({ message: "Error fetching wallets" });
  }
});

router.post("/stake", async (req, res) => {
  const { userId, walletId, amount, duration, stakeType, network } = req.body;

  try {
    console.log("req.body", req.body);

    const wallet = await Wallet.findById(walletId);
    if (!wallet || wallet.amount < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }
    wallet.amount -= amount;
    await wallet.save();

    const newStake = new Staking({
      userId,
      walletId,
      amount,
      duration,
      type: stakeType,
      network,
    });

    await newStake.save();

    res.status(200).json({ message: "Staking successful", stake: newStake });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Staking failed" });
  }
});

router.get("/stakes/:select", async (req, res) => {
  const { select } = req.params;
  try {
    const stakes = await Staking.aggregate([
      { $match: { type: select } },
      {
        $lookup: {
          from: "users",
          localField: "customerId",
          foreignField: "_id",
          as: "user_details",
        },
      },
      { $unwind: "$user_details" },
      {
        $lookup: {
          from: "wallets",
          localField: "walletId",
          foreignField: "_id",
          as: "wallet_details",
        },
      },
      { $unwind: "$wallet_details" },
      {
        $project: {
          _id: 1,
          amount: 1,
          network: 1,
          duration: 1,
          status: 1,
          stakeDate: 1,
          rewards: 1,
          type: 1,
          "user_details.username": 1,
          "wallet_details.address": 1,
          "wallet_details.amount": 1,
        },
      },
    ]);
    console.log("stakes", stakes);

    res.status(200).json(stakes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stakes" });
  }
});

router.get("/stakes", async (req, res) => {
  try {
    const stakes = await Staking.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "customerId",
          foreignField: "_id",
          as: "user_details",
        },
      },
      { $unwind: "$user_details" },
      {
        $lookup: {
          from: "wallets",
          localField: "walletId",
          foreignField: "_id",
          as: "wallet_details",
        },
      },
      { $unwind: "$wallet_details" },
      {
        $project: {
          _id: 1,
          amount: 1,
          network: 1,
          duration: 1,
          status: 1,
          stakeDate: 1,
          rewards: 1,
          type: 1,
          "user_details.username": 1,
          "wallet_details.address": 1,
          "wallet_details.amount": 1,
        },
      },
    ]);
    console.log("stakes", stakes);

    res.status(200).json(stakes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stakes" });
  }
});

router.get("/customerStake/:userId", async (req, res) => {
  const { userId } = req.params;
  const newUserId = new mongoose.Types.ObjectId(userId);

  try {
    const customer = await Staking.aggregate([
      { $match: { userId: newUserId } },
      {
        $lookup: {
          from: "wallets",
          localField: "walletId",
          foreignField: "_id",
          as: "stakeDetails",
        },
      },
      { $unwind: "$stakeDetails" },
      {
        $project: {
          _id: 0,
          amount: 1,
          type: 1,
          rewards: 1,
          status: 1,
          "stakeDetails.amount": 1,
          "stakeDetails.address": 1,
        },
      },
    ]);

    res.status(200).json(customer);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/stakeAmount/:account", async (req, res) => {
  const { account } = req.params;
  try {
    const wallet = await Wallet.aggregate([
      { $match: { address: account } },
      {
        $lookup: {
          from: "stakings",
          localField: "_id",
          foreignField: "walletId",
          as: "stakeAmount",
        },
      },
      {
        $unwind: "$stakeAmount",
      },
      {
        $project: {
          _id: 1,
          "stakeAmount.amount": 1,
          "stakeAmount.status": 1,
        },
      },
    ]);
    const result = wallet.filter(
      (wall) => wall.stakeAmount.status === "active"
    );
    console.log("result", result);
    res.status(200).json(result[0].stakeAmount.amount);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Stake Not Found" });
  }
});

router.post("/withdraw", async (req, res) => {
  const { account } = req.body;
  const wallet = await Wallet.findOne({ address: account });
  const stake = await Staking.findOne({
    status: "active",
    walletId: wallet._id,
  });

  console.log("stake from withdraw", stake);

  const now = Date.now();
  const stakeEnd =
    new Date(stake.stakeDate).getTime() + stake.duration * 24 * 60 * 60 * 1000;

  if (now >= stakeEnd) {
    wallet.amount += stake.amount + (stake.rewards || 0);
    stake.status = "completed";
    stake.rewards = 0;
    stake.amount = 0;
  } else {
    wallet.amount += stake.amount;
    stake.status = "cancelled";
    stake.amount = 0;
    stake.rewards = 0;
  }

  await wallet.save();
  await stake.save();
  res.status(200).json({ message: "Withdraw processed" });
});

cron.schedule("*/5 * * * *", async () => {
  console.log("Running daily staking rewards...");

  const APR = 12;
  const DAILY_RATE = APR / 365 / 100;

  try {
    const activeStakes = await Staking.find({ status: "active" });

    for (const stake of activeStakes) {
      const daysPassed = Math.floor(
        (Date.now() - new Date(stake.stakeDate)) / (1000 * 60 * 60 * 24)
      );
      console.log("daysPassed", daysPassed);

      if (stake.type === "flexible") {
        const hoursPassed =
          (Date.now() - new Date(stake.stakeDate)) / (1000 * 60 * 60);
        console.log("hoursPassed for flexible", hoursPassed);

        if (hoursPassed >= 0.1) {
          const reward = stake.amount * DAILY_RATE;
          stake.rewards = (stake.rewards || 0) + reward;
          stake.status = "completed";
        } else {
          const reward = stake.amount * DAILY_RATE;
          console.log("reward for flexible", reward);
          stake.rewards = (stake.rewards || 0) + reward;
        }
      }

      if (daysPassed >= stake.duration && stake.type === "fixed") {
        stake.status = "completed";
        const reward = stake.amount * DAILY_RATE;
        console.log("fixed reward", reward);
        stake.rewards = (stake.rewards || 0) + reward;
      } else {
        const reward = stake.amount * DAILY_RATE;
        console.log("reward", reward);
        stake.rewards = (stake.rewards || 0) + reward;
      }

      await stake.save();
    }
    const completedStakes = await Staking.find({
      status: "completed",
      rewards: { $gt: 0 },
    });

    for (const stake of completedStakes) {
      const wallet = await Wallet.findOne({ _id: stake.walletId });
      if (wallet) {
        wallet.amount = (wallet.amount || 0) + stake.rewards + stake.amount;
        console.log("finish");
        await wallet.save();
        stake.rewards = 0;
        await stake.save();
      } else {
        console.warn(`Wallet not found for stake ${stake._id}`);
      }
    }
    console.log("Staking rewards updated.");
  } catch (err) {
    console.error("Error calculating rewards:", err);
  }
});

export default router;
