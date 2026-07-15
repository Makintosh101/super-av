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
  eventUploadFailed: 'NODE-EVENT-1001'
};
