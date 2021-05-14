import { expect } from 'chai';
import 'mocha';

import { OperatorFactory } from '../src/factory';
import { RenameOperator } from '../src/operators';

const item = {
  num: 5,
  empty: '',
  nulled: null,
  numString: '10',
  obj: { prop: 'val' },
  list: [1, 2, 3, 5, 8, 13],
};

describe('rename operator unit tests', () => {
  it('should validate options', () => {
    expect(() => new RenameOperator(
      { name: 'rename', properties: { num: 'int' } },
    ).validate()).to.not.throw();

    expect(() => new RenameOperator(
      // @ts-ignore
      { name: 'rename' },
    ).validate()).to.throw();

    expect(() => new RenameOperator(
      { name: 'rename', properties: {} },
    ).validate()).to.throw();

    expect(() => new RenameOperator(
      // @ts-ignore
      { name: 'rename', properties: 5 },
    ).validate()).to.throw();

    expect(() => new RenameOperator(
      // @ts-ignore
      { name: 'rename', properties: { num: 23 } },
    ).validate()).to.throw();
  });

  it('it should not change the original object', () => {
    const operator = OperatorFactory.create(
      'rename',
      {
        name: 'rename-test',
        properties: {
          data: 'datum',
        },
      },
    );

    const customList = [{ event: 'test', data: { foo: 'bar' } }];
    const [flatData] = operator.handleData(customList)!;
    expect(customList[0].data).to.not.be.undefined;
    expect(flatData.data).to.be.undefined;
    expect(flatData.datum).to.be.not.undefined;
  });

  it('should rename properties', () => {
    const operator = OperatorFactory.create(
      'rename',
      {
        name: 'rename-test',
        properties: {
          num: 'int',
          empty: 'nothing',
          nulled: 'void',
          numString: 'numStr',
          obj: 'obje',
          list: 'traversal',
          notThere: 'stillNotThere',
        },
      },
    );
    const [val] = operator.handleData([item])!;
    expect(val).to.not.be.null;
    expect(val.num).to.be.undefined;
    expect(item.num).to.not.be.undefined;
    expect(val.int).to.eq(item.num);
    expect(val.nothing).to.eq(item.empty);
    expect(val.void).to.eq(item.nulled);
    expect(val.numStr).to.eq(item.numString);
    expect(val.obje).to.eq(item.obj);
    expect(val.traversal).to.eq(item.list);
    expect(val.notThere).to.be.undefined;
    expect(val.stillNotThere).to.be.undefined;
  });

  it('should fail on non-objects', () => {
    const operator = OperatorFactory.create(
      'rename',
      {
        name: 'another-rename-test',
        properties: {
          num: 'int',
        },
      },
    );
    expect(() => { operator.handleData([23]); }).to.throw();
  });
});
