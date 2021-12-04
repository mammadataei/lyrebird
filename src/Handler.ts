import { RestHandler, RESTMethods } from 'msw'

export type RequestParameters = Record<string, string>

export class Handler<ResponseBody = unknown, RequestPayload = unknown> {
  private method: RESTMethods = RESTMethods.GET

  private url?: string

  private params?: RequestParameters

  private requestPayload?: RequestPayload

  private responseStatusCode = 200

  private responseBody?: ResponseBody

  name: string | null = null

  public on(method: RESTMethods | keyof typeof RESTMethods, url: string) {
    this.method = typeof method === 'string' ? RESTMethods[method] : method
    this.url = url
    return this
  }

  public onGet(url: string) {
    return this.on(RESTMethods.GET, url)
  }

  public onPost(url: string) {
    return this.on(RESTMethods.POST, url)
  }

  public onPatch(url: string) {
    return this.on(RESTMethods.PATCH, url)
  }

  public onPut(url: string) {
    return this.on(RESTMethods.PUT, url)
  }

  public onOptions(url: string) {
    return this.on(RESTMethods.OPTIONS, url)
  }

  public onHead(url: string) {
    return this.on(RESTMethods.HEAD, url)
  }

  public onDelete(url: string) {
    return this.on(RESTMethods.DELETE, url)
  }

  withParams(params: RequestParameters) {
    this.params = params
    return this
  }

  withPayload<Payload extends RequestPayload>(payload: Payload) {
    this.requestPayload = payload
    return this as unknown as Handler<ResponseBody, Payload>
  }

  public reply<Body extends ResponseBody>(status: number, body?: Body) {
    this.responseStatusCode = status
    this.responseBody = body
    return this as unknown as Handler<Body, RequestPayload>
  }

  as(name: string) {
    this.name = name
    return this
  }

  run() {
    if (!this.url) throw new Error('No url provided')

    return new RestHandler(this.method, this.url, (req, res, context) => {
      if (this.params && paramsMismatched(this.params, req.url.searchParams)) {
        return res.networkError('Params mismatch.')
      }

      if (payloadMismatched(this.requestPayload, req.body)) {
        return res.networkError('Payload mismatch.')
      }

      return res(
        context.status(this.responseStatusCode),
        context.json(this.responseBody),
      )
    })
  }
}

function paramsMismatched(
  expected: RequestParameters,
  actual: URLSearchParams,
): boolean {
  for (const property in expected) {
    if (expected[property] !== actual.get(property)) {
      return true
    }
  }

  return false
}

function payloadMismatched(expected: unknown, actual: unknown) {
  return expected && JSON.stringify(expected) !== JSON.stringify(actual)
}
