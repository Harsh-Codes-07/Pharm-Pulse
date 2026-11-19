const { ethers } = require("ethers");
const fs = require("fs");
const solc = require("solc");
require("dotenv").config();

async function main() {
  // 1. Load Polygon Amoy Provider & Wallet
  const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology/");
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Compiling PharmPulse.sol directly...");
  const sourceCode = fs.readFileSync("./contracts/PharmPulse.sol", "utf8");

  const input = {
    language: "Solidity",
    sources: { "PharmPulse.sol": { content: sourceCode } },
    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } }
  };

  const compiled = JSON.parse(solc.compile(JSON.stringify(input)));
  const contractFile = compiled.contracts["PharmPulse.sol"]["PharmPulseRegistry"];
  
  const abi = contractFile.abi;
  const bytecode = contractFile.evm.bytecode.object;

  console.log("Deploying PharmPulseRegistry to Polygon Amoy...");
  const factory = new ethers.ContractFactory(abi, bytecode, signer);
  const contract = await factory.deploy();
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(`\n SUCCESS! Contract deployed to: ${address}`);
  console.log(`👉 Copy this address into your .env file as CONTRACT_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error("Deployment failed:", err);
});