import { EndpointError, ERROR_CODES } from './errors.mjs';

const OFFLINE_ROLES = new Set(['User', 'Technician']);
const CLOUD_ONLY_ACTIONS = new Set(['ownership.update', 'certificate.rotate', 'tenantMembership.update', 'cloudSecurity.update']);

export class OfflineControlBoundary {
  constructor({ dispatcher, cachedRoomActions, draftStore, now = () => new Date() }) {
    this.dispatcher = dispatcher;
    this.cachedRoomActions = new Set(cachedRoomActions);
    this.draftStore = draftStore;
    this.now = now;
  }

  async execute(command) {
    if (!OFFLINE_ROLES.has(command.actorRole)) throw new EndpointError(ERROR_CODES.commandRejected, 'Only cached User and Technician controls are permitted offline.');
    if (CLOUD_ONLY_ACTIONS.has(command.action)) throw new EndpointError(ERROR_CODES.commandRejected, 'Ownership, certificate, tenant membership and cloud security changes remain cloud-only.');
    if (!this.cachedRoomActions.has(command.action)) throw new EndpointError(ERROR_CODES.unsupportedCommand, 'Offline command is not a cached permitted room action.');
    return this.dispatcher.dispatch({ ...command, source: 'offlineLocal' });
  }

  async createDraftProgramming({ actorRole, draft }) {
    if (actorRole !== 'Technician') throw new EndpointError(ERROR_CODES.commandRejected, 'Only Technician may create offline draft programming.');
    const record = { ...draft, status: 'draft', requiresCloudReview: true, createdAt: this.now().toISOString() };
    await this.draftStore.save(record);
    return record;
  }
}
