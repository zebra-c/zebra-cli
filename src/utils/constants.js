const { name, version } = require('../../package.json');

const DOWN_NAME = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.template`;
const PROMPTS_NAME = 'prompts.js'
const SCAN_FILE = ['.js', '.json', '.env', '.env.dev']

module.exports = {
  name,
  version,
  DOWN_NAME,
  PROMPTS_NAME,
  SCAN_FILE,
};