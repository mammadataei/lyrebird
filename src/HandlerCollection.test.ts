import { RestHandler } from './RestHandler'
import { HandlerCollection } from './HandlerCollection'

it('should be able to collect a single handler', () => {
  const getAllUsersHandler = new RestHandler()
    .onGet('/user')
    .reply(200)
    .as('getUsers')

  const collection = new HandlerCollection()
  collection.collect(getAllUsersHandler)

  expect(collection.find('getUsers')).toEqual(getAllUsersHandler)
})

it('should be able to collect multiple handlers', () => {
  const getAllUsersHandler = new RestHandler()
    .onGet('/user')
    .reply(200)
    .as('getUsers')

  const registrationHandler = new RestHandler()
    .onPost('/register')
    .reply(200, {
      success: true,
      message: 'users registered successfully.',
    })
    .as('register')

  const collection = new HandlerCollection()
  collection.collect(getAllUsersHandler, registrationHandler)

  expect(collection.find('getUsers')).toEqual(getAllUsersHandler)
  expect(collection.find('register')).toEqual(registrationHandler)
})

it('should trow appropriate error when the handler does not have a name', () => {
  const handlerWithoutName = new RestHandler().onGet('/user').reply(200)

  const collection = new HandlerCollection()

  expect(() => collection.collect(handlerWithoutName)).toThrowError(
    'Lyrebird: Each handler should contain a name to be stored in the collection. \n' +
      'For future reference, name your handler using the `as("...")` method',
  )
})

it('should trow appropriate error requested handler does not exist in the collection', () => {
  const collection = new HandlerCollection()

  expect(() => collection.find('invalidHandler')).toThrowError(
    `Lyrebird: No Handler found with the given name \`invalidHandler\` in the collection.`,
  )
})
