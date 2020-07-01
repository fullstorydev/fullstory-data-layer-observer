import { expect } from 'chai';
import 'mocha';

import * as CEDDL from './data/CEDDL';
import { PickOperator } from '../src/operators';

const data = {
  id: 'a1b2c3',
  email: 'danfalco@fullstory.com',
  favorites: {
    color: 'red'
  },
  contact: {
    email: 'daniel.falco@fullstory.com'
  },
  aliases: ['danny', 'danoh']
};

describe('pick operator unit tests', () => {

  it('it should not validate undefined properties', () => {
    // @ts-ignore
    const pick = new PickOperator({ name: 'pick' })
    expect(pick.validate.bind(pick)).to.throw();
  });

  it('it should not validate invalid type properties', () => {
    // @ts-ignore
    const pick = new PickOperator({ name: 'pick', properties: 1 })
    expect(pick.validate.bind(pick)).to.throw();
  });

  it('it should not validate empty string', () => {
    const pick = new PickOperator({ name: 'pick', properties: '' })
    expect(pick.validate.bind(pick)).to.throw();
  });

  it('it should not validate empty array', () => {
    const pick = new PickOperator({ name: 'pick', properties: [] })
    expect(pick.validate.bind(pick)).to.throw();
  });

  it('it should not validate leading commas', () => {
    const pick = new PickOperator({ name: 'pick', properties: ',foo,bar' })
    expect(pick.validate.bind(pick)).to.throw();
  });

  it('it should not validate trailing commas', () => {
    const pick = new PickOperator({ name: 'pick', properties: 'foo,bar,' })
    expect(pick.validate.bind(pick)).to.throw();
  });

  it('it should pick array properties from an object', () => {
    const pick = new PickOperator({ name: 'pick', properties: ['id', 'email'] })
    const output = pick.handleData([data]);

    expect(output).to.not.be.null;
    expect(output![0].id).to.eq(data.id);
    expect(output![0].email).to.eq(data.email);
    expect(output![0].contact).to.be.undefined;
  });

  it('it should pick csv properties from an object', () => {
    const pick = new PickOperator({ name: 'pick', properties: 'id,email' })
    const output = pick.handleData([data]);

    expect(output).to.not.be.null;
    expect(output![0].id).to.eq(data.id);
    expect(output![0].email).to.eq(data.email);
    expect(output![0].contact).to.be.undefined;
  });

  it('it should pick an object at a given index', () => {
    const pick = new PickOperator({ name: 'pick', properties: 'id', index: 1 })
    const output = pick.handleData(['Signed Up', data]);

    expect(output).to.not.be.null;
    expect(output![1].id).to.eq(data.id);
  });

  it('it should pick the same properties at different depths', () => {
    const pick = new PickOperator({ name: 'pick', properties: 'id,contact,email' })
    const output = pick.handleData([data]);

    expect(output).to.not.be.null;
    expect(output![0].id).to.eq(data.id);
    expect(output![0].email).to.eq(data.email);
    expect(output![0].contact.email).to.eq(data.contact.email);
  });

  it('it should find properties at different depths', () => {
    const pick = new PickOperator({ name: 'pick', properties: 'id,favorites,color' })
    const output = pick.handleData([data]);

    expect(output).to.not.be.null;
    expect(output![0].id).to.eq(data.id);
    expect(output![0].favorites.color).to.eq(data.favorites.color);
  });

  it('it should not go below a certain depth', () => {
    const pick = new PickOperator({ name: 'pick', properties: 'id,contact,email', maxDepth: 0 })
    const output = pick.handleData([data]);

    expect(output).to.not.be.null;
    expect(output![0].id).to.eq(data.id);
    expect(output![0].email).to.eq(data.email);
    expect(output![0].contact).to.be.undefined;
  });

  it('it should not split an array into its elements', () => {
    const pick = new PickOperator({ name: 'pick', properties: 'aliases' })
    const output = pick.handleData([data]);

    expect(output).to.not.be.null;
    expect(output![0].aliases[1]).to.eq(data.aliases[1]);
  });

  it('it should not mutate the input data', () => {
    const pick = new PickOperator({ name: 'pick', properties: 'id' })
    const output = pick.handleData([data]);

    expect(output).to.not.be.null;

    output![0].id = 'diff';
    expect(output![0].id).to.not.eq(data.id);
  });

  it('it should pick data from CEDDL', () => {
    const { basicDigitalData, ceddlVersion } = CEDDL;
    expect(basicDigitalData.version).to.not.be.undefined;
    expect(basicDigitalData.page.pageInfo.pageID).to.not.be.undefined;

    const pick = new PickOperator({
      name: 'pick',
      properties: 'version,page,pageInfo,pageID'
    })
    const output = pick.handleData([basicDigitalData]);
    expect(output).to.not.be.null;
    expect(output![0].version).to.eq(ceddlVersion);
    expect(output![0].page.pageInfo.pageID).to.eq(basicDigitalData.page.pageInfo.pageID);
  });

});