export default class ManiError extends Error {
  constructor (message) {
    super(message)
    this.name = 'ManiError'
  }
}
