import { expect } from 'chai';
import 'mocha';

import {
  Suffixes, SuffixedObject, SuffixableValue, SuffixOperator,
} from '../src/operators/suffix';

const date = new Date();

const testData: any = {
  id: '130983678493',
  first_name: 'Daniel',
  last_name: 'Falco',
  price: 49.99,
  quantity: 1,
  region: 0,
  isFeatured: true,
  listedPages: [true, false, false],
  created: date,
  shippingDates: [date, date, date],
  discountTiers: [1, 2, 3],
  discountPrices: [45.00, 40.50, 29.99],
  variants: ['red', 'blue', 'green'],
  child: {
    first_name: 'Danny',
    last_name: 'Falco Jr.',
    fn: () => { console.log('child object'); }, // eslint-disable-line no-console
  },
  grandchildren: [
    {
      first_name: 'Danny',
      last_name: 'Falco III',
      fn: () => { console.log('grandchild object'); }, // eslint-disable-line no-console
    },
    {
      first_name: 'Danny',
      last_name: 'Falco IV',
      fn: () => { console.log('grandchild object'); }, // eslint-disable-line no-console
    },
  ],
};

describe('suffix operator unit test', () => {
  it('it should validate options', () => {
    expect(() => new SuffixOperator({
      name: 'suffix',
    }).validate()).to.not.throw();

    expect(() => new SuffixOperator({
      name: 'suffix', index: 1,
    }).validate()).to.not.throw();

    expect(() => new SuffixOperator({
      name: 'suffix', maxDepth: 3,
    }).validate()).to.not.throw();
  });

  it('it should not change the original object', () => {
    const operator = new SuffixOperator({ name: 'suffix' });
    const customList = [{ event: 'test', data: { foo: 'bar' } }];
    const [suffixedData] = operator.handleData(customList)!;
    expect(suffixedData.event_str).to.not.be.undefined;
    expect(suffixedData.data_obj.foo_str).to.not.be.undefined;
    expect(customList[0].event).to.not.be.undefined;
    expect(customList[0].data.foo).to.not.be.undefined;
    // @ts-ignore
    expect(customList[0].event_str).to.be.undefined;
    // @ts-ignore
    expect(customList[0].data_obj).to.be.undefined;
  });

  it('it should not suffix undefineds', () => {
    const operator = new SuffixOperator({ name: 'suffix' });
    expect(operator).to.not.be.undefined;

    const [suffixedObject] = operator.handleData([undefined])!;

    expect(suffixedObject).to.not.be.undefined;
    expect(Object.getOwnPropertyNames(suffixedObject).length).to.eq(0);
  });

  it('it should not suffix required FullStory naming conventions', () => {
    const operator = new SuffixOperator({ name: 'suffix' });
    expect(operator).to.not.be.undefined;

    const [suffixedObject] = operator.handleData([{
      pageName: 'homepage',
      displayName: 'Data Layer Observer',
      email: 'dlo@fullstory.com',
      child: {
        pageName: 'homepage',
        displayName: 'Data Layer Observer',
        email: 'dlo@fullstory.com',
      },
    }])!;

    expect(suffixedObject).to.not.be.undefined;
    expect(suffixedObject.pageName).to.not.be.undefined;
    expect(suffixedObject.pageName_str).to.be.undefined;
    expect(suffixedObject.displayName).to.not.be.undefined;
    expect(suffixedObject.displayName_str).to.be.undefined;
    expect(suffixedObject.email).to.not.be.undefined;
    expect(suffixedObject.email_str).to.be.undefined;

    expect(suffixedObject.child_obj.pageName).to.be.undefined;
    expect(suffixedObject.child_obj.pageName_str).to.not.be.undefined;
    expect(suffixedObject.child_obj.displayName).to.be.undefined;
    expect(suffixedObject.child_obj.displayName_str).to.not.be.undefined;
    expect(suffixedObject.child_obj.email).to.be.undefined;
    expect(suffixedObject.child_obj.email_str).to.not.be.undefined;
  });

  it('it should suffix all properties in object', () => {
    const operator = new SuffixOperator({ name: 'suffix' });
    expect(operator).to.not.be.undefined;

    const [suffixedObject] = operator.handleData([testData])!;

    Object.getOwnPropertyNames(suffixedObject).forEach((prop) => {
      if (prop !== 'child_obj') {
        expect(prop).to.contain('_');
      }
    });

    Object.getOwnPropertyNames(suffixedObject).forEach((prop) => {
      expect(prop).to.not.contain('fn');
    });
  });

  it('all numbers are suffixed as a real', () => {
    const operator = new SuffixOperator({ name: 'suffix' });
    expect(operator).to.not.be.undefined;

    const [suffixedObject] = operator.handleData([testData])!;

    expect(suffixedObject.quantity_real).to.not.be.undefined;
    expect(suffixedObject.quantity_real).to.eql(testData.quantity);

    expect(suffixedObject.discountTiers_reals).to.not.be.undefined;
    expect(suffixedObject.discountTiers_reals).to.eql(testData.discountTiers);

    expect(suffixedObject.region_real).to.not.be.undefined;
    expect(suffixedObject.region_real).to.eql(testData.region);
  });

  it('it should suffix child properties in object', () => {
    const operator = new SuffixOperator({ name: 'suffix' });
    expect(operator).to.not.be.undefined;

    const [suffixedObject] = operator.handleData([testData])!;

    expect(suffixedObject.child_obj).to.not.be.undefined;
    Object.getOwnPropertyNames(suffixedObject.child_obj).forEach((prop) => {
      expect(prop).to.contain('_');
    });
  });

  it('it should suffix each obj within an array', () => {
    const operator = new SuffixOperator({ name: 'suffix' });
    expect(operator).to.not.be.undefined;

    const [suffixedObject] = operator.handleData([testData])!;

    expect(suffixedObject.grandchildren_objs).to.not.be.undefined;
    const array: SuffixedObject[] = suffixedObject.grandchildren_objs as SuffixedObject[];

    array.forEach((item) => {
      Object.getOwnPropertyNames(item).forEach((prop) => {
        expect(prop).to.contain('_');
      });
    });
  });

  it('it should not copy functions', () => {
    const fnObj: any = {
      fn: () => { console.log('root object'); }, // eslint-disable-line no-console
    };

    const operator = new SuffixOperator({ name: 'suffix' });
    expect(operator).to.not.be.undefined;

    const [suffixedObject] = operator.handleData([fnObj])!;
    expect(Object.getOwnPropertyNames(suffixedObject).length).to.eq(0);
  });

  it('it should not copy mixed arrays', () => {
    const mixed: any = {
      mixedArray: ['red', 1, 'blue', '2'],
    };
    const operator = new SuffixOperator({ name: 'suffix' });
    expect(operator).to.not.be.undefined;

    const suffixedObject = operator.handleData([mixed])!;
    expect(Object.getOwnPropertyNames(suffixedObject[0]).length).to.eq(0);
  });

  it('it should suffix all possible FS types', () => {
    const operator = new SuffixOperator({ name: 'suffix' });
    expect(operator).to.not.be.undefined;

    const [suffixedObject] = operator.handleData([testData])!;
    const suffixedObjectProps = Object.getOwnPropertyNames(suffixedObject);

    Object.keys(Suffixes).forEach((key) => {
      const suffix = (Suffixes as any)[key];
      const hasSuffix = suffixedObjectProps.filter((p) => p.indexOf(suffix) > -1) !== undefined;
      expect(hasSuffix, `Suffix ${suffix} not found`).to.be.true;
    });
  });

  it('it should suffix types correctly', () => {
    const operator = new SuffixOperator({ name: 'suffix' });
    expect(operator).to.not.be.undefined;

    const [suffixedObject] = operator.handleData([testData])!;

    expect(suffixedObject).to.haveOwnProperty('id_str');
    expect(suffixedObject).to.haveOwnProperty('price_real');
    expect(suffixedObject).to.haveOwnProperty('quantity_real');
    expect(suffixedObject).to.haveOwnProperty('isFeatured_bool');
    expect(suffixedObject).to.haveOwnProperty('listedPages_bools');
    expect(suffixedObject).to.haveOwnProperty('created_date');
    expect(suffixedObject).to.haveOwnProperty('shippingDates_dates');
    expect(suffixedObject).to.haveOwnProperty('discountTiers_reals');
    expect(suffixedObject).to.haveOwnProperty('discountPrices_reals');
    expect(suffixedObject).to.haveOwnProperty('variants_strs');
  });

  it('it should re-assign values correctly', () => {
    const operator = new SuffixOperator({ name: 'suffix' });
    expect(operator).to.not.be.undefined;

    const [suffixedObject] = operator.handleData([testData])!;

    Object.getOwnPropertyNames(suffixedObject).forEach((prop) => {
      if (prop !== 'child_obj' && prop !== 'grandchildren_objs') {
        expect(suffixedObject[prop], `${prop} does not have the same value`).to.eq(
          testData[prop.substring(0, prop.lastIndexOf('_'))],
        );
      }
    });

    const child = suffixedObject.child_obj as SuffixedObject;
    Object.getOwnPropertyNames(child).forEach((prop) => {
      expect(child[prop], `${prop} does not have the same value`).to.eq(
        testData.child[prop.substring(0, prop.lastIndexOf('_'))],
      );
    });

    expect((suffixedObject.grandchildren_objs as SuffixableValue[]).length).to.eq(testData.grandchildren.length);
  });

  it('it should not suffix objects beyond a desired depth', () => {
    const nestedObj: any = {
      1: {
        level: '1',
        2: {
          level: '2',
          3: {
            level: '3',
            4: {
              level: '4',
              5: {
                level: '5',
              },
            },
          },
        },
      },
    };

    const operator = new SuffixOperator({ name: 'suffix', maxDepth: 3 });
    expect(operator).to.not.be.undefined;

    const [suffixedObject] = operator.handleData([nestedObj])!;

    // @ts-ignore
    expect(suffixedObject['1_obj']['2_obj']['3_obj']).to.not.be.undefined;

    // @ts-ignore
    expect(suffixedObject['1_obj']['2_obj']['3_obj']['4_obj']).to.be.undefined;
  });

  it('it should not infinitely suffix', () => {
    const a: any = {};
    const b: any = { a };
    a.b = b;

    // results in Converting circular structure to JSON
    // console.log(JSON.stringify(a));

    const operator = new SuffixOperator({ name: 'suffix', maxDepth: 3 });
    expect(operator).to.not.be.undefined;

    const [suffixedObject] = operator.handleData([a])!;

    // @ts-ignore
    expect(suffixedObject.b_obj.a_obj.b_obj.a_obj).to.be.undefined;
  });

  it('it should suffix using a negative index', () => {
    const message = 'Hello World';

    const operator = new SuffixOperator({ name: 'suffix', index: -1 });
    const [eventName, suffixedObject] = operator.handleData(['Message Event', { message }])!;

    expect(eventName).to.eq('Message Event');
    expect(suffixedObject.message_str).to.eq(message);
  });

  it('it should account for FS.event source param usage', () => {
    const operator = new SuffixOperator({ name: 'suffix' });
    expect(operator).to.not.be.undefined;

    const [eventName, suffixedObject, source] = operator.handleData(['event', testData, 'mocha'])!;
    expect(eventName).to.eq('event');
    expect(source).to.eq('mocha');
    expect(suffixedObject.id_str).to.not.be.undefined;
  });
});
