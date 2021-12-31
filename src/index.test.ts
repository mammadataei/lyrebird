import * as Exports from '.'

it('should properly expose classes and utilities', () => {
  expect(Object.keys(Exports)).toEqual([
    'MockServer',
    'HandlerCollection',
    'RestHandler',
  ])
})
