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
  unauthorizedLocalApi: 'NODE-LOCALAPI-1002'
};
