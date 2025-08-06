import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  currencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Currency" },
  address: String,
  privateKey: String,
  currencyType: String,
  amount: Number,
  type: String,
});

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;
