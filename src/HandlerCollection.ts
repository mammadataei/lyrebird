import { RestHandler } from './RestHandler'

export class HandlerCollection {
  private collection: Map<string, RestHandler>

  constructor() {
    this.collection = new Map<string, RestHandler>()
  }

  collect(...handlers: Array<RestHandler>): void {
    handlers.forEach((handler) => {
      const key = handler.name

      if (!key) {
        throw new Error(
          '\n' +
            'Lyrebird: Each handler should contain a name to be stored in the collection. \n' +
            'For future reference, name your handler using the `as("...")` method',
        )
      }

      this.collection.set(key, handler)
    })
  }

  find(name: string): RestHandler {
    const handler = this.collection.get(name)

    if (!handler) {
      throw new Error(
        '\n' +
          `Lyrebird: No Handler found with the given name \`${name}\` in the collection.`,
      )
    }

    return handler
  }
}
