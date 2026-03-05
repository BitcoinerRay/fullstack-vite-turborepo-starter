import process from 'node:process';
import path from 'node:path';
import {config} from 'dotenv';

const cwd = process.cwd();
const paths = [
  path.resolve(cwd, '../../.env.example'),
  path.resolve(cwd, '../../.env'),
  path.resolve(cwd, '.env.example'),
  path.resolve(cwd, '.env'),
];
for (const p of paths) {
  config({path: p, override: true, quiet: true});
}
