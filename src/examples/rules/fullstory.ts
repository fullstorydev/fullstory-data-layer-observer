/* eslint-disable max-len */
import { DataLayerRule } from '../../observer';

export const ceddlUser: DataLayerRule[] = [
  // send all CEDDL user properties to FS.setUserVars
  { source: 'digitalData.user', operators: [{ name: 'flatten' }], destination: 'FS.setUserVars' },
  // send all CEDDL user properties to FS.identify using the profileID as FullStory uid
  { source: 'digitalData.user', operators: [{ name: 'flatten' }, { name: 'prepend', value: 'profile[0].profileID' }], destination: 'FS.setUserVars' },
];

export const ceddlPage: DataLayerRule[] = [

];
