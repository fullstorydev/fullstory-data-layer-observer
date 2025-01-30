let callQueues: any[] = [];

export function fullstoryMock(...args:any[]) {
  callQueues.push(args);
}

export function clearCallQueues() {
  callQueues = [];
}

export function getCallQueues() : any {
  return callQueues;
}
