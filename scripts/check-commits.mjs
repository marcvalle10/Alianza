import { execFileSync } from 'node:child_process';

const event = process.env.GITHUB_EVENT_NAME;
const base = process.env.COMMIT_BASE;
const head = process.env.COMMIT_HEAD || 'HEAD';
const validBase = base && !/^0+$/.test(base);
const args = validBase ? [`${base}..${head}`] : [head];
const subjects = execFileSync('git', ['log', '--format=%s', '--no-merges', ...args], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const convention = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_./-]+\))?!?: .+$/;
const invalid = subjects.filter(subject => !convention.test(subject));
if (invalid.length) {
  console.error('Commits sin convención:', invalid);
  process.exit(1);
}
console.log(`Convención correcta: ${subjects.length} commits (${event || 'local'}).`);

