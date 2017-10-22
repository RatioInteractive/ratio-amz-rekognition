export function expectToBeRejected() {
  throw new Error('Unexpected success in test')
}
