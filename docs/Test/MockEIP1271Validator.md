## `MockEIP1271Validator`

implements some very basic EIP1271 validation for use in tests. Testing it with the backward compat pattern
that GnosisSafe is using just to be extra sure that our Account implementation of EIP1271 checks is compatible.
(https://github.com/gnosis/safe-contracts/blob/main/contracts/handler/CompatibilityFallbackHandler.sol)




### `isValidSignature(bytes _data, bytes _signature) → bytes4` (public)





### `isValidSignature(bytes32 _dataHash, bytes _signature) → bytes4` (public)





### `setValidSignature(bytes32 _dataHash, bytes _signature)` (external)






