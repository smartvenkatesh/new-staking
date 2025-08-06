import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  currencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Currency" },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: "UserAddress" },
  type: String,
  from: String,
  to: String,
  amount: Number,
  txHash: String,
  date: Date,
});

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
