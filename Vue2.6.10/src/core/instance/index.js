import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

/**
 * vue构造函数，通过new Vue来初始化vue实例
 * @param {Object} options  选项参数，以下示例 
 * {
 *  el: "#app"
 *  data:{},
 *  created() {},
 *  motheds:{}
 * }
 */
function Vue (options) {
  // vue构造函数必须通过new来使用，不能当作普通函数来调用，否则报错
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }

  // 初始化vue实例，对options进行处理
  this._init(options)
}

initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
