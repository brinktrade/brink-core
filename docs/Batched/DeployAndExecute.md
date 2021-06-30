## `DeployAndExecute`



Contract for batching CREATE2 contract deployment and an initial call into 1 tx


### `constructor(contract ISingletonFactory _singletonFactory)` (public)



The constructor sets a SingletonFactory

### `deployAndExecute(bytes initCode, bytes32 salt, bytes execData)` (external)



Deploys a contract with SingletonFactory (https://eips.ethereum.org/EIPS/eip-2470)
and executes a call on the newly created contract


