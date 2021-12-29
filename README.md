<br/>

<h1 align='center'>Lyrebird</h1>

<p align='center'>A wrapper for writing more reusable and cleaner mocks using mswjs.io.</p>

<br/>

## Introduction

MSW is a great API mocking library for creating API mocks that you can use for
testing, development, and debugging. However, as the project grows, it will be
increasingly difficult to handle multiple mocks (e.g., different error
responses) for the same endpoint. You can't enable Multiple handlers for a
single endpoint at once, so you may have to define your handlers as functions
and then import them and use them as you need. As a result, there will be lots
of imports throughout the project, which can lead to maintainability issues. And
in the case of using mocks for manual testing in the browser, this solution is
not going to work.

Additionally, the MSW's API is a bit verbose. There is no doubt that it's very
flexible, but in most cases, you won't need that much flexibility and, this can
end up with lots of duplication and less readable code.

Long story short, Lyrebird is a simple wrapper for MSW that makes it easy to
create and manage more declarative and cleaner mock handlers by providing an
abstracted interface for MSW's API and useful utilities for creating and
managing mock handlers.

## Features

- Managing mock handlers using HandlerCollection
- Selectively enable predefined handlers
- Utilities for checking request parameters and payload
- Devtools panel (soon)
- ...

## Getting started

First, install `msw` and `lyrebird`:

```bash
# NPM
npm install msw lyrebird --save-dev

# Yarn
yarn add msw lyrebird --dev

# PNPM
pnpm add msw lyrebird --save-dev
```

Next, create a `HandlerCollection` and define your mocks using `RestHandler`:

```typescript
// handlers.ts

import { HandlerCollection, RestHandler } from 'lyrebird'

const handlerCollection = new HandlerCollection()

handlerCollection.collect(
  new RestHandler()
    .onGet('/users')
    .reply(200, {
      users: [],
    })
    .as('getAllUsers'), // Add a name for the handler

  new RestHandler()
    .onPost('/register')
    .reply(200, {
      success: true,
      message: 'users registered successfully.',
    })
    .as('register'),
)

export { handlerCollection }
```

Then set up the mock server using `setupServer()` or `setupWorker()` and
instantiate Lyrebird's `MockServer` passing the `handlerCollection` to it:

```typescript
// mockServer.ts

import { setupServer } from 'msw/node'
import { MockServer } from 'lyrebird'
import { handlerCollection } from './handlers'

const mockServer = setupServer()

// In case that you are using jest for testing
beforeAll(() => mockServer.listen())
afterAll(() => mockServer.close())
afterEach(() => mockServer.resetHandlers())

export const server = new MockServer(mockServer, {
  collection: handlerCollection,
})
```

Now use `server.use()` or `server.enable()` to enable your predefined mocks by
their name:

```typescript
import { server } from './mockServer'

test('should fetch all users', () => {
  server.use('getAllUsers')

  // ...
})

test('new users can register', () => {
  server.enable('register')

  // ...
})
```

## Recipes

### Defining inline mocks

In some cases, you may need to create a one-time mock in your tests without
using the `HandlerCollection`. You can do this by creating a new handler and
passing it directly to the server.use() method.

```typescript
server.use(
  new RestHandler().onGet('/users').reply(200, {
    users: [],
  }),
)
```

### Request parameters constraints

Occasionally, you may need to check request parameters to match a specific
value. To do so, you can use the `withParams()` method of the Handler instance:

```typescript
// Only the requests with 'active=true' query parameter will be handled
const handler = new RestHandler()
  .onGet('/users')
  .withParams({ active: 'true' })
  .reply(200, response)
```

### Request body constraints

Use the `withPayload()` method of the Handler instance to ensure that incoming
requests contain a specific payload.

```typescript
interface RegistrationRequest {
  email: string
  password: string
}

interface Response {
  success: boolean
  message: string
}

const handler = new RestHandler()
  .onPost('/register')
  .withPayload<RegistrationRequest>({
    email: 'user@example.com',
    password: 'secret',
  })
  .reply<Response>(200, {
    success: true,
    message: 'User registered successfully.',
  })
```

### Advanced handlers

If you need full control over the handler's functionality, you can directly
define the MSW resolver function using the `resolve()` method of the Handler
instance. The resolver callback receives an object with the same utilities as
the resolver's parameters in MSW

Please keep in mind that when you use the resolve() method, Lyrebird will pass
the resolver function directly to the MSW server, so methods that control the
behavior of the handler like `withParams()`, `withPayload()`, or `reply()` won't
work, and you need to take care of its functionality.

```typescript
interface LoginRequest {
  username: string
  password: string
}

interface LoginResponse {
  username: string
  firstName: string
}

const handler = new RestHandler()
  .onPost('/login')
  .resolve<LoginRequest, LoginResponse>(({ response, request, context }) => {
    const { username } = request.body

    return response(
      context.status(200),
      context.json({
        username,
        firstName: 'John',
      }),
    )
  })
```

## License

[MIT](./LICENSE) License © 2021 [Mohammad Ataei](https://github.com/mammadataei)
