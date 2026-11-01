import fs from 'node:fs/promises';
import yaml from 'js-yaml';
const workflow=yaml.load(await fs.readFile('../../.github/workflows/cruixe-approved-frontend-verify.yml','utf8'));
await fs.writeFile('qa-ci/workflow-parsed.json',JSON.stringify(workflow,null,2));
console.log('Workflow YAML parsed successfully');
