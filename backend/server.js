import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "batches.json");

const app = express();
app.use(cors());
app.use(express.json());

// Initial Indian pharma batches seeded on first run
const initialBatches = [
  {
    drugName: "Pan-D (Pantoprazole + Domperidone) · 10s",
    batchNumber: "IN-PAR-2026-001",
    manufacturer: "Sun Pharmaceutical Industries Ltd.",
    location: "Halol, Gujarat, India",
    status: "Active",
    cloneAttempts: 0,
    adminCode: "1234"
  },
  {
    drugName: "Augmentin 625 Duo · 10s",
    batchNumber: "IN-AUG-2026-901",
    manufacturer: "GlaxoSmithKline Pharmaceuticals Ltd.",
    location: "Nashik, Maharashtra, India",
    status: "Active",
    cloneAttempts: 0,
    adminCode: "7788"
  },
  {
    drugName: "Covaxin (BBV152) · 10-Dose Vial",
    batchNumber: "IN-COV-2026-889",
    manufacturer: "Bharat Biotech International Ltd.",
    location: "Genome Valley, Hyderabad, India",
    status: "Active",
    cloneAttempts: 0,
    adminCode: "5544"
  }
];

// Persistent File Storage Helpers
function loadBatches() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`📁 Loaded ${parsed.length} batches from persistent storage (${DATA_FILE})`);
        return parsed;
      }
    }
    // Write defaults if file does not exist or is empty
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialBatches, null, 2), "utf8");
    console.log(`📁 Initialized persistent storage with default batches at ${DATA_FILE}`);
    return [...initialBatches];
  } catch (err) {
    console.error("⚠️ Error loading persistent batches file:", err.message);
    return [...initialBatches];
  }
}

function saveBatches(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("⚠️ Failed to write batches to persistent storage:", err.message);
  }
}

let batches = loadBatches();

// Contract ABI matching PharmPulse.sol
const contractABI = [
  "function mintBatch(string _drugName, string _batchNumber, string _manufacturer, string _location, string _adminCode) public",
  "function verifyAndRecordScan(string _batchNumber) public returns (bool isSold, uint256 clones)",
  "function redeemBatch(string _batchNumber, string _adminCode) public",
  "function batches(string) public view returns (string drugName, string batchNumber, string manufacturer, string location, bool isSold, uint256 cloneAttempts, bytes32 adminCodeHash)",
  "function batchExists(string) public view returns (bool)"
];

// Ethers Setup with graceful fallback
let provider = null;
let wallet = null;
let contract = null;

const RPC_URL = process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology/";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

try {
  provider = new ethers.JsonRpcProvider(RPC_URL);
  wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000") {
    contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);
    console.log(`🔗 Connected to PharmPulseRegistry at ${CONTRACT_ADDRESS}`);
  } else {
    console.log("ℹ️  Running with local persistent JSON registry (set CONTRACT_ADDRESS in .env to link on-chain)");
  }
} catch (err) {
  console.warn("⚠️ Web3 initialization warning:", err.message);
}

// Authentication Configuration
const ADMIN_CREDENTIALS = {
  username: "Harshwardhan",
  password: "Harsh@58"
};

const CHEMIST_ACCOUNTS = {
  "harsh": "Harsh@Rx942#",
  "sumedh": "Sumedh!Med781$",
  "avadhut": "Avadhut*Pharma356&",
  "praditha": "Praditha#Pulse628^"
};

// 0. Authentication Login Endpoint
app.post("/api/auth/login", (req, res) => {
  const { username, password, portal } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Username and password are required." });
  }

  if (portal === "admin") {
    if (username.trim() === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      return res.json({
        success: true,
        user: { username: ADMIN_CREDENTIALS.username, role: "admin" }
      });
    }
    return res.status(401).json({ success: false, error: "Access Denied: Invalid Admin username or password." });
  }

  if (portal === "chemist") {
    const userKey = username.trim().toLowerCase();
    if (CHEMIST_ACCOUNTS[userKey] && CHEMIST_ACCOUNTS[userKey] === password) {
      return res.json({
        success: true,
        user: { username: userKey, role: "chemist" }
      });
    }
    return res.status(401).json({ success: false, error: "Access Denied: Invalid Chemist username or password." });
  }

  return res.status(400).json({ success: false, error: "Invalid portal type." });
});

// 1. Get batches:
// - If role=admin: includes secret adminCode
// - If chemist/public: strips secret adminCode so it is NEVER exposed
app.get("/api/drugs/batches", (req, res) => {
  const isAdmin = req.query.role === "admin";
  if (isAdmin) {
    return res.json(batches);
  }
  // Strip adminCode for chemist & public portal
  const sanitized = batches.map(({ adminCode, ...publicFields }) => publicFields);
  res.json(sanitized);
});

// Explicit Admin Batches endpoint
app.get("/api/admin/batches", (req, res) => {
  res.json(batches);
});

// 2. Mint / Register Batch (Manufacturer Admin)
app.post("/api/drugs/mint", async (req, res) => {
  try {
    const { drugName, batchNumber, manufacturer, location, adminCode } = req.body;

    if (!batchNumber || !drugName) {
      return res.status(400).json({ error: "Drug name and batch number are required." });
    }

    const trimmedBatchNo = batchNumber.trim();
    const code = adminCode && adminCode.trim() !== "" ? adminCode.trim() : Math.floor(1000 + Math.random() * 9000).toString();

    // Check duplicate
    const existing = batches.find(b => b.batchNumber.toLowerCase() === trimmedBatchNo.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: "Batch ID already registered." });
    }

    let txHash = null;
    if (contract) {
      try {
        console.log(`Minting batch ${trimmedBatchNo} on Polygon Amoy...`);
        const tx = await contract.mintBatch(drugName, trimmedBatchNo, manufacturer, location || "India", code);
        await tx.wait();
        txHash = tx.hash;
        console.log(`On-chain mint successful: ${txHash}`);
      } catch (chainErr) {
        console.error("On-chain mint failed, falling back to persistent registry:", chainErr.message);
      }
    }

    const newBatch = {
      drugName: drugName.trim(),
      batchNumber: trimmedBatchNo,
      manufacturer: manufacturer || "Indian Pharma Ltd.",
      location: location || "India",
      status: "Active",
      cloneAttempts: 0,
      adminCode: code,
      txHash
    };

    batches.unshift(newBatch);
    saveBatches(batches); // Persist to data/batches.json

    res.json({
      success: true,
      message: `Batch ${trimmedBatchNo} successfully registered with Admin Code ${code}!`,
      batch: newBatch,
      txHash
    });
  } catch (error) {
    console.error("Mint error:", error);
    res.status(500).json({ error: error.message || "Failed to mint batch" });
  }
});

// 3. Verify Batch by ID (Chemist & Consumer QR Scanner)
// NEVER returns adminCode to prevent chemist/consumer bypass
app.get("/api/drugs/verify/:id", async (req, res) => {
  try {
    const id = req.params.id.trim();

    const batch = batches.find(b => b.batchNumber.toLowerCase() === id.toLowerCase());

    if (!batch) {
      return res.status(404).json({
        error: `Batch "${id}" was NOT found in the Indian Registry. Alert: Counterfeit or unregistered batch!`
      });
    }

    // Clone alert if already sold
    if (batch.status === "Sold") {
      batch.cloneAttempts = (batch.cloneAttempts || 0) + 1;
      saveBatches(batches); // Persist updated clone count

      if (contract) {
        try {
          await contract.verifyAndRecordScan(batch.batchNumber);
        } catch (e) {
          // ignore background chain log failure
        }
      }

      const { adminCode, ...safeBatch } = batch;
      return res.json({
        ...safeBatch,
        warning: `CRITICAL ALERT: This batch has already been dispensed & sold! Duplicate QR code scan detected (${batch.cloneAttempts} clone attempt${batch.cloneAttempts > 1 ? "s" : ""}).`
      });
    }

    // Active authentic batch without adminCode
    const { adminCode, ...safeBatch } = batch;
    res.json(safeBatch);
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: error.message || "Verification failed" });
  }
});

// 4. Redeem / Dispense Batch (Chemist POS Gate)
app.post("/api/drugs/redeem", async (req, res) => {
  try {
    const { batchNumber, adminCode } = req.body;

    if (!batchNumber || !adminCode) {
      return res.status(400).json({ error: "Batch number and Admin Code are required." });
    }

    const batch = batches.find(b => b.batchNumber.toLowerCase() === batchNumber.trim().toLowerCase());

    if (!batch) {
      return res.status(404).json({ error: "Batch not found." });
    }

    if (batch.status === "Sold") {
      return res.status(400).json({ error: "Batch is already marked as SOLD." });
    }

    if (batch.adminCode !== adminCode.trim()) {
      return res.status(400).json({ error: "Invalid Admin Code. Authorization failed." });
    }

    if (contract) {
      try {
        const tx = await contract.redeemBatch(batch.batchNumber, adminCode.trim());
        await tx.wait();
      } catch (chainErr) {
        console.warn("On-chain redeem skipped/failed:", chainErr.message);
      }
    }

    batch.status = "Sold";
    saveBatches(batches); // Persist status update to data/batches.json

    const { adminCode: _, ...safeBatch } = batch;
    res.json({
      success: true,
      message: "Medicine dispensed and permanently locked as SOLD.",
      record: safeBatch
    });
  } catch (error) {
    console.error("Redeem error:", error);
    res.status(500).json({ error: error.message || "Failed to redeem batch" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 PharmPulse Backend running on http://localhost:${PORT}`);
});
