import { RestHandler as MSWRestHandler, RESTMethods } from 'msw'
import {
  AsyncResponseResolverReturnType,
  defaultContext,
  DefaultRequestBody,
  MockedRequest,
} from 'msw/lib/types/handlers/RequestHandler'
import { MockedResponse, ResponseComposition } from 'msw/lib/types/response'
import {
  RequestParams,
  RestContext,
  RestRequest,
} from 'msw/lib/types/handlers/RestHandler'

export type RequestParameters = Record<string, string>

type ResponseResolver<
  RequestType = MockedRequest,
  ContextType = typeof defaultContext,
  BodyType = unknown,
> = (props: {
  request: RequestType
  response: ResponseComposition<BodyType>
  context: ContextType
}) => AsyncResponseResolverReturnType<MockedResponse<BodyType>>

export class RestHandler<ResponseBody = unknown, RequestPayload = unknown> {
  private method: RESTMethods = RESTMethods.GET

  private url?: string

  private params?: RequestParameters

  private requestPayload?: RequestPayload

  private responseStatusCode = 200

  private responseBody?: ResponseBody

  private resolver?: ResponseResolver<any, any, any>

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
    return this as unknown as RestHandler<ResponseBody, Payload>
  }

  public reply<Body extends ResponseBody>(status: number, body?: Body) {
    this.responseStatusCode = status
    this.responseBody = body
    return this as unknown as RestHandler<Body, RequestPayload>
  }

  public resolve<
    RequestBodyType extends DefaultRequestBody = DefaultRequestBody,
    ResponseBody extends DefaultRequestBody = any,
    Params extends RequestParams = RequestParams,
  >(
    resolver: ResponseResolver<
      RestRequest<RequestBodyType, Params>,
      RestContext,
      ResponseBody
    >,
  ) {
    this.resolver = resolver
    return this
  }

  as(name: string) {
    this.name = name
    return this
  }

  run() {
    if (!this.url) throw new Error('No url provided')

    return new MSWRestHandler(
      this.method,
      this.url,
      (request, response, context) => {
        if (this.resolver) {
          return this.resolver({ request, response, context })
        }

        if (
          this.params &&
          paramsMismatched(this.params, request.url.searchParams)
        ) {
          return response.networkError('Params mismatch.')
        }

        if (payloadMismatched(this.requestPayload, request.body)) {
          return response.networkError('Payload mismatch.')
        }

        return response(
          context.status(this.responseStatusCode),
          context.json(this.responseBody),
        )
      },
    )
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
