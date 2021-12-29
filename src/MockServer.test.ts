import axios from 'axios'
import { setupServer } from 'msw/node'
import { MockServer } from './MockServer'
import { HandlerCollection } from './HandlerCollection'
import { RestHandler } from './RestHandler'

const mockServer = setupServer()

beforeAll(() => mockServer.listen())
afterAll(() => mockServer.close())
afterEach(() => mockServer.resetHandlers())

const collection = new HandlerCollection()

collection.collect(
  new RestHandler()
    .onGet('/users')
    .reply(200, {
      users: [],
    })
    .as('getAllUsers'),

  new RestHandler()
    .onPost('/register')
    .reply(200, {
      success: true,
      message: 'users registered successfully.',
    })
    .as('register'),
)

const server = new MockServer(mockServer, { collection })

describe('Using a collection', () => {
  it('should be able to get and enable a handler from collection', async () => {
    server.use('getAllUsers')

    const { data } = await axios.get('/users')
    expect(data).toEqual({ users: [] })
  })

  it('should be able to get and enable multiple handlers from collection', async () => {
    server.use('getAllUsers')
    server.use('register')

    const { data: users } = await axios.get('/users')
    expect(users).toEqual({ users: [] })

    const { data: registrationResult } = await axios.post('/register')
    expect(registrationResult).toEqual({
      success: true,
      message: 'users registered successfully.',
    })
  })

  it('should be able to get and enable multiple handlers from collection at once', async () => {
    server.use('getAllUsers', 'register')

    const { data: users } = await axios.get('/users')
    expect(users).toEqual({ users: [] })

    const { data: registrationResult } = await axios.post('/register')
    expect(registrationResult).toEqual({
      success: true,
      message: 'users registered successfully.',
    })
  })

  it('should throw an error when using handler names while no collection is provided', () => {
    expect(() => new MockServer(mockServer).use('handler')).toThrowError(
      `Lyrebird: Unable to find handler \`handler\` because there isn't a HandlerCollection ` +
        `associated with the current MockServer instance. Please consider creating a HandlerCollection ` +
        `or using an inline handler instead.`,
    )
  })

  it('should be possible to use `enable` as an alias for `use` to enable collection mocks', async () => {
    server.enable('getAllUsers', 'register')

    const { data: users } = await axios.get('/users')
    expect(users).toEqual({ users: [] })

    const { data: registrationResult } = await axios.post('/register')
    expect(registrationResult).toEqual({
      success: true,
      message: 'users registered successfully.',
    })
  })
})

describe('Using inline handlers', () => {
  it('should be able to enable an inline handler', async () => {
    server.use(
      new RestHandler().onGet('/users').reply(200, {
        users: [],
      }),
    )

    const { data } = await axios.get('/users')
    expect(data).toEqual({ users: [] })
  })

  it('should be able to enable multiple inline handlers', async () => {
    server.use(
      new RestHandler().onGet('/users').reply(200, {
        users: [],
      }),
    )

    server.use(
      new RestHandler().onPost('/register').reply(200, {
        success: true,
        message: 'users registered successfully.',
      }),
    )

    const { data: users } = await axios.get('/users')
    expect(users).toEqual({ users: [] })

    const { data: registrationResult } = await axios.post('/register')
    expect(registrationResult).toEqual({
      success: true,
      message: 'users registered successfully.',
    })
  })

  it('should be able to enable multiple inline handlers at once', async () => {
    server.use(
      new RestHandler().onGet('/users').reply(200, {
        users: [],
      }),

      new RestHandler().onPost('/register').reply(200, {
        success: true,
        message: 'users registered successfully.',
      }),
    )

    const { data: users } = await axios.get('/users')
    expect(users).toEqual({ users: [] })

    const { data: registrationResult } = await axios.post('/register')
    expect(registrationResult).toEqual({
      success: true,
      message: 'users registered successfully.',
    })
  })
})
