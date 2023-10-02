// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.10;

import "forge-std/Vm.sol";
import "./TestUtils.sol";
import "../../src/Deployers/SaltedDeployer02.sol";
import "../../src/Interfaces/IAccount.sol";
import "../../src/Account/AccountFactory.sol";

abstract contract BrinkAccountHelper is TestUtils {

  bytes32 constant DEFAULT_SALT = 0xd2a5b1e84cb7a6df481438c61ec4144631172d3d29b2a30fe7c5f0fbf4e51735;
  string constant DEFAULT_SEED = 'maximum salt fold talent blanket moon mirror deer that purse dirt vapor sadness embark purpose';

  SaltedDeployer02 _saltedDeployer;
  AccountFactory _accountFactory;

  function _deploySaltedDeployer () internal {
    _selectDefaultFork();
    if (_saltedDeployer == SaltedDeployer02(address(0))) {
      _saltedDeployer = new SaltedDeployer02();
    }
  }

  function _deploySaltedContract (string memory path, bytes32 salt) internal returns (address) {
    bytes memory code = vm.getCode(path);
    address contractAddr = _saltedDeployer.getDeployAddress(code, salt);
    if (contractAddr.code.length == 0) {
      _saltedDeployer.deploy(code, salt);
    }
    return contractAddr;
  }

  function _deployAccountFactory () internal {
    _selectDefaultFork();
    _deploySaltedDeployer();
    _accountFactory = AccountFactory(_deploySaltedContract('out/AccountFactory.sol/AccountFactory.json', DEFAULT_SALT));
  }

  function _deployAccountImplementation () internal returns (IAccount accountImpl) {
    _selectDefaultFork();
    _deployAccountFactory();
    accountImpl = IAccount(_deploySaltedContract('out/Account.sol/Account.json', DEFAULT_SALT));
  }

  function _deployTestAccount (uint32 accountIndex) internal returns (VmSafe.Wallet memory signer, IAccount account) {
    _selectDefaultFork();
    _deployAccountImplementation();
    signer = vm.createWallet(vm.deriveKey(DEFAULT_SEED, accountIndex));
    account = IAccount(_accountFactory.deployAccount(signer.addr));
  }

  function _ownerAccount (address owner) internal returns (IAccount account) {
    _selectDefaultFork();
    _deployAccountFactory();
    bytes memory initCode = abi.encodePacked(
      //  [* constructor **] [** minimal proxy ***] [******* implementation *******] [**** minimal proxy *****]
      hex'603c3d8160093d39f3_3d3d3d3d363d3d37363d6f_afcbce78c080f96032a5c1cb1b832d7b_5af43d3d93803e602657fd5bf3',
      owner
    );
    account = IAccount(_create2Address(address(_accountFactory), 0, initCode));
  }

  function _create2Address(address deployer, bytes32 salt, bytes memory initCode) internal pure returns (address) {
    bytes32 hash = keccak256(
      abi.encodePacked(hex'ff', deployer, salt, keccak256(initCode))
    );
    return address(uint160(uint256(hash)));
  }

  function _signMetaDelegateCall (
    VmSafe.Wallet memory wallet,
    address to,
    bytes memory data,
    uint chainId
  ) public returns (bytes memory signature) {
    address account = address(_ownerAccount(wallet.addr));
    bytes32 messageHash = _getMessageHashEIP712(to, data, account, chainId);
    signature = _sign(wallet, messageHash);
  }

  function _sign (
    VmSafe.Wallet memory wallet,
    bytes32 messageHash
  ) public returns (bytes memory signature) {
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(wallet, messageHash);
    signature = abi.encodePacked(r, s, v);
  }

  function _getMessageHashEIP712 (
    address to,
    bytes memory data,
    address account,
    uint chainId
  ) public pure returns (bytes32 messageHash) {
    bytes32 dataHash = keccak256(
      abi.encode(
        keccak256("MetaDelegateCall(address to,bytes data)"), // META_DELEGATE_CALL_TYPEHASH
        to,
        keccak256(data)
      )
    );
    messageHash = keccak256(abi.encodePacked(
      "\x19\x01",
      keccak256(abi.encode(
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
        keccak256("BrinkAccount"),
        keccak256("1"),
        chainId,
        account
      )),
      dataHash
    ));
  }

}
