import axios from 'axios'
import { setupServer } from 'msw/node'
import { RestHandler, RESTMethods } from 'msw'
import { Handler } from './Handler'

const server = setupServer()

beforeAll(() => server.listen())
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

it.each([
  ['get', RESTMethods.GET],
  ['post', RESTMethods.POST],
  ['put', RESTMethods.PUT],
  ['patch', RESTMethods.PATCH],
  ['head', RESTMethods.HEAD],
  ['options', RESTMethods.OPTIONS],
  ['delete', RESTMethods.DELETE],
] as const)(
  'should be able to intercept `%s` requests',
  async (method, RESTMethod) => {
    const serverResponse = { message: 'request received successfully' }

    const handler = new Handler()
      .on(RESTMethod, '/endpoint')
      .reply(200, serverResponse)

    server.use(handler.run())
    const { data } = await axios[method]('/endpoint')

    expect(data).toEqual(serverResponse)
  },
)

it.each([
  ['onGet', 'get'],
  ['onPost', 'post'],
  ['onPut', 'put'],
  ['onPatch', 'patch'],
  ['onHead', 'head'],
  ['onOptions', 'options'],
  ['onDelete', 'delete'],
] as const)('should support `%s` alias', async (alias, method) => {
  const handler = new Handler()

  handler[alias]('/endpoint').reply(200, {
    message: 'request received successfully',
  })

  server.use(handler.run())
  const { status } = await axios[method]('/endpoint')

  expect(status).toEqual(200)
})

it('can have a name', () => {
  const handler = new Handler().onGet('/users').reply(200).as('getAllUsers')

  expect(handler.name).toEqual('getAllUsers')
})

it('should trow error if no url provided', () => {
  const handler = new Handler().reply(200, {})
  expect(() => server.use(handler.run())).toThrowError('No url provided')
})

it('should generate an MSW RestHandler', () => {
  const handler = new Handler().onGet('/endpoint')
  expect(handler.run()).toBeInstanceOf(RestHandler)
})

it('should be able to create a handler with empty response body', async () => {
  const handler = new Handler().onGet('/endpoint').reply(200)

  server.use(handler.run())
  const { data } = await axios.get('/endpoint')

  expect(data).toEqual('')
})

it('should be able to create a handler with the constrained request payload', async () => {
  type Request = { email: string; password: string }
  type Response = { success: boolean; message: string }

  const handler = new Handler()
    .onPost('/register')
    .withPayload<Request>({
      email: 'user@example.com',
      password: 'secret',
    })
    .reply<Response>(200, {
      success: true,
      message: 'User registered successfully.',
    })

  server.use(handler.run())

  const { data, status } = await axios.post('/register', {
    email: 'user@example.com',
    password: 'secret',
  })

  expect(status).toEqual(200)
  expect(data).toEqual({
    success: true,
    message: 'User registered successfully.',
  })

  await expect(async () => {
    await axios.post('/register', { email: 'user@example.com' })
  }).rejects.toThrowError()
})

it('should be able to create a handler with the constrained request params', async () => {
  const serverResponse = { success: true, users: {} }

  const handler = new Handler()
    .onGet('/users')
    .withParams({ admin: 'true' })
    .reply(200, serverResponse)

  server.use(handler.run())
  const { data, status } = await axios.get('/users?admin=true')

  expect(status).toEqual(200)
  expect(data).toEqual(serverResponse)

  await expect(async () => await axios.get('/users')).rejects.toThrowError()
})
