let callQueues: any[] = [];

export function fullstoryMock(...args: any[]) {
  callQueues.push(args);
}

/**
 * Minimal FullStory Browser API v2-style callable for FS('observe', { type, callback }).
 * Invokes each `start` callback once when registered (mirrors capture-already-started behavior).
 */
export function createFullStoryObserveMock() {
  const shutdownCbs: Array<() => void> = [];
  const startCbs: Array<() => void> = [];
  const fs = (cmd: string, opts: { type: string; callback: () => void }) => {
    if (cmd !== 'observe') {
      return;
    }
    if (opts.type === 'shutdown') {
      shutdownCbs.push(opts.callback);
    } else if (opts.type === 'start') {
      startCbs.push(opts.callback);
      opts.callback();
    }
  };
  return {
    fs,
    fireShutdown: () => {
      shutdownCbs.forEach((cb) => {
        cb();
      });
    },
    fireStart: () => {
      startCbs.forEach((cb) => {
        cb();
      });
    },
  };
}

export function clearCallQueues() {
  callQueues = [];
}

export function getCallQueues() : any {
  return callQueues;
}
