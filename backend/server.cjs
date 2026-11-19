const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();
app.use(cors());
app.use(express.json());

const provider = new ethers.JsonRpcProvider("https://rpc-amoy.polygon.technology/");
const signer = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

app.get("/api/drugs/batches", (req, res) => {
  res.json([
    { drugName: "Pan-D (Pantoprazole + Domperidone) · 10s", batchNumber: "IN-PAR-2026-001", manufacturer: "Sun Pharma", status: "Active" }
  ]);
});

app.listen(5000, () => {
  console.log("?? PharmPulse Clean Server running on port 5000");
});
