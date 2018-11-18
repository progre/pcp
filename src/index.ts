// tslint:disable-next-line:no-implicit-dependencies
try { require('source-map-support').install(); } catch (e) { /* NOP */ }

import log4js from 'log4js';

log4js.configure({
  appenders: [{ type: 'console' }],
  levels: { log4js: 'ERROR' },
});
if (!('describe' in global)) {
  try { // optional
    log4js.configure('./log.json', { reloadSecs: 300 });
  } catch (e) {
    // NOP
  }
}

import pcp = require('./pcp');
export = pcp;
