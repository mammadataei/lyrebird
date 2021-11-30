import axios from 'axios'
import { setupServer } from 'msw/node'
import { RestHandler, RESTMethods } from 'msw'
import { Handler } from './Handler'

const server = setupServer()

beforeAll(() => server.listen())
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

it('should intercept `GET` requests by default if no method provided', async () => {
  const handler = new Handler().setUrl('/endpoint').setResponseCode(200)

  server.use(handler.handle())
  const { status } = await axios.get('/endpoint')

  expect(status).toEqual(200)
})

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
      .setMethod(RESTMethod)
      .setUrl('/endpoint')
      .setResponseCode(200)
      .setResponseBody(serverResponse)

    server.use(handler.handle())
    const { data } = await axios[method]('/endpoint')

    expect(data).toEqual(serverResponse)
  },
)

it('should trow error if no url provided', () => {
  const handler = new Handler().setResponseCode(200)
  expect(() => server.use(handler.handle())).toThrowError('No url provided')
})

it('should generate an MSW RestHandler', () => {
  const handler = new Handler().setUrl('/endpoint')
  expect(handler.handle()).toBeInstanceOf(RestHandler)
})

it('should be able to create a handler with empty response body', async () => {
  const handler = new Handler()
    .setMethod(RESTMethods.GET)
    .setUrl('/endpoint')
    .setResponseCode(200)

  server.use(handler.handle())
  const { data } = await axios.get('/endpoint')

  expect(data).toEqual('')
})

it('should be able to create a handler with the constrained request payload', async () => {
  type Request = { email: string; password: string }
  type Response = { success: boolean; message: string }

  const handler = new Handler()
    .setMethod(RESTMethods.POST)
    .setUrl('/register')
    .setRequestPayload<Request>({
      email: 'user@example.com',
      password: 'secret',
    })
    .setResponseCode(200)
    .setResponseBody<Response>({
      success: true,
      message: 'User registered successfully.',
    })

  server.use(handler.handle())

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
    .setMethod(RESTMethods.GET)
    .setUrl('/users')
    .setRequestParams({ admin: 'true' })
    .setResponseCode(200)
    .setResponseBody(serverResponse)

  server.use(handler.handle())
  const { data, status } = await axios.get('/users?admin=true')

  expect(status).toEqual(200)
  expect(data).toEqual(serverResponse)

  await expect(async () => await axios.get('/users')).rejects.toThrowError()
})
