export class EndpointError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'EndpointError';
    this.code = code;
    this.details = details;
  }
}
export const ERROR_CODES = {
  incompatibleSchema: 'NODE-LOCALDB-1001',
  identityStorageFailed: 'NODE-IDENTITY-1001',
  provisioningFailed: 'NODE-PROVISIONING-1001',
  pairingUnavailable: 'NODE-PAIRING-1001',
  cloudConnectionFailed: 'NODE-CLOUD-1001',
  localApiFailed: 'NODE-LOCALAPI-1001',
  unauthorizedLocalApi: 'NODE-LOCALAPI-1002',
  commandRejected: 'NODE-COMMAND-1001',
  unsupportedCommand: 'NODE-COMMAND-1002',
  expiredCommand: 'NODE-COMMAND-1003',
  configurationRevisionMismatch: 'NODE-COMMAND-1004',
  missingCapability: 'NODE-COMMAND-1005',
  commandExecutionFailed: 'NODE-COMMAND-1006',
  configurationRejected: 'NODE-CONFIGURATION-1001',
  configurationActivationFailed: 'NODE-CONFIGURATION-1002',
  statePublishFailed: 'NODE-STATE-1001',
  staleReportedState: 'NODE-STATE-1002',
  eventUploadFailed: 'NODE-EVENT-1001',
  diagnosticBundleFailed: 'NODE-DIAGNOSTICS-1001',
  packageValidationFailed: 'NODE-PACKAGE-1001'
};
Object.assign(ERROR_CODES, {
  adapterContractInvalid: 'NODE-ADAPTER-1001',
  adapterStartFailed: 'NODE-ADAPTER-1002',
  adapterStopFailed: 'NODE-ADAPTER-1003',
  adapterHealthDegraded: 'NODE-ADAPTER-1004',
  touchdesignerBridgeFailed: 'NODE-TOUCHDESIGNER-1001',
  touchdesignerProtocolRejected: 'NODE-TOUCHDESIGNER-1002',
  touchdesignerRestartLimitReached: 'NODE-TOUCHDESIGNER-1003'
});
