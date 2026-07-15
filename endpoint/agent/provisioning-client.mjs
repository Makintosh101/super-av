import { EndpointError, ERROR_CODES } from './errors.mjs';
export class ProvisioningClient {
  constructor({ baseUrl, fetchImpl = fetch, logger }) { this.baseUrl = baseUrl; this.fetch = fetchImpl; this.logger = logger; }
  async registerUnclaimed(identity, commissioning = {}) {
    const response = await this.fetch(`${this.baseUrl}/api/v1/node/registrations`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ deviceId: identity.deviceId, installationId: identity.installationId, publicKey: identity.publicKeyPem, fingerprint: identity.fingerprint, commissioning }) });
    if (!response.ok) throw new EndpointError(ERROR_CODES.provisioningFailed, 'Unclaimed device registration failed.', { status: response.status });
    return response.json();
  }
  async getRegistrationStatus(registrationId) {
    const response = await this.fetch(`${this.baseUrl}/api/v1/node/registrations/${encodeURIComponent(registrationId)}`);
    if (!response.ok) throw new EndpointError(ERROR_CODES.provisioningFailed, 'Registration status poll failed.', { status: response.status });
    return response.json();
  }
}
