## `AccountFactory`

This is a factory contract used for deployment of Brink proxy accounts




### `deployAccount(address owner) → address account` (external)

This deploys a "minimal proxy" contract (https://eips.ethereum.org/EIPS/eip-1167) with the proxy owner
address added to the deployed bytecode. The owner address can be read within a delegatecall by using `extcodecopy`

Deploys a Proxy account for the given owner



