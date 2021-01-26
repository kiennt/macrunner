import Test from '../src/index';

describe('test', () => {
  it('foo return foo', () => {
    const t = new Test();
    expect(t.foo()).toEqual('foo');
  });
});
