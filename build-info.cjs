const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const outputFile = path.join(projectRoot, 'src', 'build-info.ts');
const requestedBuildDate = process.env.BUILD_DATE || process.env.GITHUB_RUN_STARTED_AT;
const buildDate = requestedBuildDate || new Date().toISOString();
const content = `export const buildInfo = {
  buildDate: ${JSON.stringify(buildDate)}
};
`;

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, content, 'utf8');
