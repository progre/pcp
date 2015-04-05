/// <reference path="../typings.d.ts" />
require('es6-shim');

try { // optional
    require('source-map-support').install();
} catch (e) {
}

import log4js = require('log4js');
log4js.configure({
    appenders: [{ type: 'console' }],
    levels: { 'log4js': 'ERROR' }
});
if (global.describe == null) {
    try { // optional
        log4js.configure('./log.json', { reloadSecs: 300 });
    } catch (e) {
    }
}

import pcp = require('./pcp');
export = pcp;