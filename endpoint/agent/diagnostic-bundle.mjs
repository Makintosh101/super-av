import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { sanitizeLogFields } from './logger.mjs';
import { EndpointError, ERROR_CODES } from './errors.mjs';

export async function exportDiagnosticBundle({ outputPath, logsDirectory, configurationSummary = {}, versions = {}, recentHealth = [], recentCommands = [], environmentSummary = {}, now = () => new Date() }) {
  if (!outputPath) throw new EndpointError(ERROR_CODES.diagnosticBundleFailed, 'Diagnostic bundle output path is required.');
  const logs = logsDirectory ? await readLogs(logsDirectory) : [];
  const bundle = sanitizeLogFields({
    bundleVersion: 'phase1.diagnostics.v1',
    generatedAt: now().toISOString(),
    configurationSummary,
    versions,
    recentHealth,
    recentCommands,
    environmentSummary,
    logs
  });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(bundle, null, 2));
  return { outputPath, generatedAt: bundle.generatedAt, logFilesIncluded: logs.length, sensitiveValuesRedacted: true };
}

async function readLogs(directory) {
  const entries = await readdir(directory).catch((error) => { if (error.code === 'ENOENT') return []; throw error; });
  const logs = [];
  for (const entry of entries) {
    const path = join(directory, entry);
    const info = await stat(path);
    if (!info.isFile()) continue;
    logs.push({ file: basename(entry), content: await readFile(path, 'utf8') });
  }
  return logs;
}
