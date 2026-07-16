export function createTouchDesignerProjectManifest({ projectVersion, packageId = 'touchdesigner-phase1-project', sha256, signature, requiredTouchDesignerVersion = '2023.10000', assetReferences = [] } = {}) {
  if (!projectVersion || !sha256 || !signature) throw new Error('projectVersion, sha256 and signature are required.');
  return { manifestVersion: 'phase1.touchdesigner-package.v1', package: { id: packageId, type: 'touchdesignerProject', version: projectVersion, sha256 }, signature: { algorithm: 'RSASSA-PKCS1-v1_5-SHA256', value: signature }, requiredTouchDesignerVersion, assetReferences, licensing: { prerequisite: 'TouchDesigner licence must be provisioned as deployment concern outside runtime logic.' } };
}

export function validateTouchDesignerProjectManifest(manifest) {
  if (manifest.package?.type !== 'touchdesignerProject') throw new Error('Manifest must describe a TouchDesigner project package.');
  if (!manifest.package.sha256 || !manifest.signature?.value || !manifest.requiredTouchDesignerVersion) throw new Error('Manifest missing hash, signature, or required TouchDesigner version.');
  return true;
}
