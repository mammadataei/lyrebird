import { RestHandler, RESTMethods } from 'msw'

export type RequestParameters = Record<string, string>

export class Handler<ResponseBody = unknown, RequestPayload = unknown> {
  private method: RESTMethods = RESTMethods.GET

  private url?: string

  private params?: RequestParameters

  private responseBody?: ResponseBody

  private responseCode = 200

  private requestPayload?: RequestPayload

  setMethod(method: RESTMethods) {
    this.method = method
    return this
  }

  setUrl(url: string) {
    this.url = url
    return this
  }

  setRequestParams(params: RequestParameters) {
    this.params = params
    return this
  }

  setRequestPayload<Payload extends RequestPayload>(payload: Payload) {
    this.requestPayload = payload
    return this as unknown as Handler<ResponseBody, Payload>
  }

  setResponseCode(statusCode: number) {
    this.responseCode = statusCode
    return this
  }

  setResponseBody<Body extends ResponseBody>(response: Body) {
    this.responseBody = response
    return this as unknown as Handler<Body, RequestPayload>
  }

  handle() {
    if (!this.url) throw new Error('No url provided')

    return new RestHandler(this.method, this.url, (req, res, context) => {
      if (this.params && paramsMismatched(this.params, req.url.searchParams)) {
        return res.networkError('Params mismatch.')
      }

      if (payloadMismatched(this.requestPayload, req.body)) {
        return res.networkError('Payload mismatch.')
      }

      return res(
        context.status(this.responseCode),
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
