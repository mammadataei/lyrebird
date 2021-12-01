import axios from 'axios'
import { RESTMethods } from 'msw'
import { setupServer } from 'msw/node'
import { MockServer } from './MockServer'

const mockServer = setupServer()

beforeAll(() => mockServer.listen())
afterAll(() => mockServer.close())
afterEach(() => mockServer.resetHandlers())

const server = new MockServer(mockServer)

describe('Intercepting HTTP Methods', () => {
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

      server.on(RESTMethod, '/endpoint').reply(200, serverResponse)

      const { data } = await axios[method]('/endpoint')

      expect(data).toEqual(serverResponse)
    },
  )
})

it('response body is optional', async () => {
  server.onGet('/test').reply(200)

  const { data, status } = await axios.get('/test')

  expect(status).toEqual(200)
  expect(data).toEqual('')
})

describe('withPayload', () => {
  it('should be able to intercept requests with constrained request payload', async () => {
    server
      .onPost('/register')
      .withPayload({ email: 'user@example.com', password: 'secret' })
      .reply(200, { success: true, message: 'User registered successfully.' })

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
      await axios.post('/register', {
        email: 'user@example.com',
      })
    }).rejects.toThrowError()
  })

  it('should be able to intercept multiple requests with constrained request payload using the same instance', async () => {
    server
      .onPost('/register')
      .withPayload({ email: 'user@example.com', password: 'secret' })
      .reply(200, { success: true, message: 'User registered successfully.' })

    server
      .onPost('/posts')
      .withPayload({ title: 'New post.', content: 'Hello world.' })
      .reply(201, { success: true, message: 'Post created successfully.' })

    const registrationResponse = await axios.post('/register', {
      email: 'user@example.com',
      password: 'secret',
    })

    expect(registrationResponse.status).toEqual(200)
    expect(registrationResponse.data).toEqual({
      success: true,
      message: 'User registered successfully.',
    })

    const createPostResponse = await axios.post('/posts', {
      title: 'New post.',
      content: 'Hello world.',
    })

    expect(createPostResponse.status).toEqual(201)
    expect(createPostResponse.data).toEqual({
      success: true,
      message: 'Post created successfully.',
    })
  })
})

describe('withParams', () => {
  it('should be able to intercept a request with the constrained request params', async () => {
    server
      .onGet('/users')
      .withParams({ admin: 'true' })
      .reply(200, { success: true, users: {} })

    const { data, status } = await axios.get('/users?admin=true')

    expect(status).toEqual(200)
    expect(data).toEqual({ success: true, users: {} })

    await expect(async () => {
      await axios.get('/users')
    }).rejects.toThrowError()
  })

  it('should be able to intercept multiple requests with constrained request params using the same instance', async () => {
    server
      .onGet('/users')
      .withParams({ admin: 'true' })
      .reply(200, { success: true, users: {} })

    server
      .onGet('/posts')
      .withParams({ published: 'false' })
      .reply(200, { success: true, count: 3, posts: {} })

    const { data: users } = await axios.get('/users?admin=true')
    expect(users).toEqual({ success: true, users: {} })

    const { data: posts } = await axios.get('/posts?published=false')
    expect(posts).toEqual({ success: true, count: 3, posts: {} })
  })

  it('should be possible to intercept multiple requests with and without constrained params', async () => {
    server
      .onGet('/users')
      .withParams({ admin: 'true' })
      .reply(200, { success: true, users: {} })

    server.onGet('/posts').reply(200, { success: true, count: 3, posts: {} })

    const { data: users } = await axios.get('/users?admin=true')
    expect(users).toEqual({ success: true, users: {} })

    const { data: posts } = await axios.get('/posts')
    expect(posts).toEqual({ success: true, count: 3, posts: {} })
  })
})
