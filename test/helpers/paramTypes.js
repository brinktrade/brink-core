module.exports = {
  EXECUTE_CALL_PARAM_TYPES: [
    { name: 'value', type: 'uint256' },
    { name: 'to', type: 'address' },
    { name: 'data', type: 'bytes' }
  ],
  
  EXECUTE_DELEGATE_CALL_PARAM_TYPES: [
    { name: 'to', type: 'address' },
    { name: 'data', type: 'bytes' }
  ],
  
  EXECUTE_PARTIAL_SIGNED_DELEGATE_CALL_PARAM_TYPES: [
    { name: 'to', type: 'address' },
    { name: 'data', type: 'bytes' }
  ],

  CANCEL_PARAM_TYPES: []
}
