import type { SetupWorkerApi } from 'msw'
import type { SetupServerApi } from 'msw/node'
import type { HandlerCollection } from './HandlerCollection'
import { RestHandler } from './RestHandler'

interface MockServerOptions {
  collection: HandlerCollection
}

export class MockServer {
  private readonly server: SetupServerApi | SetupWorkerApi

  private readonly collection?: HandlerCollection

  constructor(
    server: SetupServerApi | SetupWorkerApi,
    options?: MockServerOptions,
  ) {
    this.server = server

    if (options) {
      this.collection = options.collection
    }
  }

  use(...handlers: Array<string> | Array<RestHandler>) {
    if (Array.isArray(handlers)) {
      handlers.forEach((handler) => {
        if (handler instanceof RestHandler) {
          return this.enableHandlerInstance(handler)
        }

        this.enableHandlerFromCollection(handler)
      })
    }
  }

  enable(...handlers: Array<string>) {
    return this.use(...handlers)
  }

  private enableHandlerInstance(handler: RestHandler) {
    return this.server.use(handler.run())
  }

  private enableHandlerFromCollection(handlerName: string) {
    if (!this.collection) {
      throw new Error(
        '\n' +
          `Lyrebird: Unable to find handler \`${handlerName}\` because there isn't a HandlerCollection ` +
          `associated with the current MockServer instance. Please consider creating a HandlerCollection ` +
          `or using an inline handler instead.`,
      )
    }

    this.server.use(this.collection.find(handlerName).run())
  }
}
