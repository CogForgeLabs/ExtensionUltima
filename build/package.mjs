// Zip each built target into packages/extensionultima-<target>-<version>.zip for store upload.
// Run `npm run build` first. Uses adm-zip (pure JS, cross-platform).
import AdmZip from 'adm-zip';
import { mkdir, readFile, readdir, rm } from 'node:fs/promises';

const VERSION = JSON.parse(await readFile('package.json', 'utf8')).version;
const targets = ['chrome', 'firefox', 'edge', 'safari'];
const outDir = 'packages';

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const target of targets) {
  const src = `dist/${target}`;
  let files;
  try {
    files = await readdir(src);
  } catch {
    console.warn(`skip ${target}: ${src} not found — run "npm run build" first`);
    continue;
  }
  const zip = new AdmZip();
  for (const f of files) zip.addLocalFile(`${src}/${f}`);
  const out = `${outDir}/extensionultima-${target}-${VERSION}.zip`;
  zip.writeZip(out);
  console.log(`packaged ${out}`);
}

console.log('\nDone. Upload the per-store zip from packages/.');
