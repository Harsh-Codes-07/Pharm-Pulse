import { ethers } from 'ethers';
// Adjust relative path based on where you place this file inside lib/
import DrugTrackingABI from './abi/DrugTrackingABI.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

export async function mintDrugBatchOnChain(batchNumber: string, drugName: string) {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, DrugTrackingABI, signer);

  // Call the smart contract function
  const tx = await contract.mintBatch(batchNumber, drugName);
  await tx.wait();
  return tx.hash;
}