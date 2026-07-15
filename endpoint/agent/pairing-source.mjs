export class PairingDisplaySource {
  constructor({ provisioningClient }) { this.client = provisioningClient; this.currentSession = null; }
  async requestSession(deviceId) {
    const response = await this.client.fetch(`${this.client.baseUrl}/api/v1/pairing/sessions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ deviceId }) });
    if (!response.ok) throw new Error('Pairing session request failed.');
    const session = await response.json();
    this.currentSession = session;
    return session;
  }
  current(now = new Date()) {
    if (!this.currentSession) return { status: 'unavailable' };
    if (this.currentSession.claimedAt || new Date(this.currentSession.expiresAt) <= now) return { status: 'expired' };
    return { status: 'active', code: this.currentSession.code, expiresAt: this.currentSession.expiresAt, confirmationPhrase: this.currentSession.confirmationPhrase };
  }
}
