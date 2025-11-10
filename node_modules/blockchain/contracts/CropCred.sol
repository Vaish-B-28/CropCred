// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract CropCred is Initializable, OwnableUpgradeable{
    struct Certificate {
        string certificateID;
        address owner;
        uint256 issuedAt;
    }

    mapping(string => Certificate) public certificates;
    mapping(string => bytes32[]) private batchEventHashes;
    event CertificateIssued(string certificateID, address owner, uint256 issuedAt);
    event BatchEvent(string batchId, bytes32 eventHash, uint256 timestamp);

    function initialize() public initializer {
    __Ownable_init(msg.sender);
 // Required for OwnableUpgradeable
}

    // Store certificate details on-chain
    function issueCertificate(string memory certificateID, address owner) public onlyOwner {
        require(bytes(certificates[certificateID].certificateID).length == 0, "Already issued");

        certificates[certificateID] = Certificate({
            certificateID: certificateID,
            owner: owner,
            issuedAt: block.timestamp
        });

        emit CertificateIssued(certificateID, owner, block.timestamp);
    }

    // Verify a certificate
    function verifyCertificate(string memory certificateID) 
        public 
        view 
        returns (string memory, address, uint256) 
    {
        Certificate memory cert = certificates[certificateID];
        return (cert.certificateID, cert.owner, cert.issuedAt);
    }
    // Add an event hash for a batch (store on-chain)
    function addEventHash(string memory batchId, bytes32 eventHash) public onlyOwner {
        batchEventHashes[batchId].push(eventHash);
        emit BatchEvent(batchId, eventHash, block.timestamp);
    }
    // Read event hashes for a batch (returns bytes32[])
    function getEventHashes(string memory batchId) public view returns (bytes32[] memory) {
        return batchEventHashes[batchId];
    }

}
