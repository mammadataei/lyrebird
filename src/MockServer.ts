import { SetupServerApi } from 'msw/node'
import { RESTMethods, SetupWorkerApi } from 'msw'
import { Handler, RequestParameters } from './Handler'

export class MockServer {
  private server: SetupServerApi | SetupWorkerApi

  private handler: Handler | null = null

  constructor(server: SetupServerApi | SetupWorkerApi) {
    this.server = server
  }

  public on(method: RESTMethods, url: string) {
    this.getCurrentHandler().setMethod(method)
    this.getCurrentHandler().setUrl(url)
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

  public withParams(params: RequestParameters) {
    this.getCurrentHandler().setRequestParams(params)
    return this
  }

  public withPayload<Payload>(payload: Payload) {
    this.getCurrentHandler().setRequestPayload<Payload>(payload)
    return this
  }

  public reply<ResponseBody>(status: number, body?: ResponseBody): void {
    const handler = this.getCurrentHandler()
    handler.setResponseCode(status)

    if (body) {
      handler.setResponseBody<ResponseBody>(body)
    }

    this.server.use(handler.handle())
    this.handler = null
  }

  private getCurrentHandler() {
    this.handler ??= new Handler()
    return this.handler
  }
}
