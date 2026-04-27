import { errors as vineErrors } from '@vinejs/vine'
import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  /**
   * 4xx errors are expected (client mistakes) — no need to flood logs with them.
   * 5xx errors are unexpected — always report so they get visibility.
   */
  protected dontReport = [vineErrors.E_VALIDATION_ERROR]

  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      return ctx.response.status(422).send({ errors: error.messages })
    }

    return super.handle(error, ctx)
  }

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
