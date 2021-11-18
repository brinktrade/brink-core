## `DeployAndCall`

This contract contains a function to batch account deploy and call into one transaction




### `constructor(contract AccountFactory _accountFactory)` (public)



Constructor sets an immutable accountFactory address

### `deployAndCall(address owner, bytes callData)` (external)



Deploys an account for the given owner and executes callData on the account



