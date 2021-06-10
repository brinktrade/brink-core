## `ExecutorAccessController`





### `onlyOwner()`



modifier, checks address is the Owner

### `onlyAdminOrOwner()`



modifier, checks address is an Admin or the Owner


### `constructor(address _owner, uint256 chainId_)` (public)



Stores the address of the owner and stores the domain separator


### `modifyMaxExecutorsPerAdmin(uint8 _maxExecutorsPerAdmin)` (external)



Modifys the max number of executors per admin


### `addAdmin(address admin)` (external)



Adds an admin


### `removeAdmin(address admin)` (external)



Removes an admin


### `addExecutor(address executor, bytes signature)` (external)

Only admins can add executors


Adds an executor


### `addExecutorWithoutSignature(address executor)` (external)

Only the owner can add an executor without requiring a signature


Adds an executor without requiring a signature


### `_addExecutor(address executor)` (internal)



Helper function that handles adding an executor

### `removeExecutor(address executor)` (external)

Only the admin that added the executor can remove it


Removes an executor


### `isExecutor(address executor) → bool` (external)



Returns true if the address is an executor


### `isAdmin(address admin) → bool` (external)



Returns true if the address is an admin



