import util from 'util'

export function getError(errorMessage, ...args) {
  let message = errorMessage
  message = util.format(message, ...args)
  return new Error(message)
}

const errors = {
  default_message: 'This is a default message'
}

export default errors
