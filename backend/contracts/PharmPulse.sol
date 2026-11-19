// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PharmPulseRegistry {
    struct MedicineBatch {
        string drugName;
        string batchNumber;
        string manufacturer;
        string location;
        bool isSold;
        uint256 cloneAttempts;
        bytes32 adminCodeHash; // Stored as a secure cryptographic hash, never plain text
    }

    address public admin;
    mapping(string => MedicineBatch) public batches;
    mapping(string => bool) public batchExists;

    event BatchMinted(string batchNumber, string drugName, string manufacturer);
    event MedicineDispensed(string batchNumber);
    event CounterfeitDetected(string batchNumber, uint256 totalAttempts);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Unauthorized: Admin access required");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function mintBatch(
        string memory _drugName,
        string memory _batchNumber,
        string memory _manufacturer,
        string memory _location,
        string memory _adminCode
    ) public onlyAdmin {
        require(!batchExists[_batchNumber], "Batch already registered");

        bytes32 hashedCode = keccak256(abi.encodePacked(_adminCode));

        batches[_batchNumber] = MedicineBatch({
            drugName: _drugName,
            batchNumber: _batchNumber,
            manufacturer: _manufacturer,
            location: _location,
            isSold: false,
            cloneAttempts: 0,
            adminCodeHash: hashedCode
        });

        batchExists[_batchNumber] = true;
        emit BatchMinted(_batchNumber, _drugName, _manufacturer);
    }

    function verifyAndRecordScan(string memory _batchNumber) public returns (bool isSold, uint256 clones) {
        require(batchExists[_batchNumber], "Batch does not exist");

        MedicineBatch storage batch = batches[_batchNumber];
        
        if (batch.isSold) {
            batch.cloneAttempts += 1;
            emit CounterfeitDetected(_batchNumber, batch.cloneAttempts);
            return (true, batch.cloneAttempts);
        }

        return (false, batch.cloneAttempts);
    }

    function redeemBatch(string memory _batchNumber, string memory _adminCode) public {
        require(batchExists[_batchNumber], "Batch does not exist");
        MedicineBatch storage batch = batches[_batchNumber];
        
        require(!batch.isSold, "Batch already sold and locked");
        require(batch.adminCodeHash == keccak256(abi.encodePacked(_adminCode)), "Invalid Admin Code");

        batch.isSold = true;
        emit MedicineDispensed(_batchNumber);
    }
}