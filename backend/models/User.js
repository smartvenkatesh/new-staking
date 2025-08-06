import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
});

export const User = mongoose.model("User", userSchema);

// Ankr Login Message v3:
// for unique id 0xd4889b25018f6c40694203135f23Ce7F0b952Ec0
// and application MultiRPC
// by provider metamask
// expires 1753770534539

// Ankr Login Message v3:
// for unique id 0x9F0dD335898f1A5d8c2EA022944dbfb9244f0A2C
// and application MultiRPC
// by provider metamask
// expires 1753770705254

// Your API Key: 2670542965f3c529ed3bf384
// Example Request: https://v6.exchangerate-api.com/v6/2670542965f3c529ed3bf384/latest/USD

// const stakingSchema = new mongoose.Schema({
//   userId: mongoose.Schema.Types.ObjectId,
//   walletAddress: String,
//   stakedAmount: Number,
//   startDate: Date,
//   durationInDays: Number,
//   network: String,
// });
