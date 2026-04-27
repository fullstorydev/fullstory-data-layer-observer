/**
 * Root hook plugin for Mocha (see package.json "test" script).
 * MonitorFactory is a singleton; specs that create monitors must not leak shims into later files.
 */
/* eslint-disable import/prefer-default-export -- Mocha root hook plugin API */
import MonitorFactory from '../src/monitor-factory';

export const mochaHooks = {
  afterEach() {
    MonitorFactory.getInstance().removeAll();
  },
};
