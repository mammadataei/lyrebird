import { Handler } from './Handler'

export class HandlerCollection {
  private collection: Map<string, Handler>

  constructor() {
    this.collection = new Map<string, Handler>()
  }

  collect(...handlers: Array<Handler>): void {
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

  find(name: string): Handler {
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
