export enum DataLayerEventType {
  PROPERTY = '_fs_DataLayerProperty',
  FUNCTION = '_fs_DataLayerFunction',
}

export class DataLayerDetail {
  value?: object;
  args?: any[];

  constructor(readonly target: object, readonly path: string) {

  }
}

export class FunctionDetail extends DataLayerDetail {
  constructor(target: object, public args: any[], path: string) {
    super(target, path);
  }
}

export class PropertyDetail extends DataLayerDetail {
  constructor(target: object, public value: object, path: string) {
    super(target, path);
  }
}