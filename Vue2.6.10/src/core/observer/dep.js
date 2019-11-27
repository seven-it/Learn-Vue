/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'
import config from '../config'

let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    // 收集器唯一标识
    this.id = uid++
    // 收集器容器,收集到的watcher会添加到subs中
    this.subs = []
  }

  addSub (sub: Watcher) {
    // 收集watcher的方法，将watcher添加到收集器中
    this.subs.push(sub)
  }

  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  depend () {
    if (Dep.target) {
      // 收集之前先调用watcher的addDep方法
      Dep.target.addDep(this)
    }
  }

  notify () {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      // 确保优先更新父组件
      subs.sort((a, b) => a.id - b.id)
    }
    // 遍历wathcer调用其update()
    for (let i = 0, l = subs.length; i < l; i++) {
      // 调用watcher 的update进行更新
      subs[i].update()
    }
  }
}

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
Dep.target = null
const targetStack = []

export function pushTarget (target: ?Watcher) {
  // 观察者是全局唯一的，将其添加到Dep上方便收集
  targetStack.push(target)
  Dep.target = target
}

export function popTarget () {
  // 依赖收集完成，删除当前watcher,确保全局只有一个watcher
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
