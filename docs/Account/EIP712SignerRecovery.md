## `EIP712SignerRecovery`

https://github.com/ethereum/EIPs/pull/712




### `_storeDomainSeparator(bytes contractName, bytes contractVersion, uint256 chainId_)` (internal)



Stores the domain separator for EIP-712 messages


### `_recoverSigner(bytes32 dataHash, bytes signature) → address signer` (internal)



Recovers the signer address for an EIP-712 signed message



