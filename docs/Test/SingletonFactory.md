## `SingletonFactory`

Exposes CREATE2 (EIP-1014) to deploy bytecode on deterministic addresses based on initialization code and salt.





### `deploy(bytes _initCode, bytes32 _salt) → address payable createdContract` (public)

Deploys `_initCode` using `_salt` for defining the deterministic address.





