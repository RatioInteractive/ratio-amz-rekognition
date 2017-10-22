/**
 * Provides helper functions to simplify integration with API Gateway requests/responses.
 */
import { get } from 'lodash'

export function extractBody(message) {
  const bodyString = get(message, 'body')
  if (bodyString) {
    return JSON.parse(bodyString)
  }
  return undefined
}

export function extractPathParameters(message) {
  return get(message, 'pathParameters', {})
}

export function success(body) {
  return buildResponse(200, body)
}

export function failure400(body) {
  return buildResponse(400, body)
}

export function failure401(body) {
  return buildResponse(401, body)
}
export function failure404(body) {
  return buildResponse(404, body)
}

export function failure500(body) {
  return buildResponse(500, body)
}

function buildResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(body)
  }
}
