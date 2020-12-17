export default class Pool <T> {
  public workers: T[] = []
  private list: Array<(worker: T) => void> = []

  add (worker: T) {
    if (this.list.length) this.list.shift()!(worker)
    else this.workers.push(worker)
  }

  remove (worker: T) {
    this.workers = this.workers.filter(it => it !== worker)
  }

  acquire () {
    if (this.workers.length) return Promise.resolve(this.workers.shift()!)
    return new Promise<T>(resolve => this.list.push(resolve))
  }
}
