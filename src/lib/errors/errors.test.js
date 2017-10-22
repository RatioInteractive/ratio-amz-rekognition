import errors, { getError } from './'

describe('errors', () => {
  describe('when getError() is called', () => {
    it('should return error instance with formated error message', () => {
      const err = getError('this is my error with string %s and number %d', 'my_string', 102)
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toEqual('this is my error with string my_string and number 102')
    })

    it('should return error instance with plain error message if formatting arguments are not passed', () => {
      const err = getError('this is my error with string %s and number %d')
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toEqual('this is my error with string %s and number %d')
    })
  })

  it('should export default message', () => {
    expect(errors.default_message).toBeDefined()
  })
})
