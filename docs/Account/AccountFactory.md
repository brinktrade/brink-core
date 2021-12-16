## `AccountFactory`

This is a factory contract used for deployment of Brink proxy accounts




### `deployAccount(address owner) → address account` (external)

This deploys a "minimal proxy" contract with the proxy owner address added to the deployed bytecode. The
owner address can be read within a delegatecall by using `extcodecopy`. Minimal proxy bytecode is from
https://medium.com/coinmonks/the-more-minimal-proxy-5756ae08ee48 and https://eips.ethereum.org/EIPS/eip-1167. It
utilizes the "vanity address optimization" from EIP 1167

Deploys a Proxy account for the given owner



