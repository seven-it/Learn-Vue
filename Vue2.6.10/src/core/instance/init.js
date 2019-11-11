/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0
/**
 * @param {Function} Vue vue构造函数
 */
export function initMixin (Vue: Class<Component>) {
  /**
   * 初始化方法
   * @param { object } 选项对象
   */
  Vue.prototype._init = function (options?: Object) {
    // 保存new出来的vue实例对象
    // 疑问？：为什么要用常量保存起来，而不直接使用this对象
    const vm: Component = this 
    // a uid
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    // 猜测： vue实例对象不会被observe监测
    vm._isVue = true

    // merge options
    /**
     * 合并选项，将vue构造函数上的自定义属性与用户传入的options中的属性进行合并
     */
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      /**
       * 合并选项函数
       * 将vue构造函数中的原生选项与用户传入的自定义选项合并
       * 合并完成挂在到实例对象的$options属性上
       */
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor), // 解析构造函数选项
        options || {},
        vm
      )
    }
    
    /* istanbul ignore else */
    // 为vm添加一个代理对象，该对象也就是vm本身
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    
    // expose real self
    // 疑问？ _self有什么用
    vm._self = vm

    /**
     * initLifecycle(vm) 定义一些可供调用的实例属性，以及一些实例的私有属性
     * 有以下实例属性
     * $parent
     * $root 
     * $children []
     * $refs {}
     * 
     * 以下私有属性
     * _watcher = null
     * _inactive = null
     * _directInactive = false
     * _isMounted = false
     * _isDestroyed = false
     * _isBeingDestroyed = false
     */
    initLifecycle(vm) 

    // 事件有关 ，暂时跳过
    initEvents(vm)
    
    /**
     * initRender(vm) 初始化一些与render相关的属性
     * _vnode = null
     * _staticTrees = null
     * _c
     * 
     * $slots
     * $scopedSlots
     * $createElement
     * 
     * 被数据劫持的属性
     * $attrs
     * $listeners
     */
    initRender(vm)

    // 触发生命周期钩子
    callHook(vm, 'beforeCreate')

    // 数据注入
    initInjections(vm) // resolve injections before data/props

    /**
     * 初始化data， props，computed ，watch
     * 并将data中的属性代理到vm实例中，如 vm.msg === vm.data.msg
     * 并且对data中的数据进行observe
     * 
     */
    initState(vm)
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      // 数据初始化完毕 开始挂载
      vm.$mount(vm.$options.el)
    }
  }
}

export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions (Ctor: Class<Component>) {
  // 构造函数的选项对象
  /**
   * 选项对象中包含了原生组件与api
   * components: {KeepAlive: {…}, Transition: {…}, TransitionGroup: {…}}
   * directives: {model: {…}, show: {…}}
   * filters: {}
   * _base: ƒ Vue(options)
   */
  let options = Ctor.options 
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
