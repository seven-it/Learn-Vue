## 前言
**上一篇我们完成了第一步 (数据劫持)，从而完成了对属性的监听，这一篇我们来完成第二步（模板解析）**

- [Vue 响应式原理简易 MVVM 三步走第一步 (数据劫持）](https://juejin.im/post/5d2d6bad6fb9a07ef710a683)

![image](https://github.com/seven-it/Learn-Vue/blob/master/Vue%E5%93%8D%E5%BA%94%E5%BC%8F%E5%8E%9F%E7%90%86%E4%B8%89%E9%83%A8%E8%B5%B0/images/00.png)

在开始之前，我们需要对数据进行一层代理，这样我们可以更简洁的来调用属性

```
    // 在 vue 中我们使用属性是这样的
    vm.name
    
    // 而不是这样的
    vm._data.name
```
#### 数据代理
数据代理其实就相当于将 vm._data 中的属性做了一层映射, 代理到 vm 上。

```
// mvvm.js
    class Mvvm {
        constructor(options = {}) {
            this.$options = options;
            this._data = this.$options.data;
            observe(this._data)
            
            // + 号代表新增代码
        +   dataProxy(this, this._data)
        }
    }    
    
    // 代理函数
+    function dataProxy(vm, data) {
+        for(let key in data) {
             // vm 代理 vm._data上的属性
+            Object.defineProperty(vm, key, {
+                configurable: true,
+                get() {
+                    return vm._data[key] // 实际返回的仍然是 vm._data的属性值
+                },
+                set(newVal) {
+                    vm._data[key] = newVal // 修改vm._data的属性值
+                }
+            })
+        }
+    }
```
#### 测试一下
打开浏览器控制台

![image](https://github.com/seven-it/Learn-Vue/blob/master/Vue%E5%93%8D%E5%BA%94%E5%BC%8F%E5%8E%9F%E7%90%86%E4%B8%89%E9%83%A8%E8%B5%B0/images/c1.png)

完成了数据代理，下面开始模板解析
### 模板解析

```
// mvvm.js
    // mvvm构造函数
    class Mvvm {
        constructor(options = {}) {
            ...
            dataProxy(this, this._data)
            
            // 调用函数
        +   new Compile(this.$options.el, this)
        }
    }
    
    // 模板解析函数
+    function Compile(el, vm) {
        // 获取根节点
        vm.$el = document.querySelector(el)
        // 创建一个空文档片段
        let fragment = document.createDocumentFragment();
        // 正则 用来匹配插值，即 {{ }} 中的内容
        let reg = /\{\{(.*?)\}\}/g;
        
        // 将根节点中的子几点依次添加到 文档片段中
        while(child = vm.$el.firstChild) {
            // 小知识点：在使用appendChild时
            // 如果文档树中已经存在了 child，child将从文档树中删除，然后重新插入它的新位置。
            // 所以当vm.$el中的节点全部插入到fragment中时，child = null，循环终止
            fragment.appendChild(child)
        }
        
        // 替换 {{}} 种的内容
        function replace(frg) {
            frg.childNodes.forEach(node => {
                let txt = node.textContent
                
                // 文本节点 并且有{{}}
                if(node.nodeType === 3 && reg.test(txt)) {
                    // 获取到第一个分组 a.b.c
                    let arr = RegExp.$1.split('.') // [a,b,c]
                    let val = arr.reduce((val, key) => {
                        return val[key]  // val = vm.a.b.c
                    }, vm)
                    
                    // 替换内容
                    node.textContent = txt.replace(reg, val).trim()
                }
                
                // 递归 替换更层次节点
                if(node.childNodes && node.childNodes.length) {
                    replace(node)
                }
            })
        }
        replace(fragment)
        // 将文档片段插入根节点
        vm.$el.appendChild(fragment)
+    }
```
#### 测试一下
![image](https://github.com/seven-it/Learn-Vue/blob/master/Vue%E5%93%8D%E5%BA%94%E5%BC%8F%E5%8E%9F%E7%90%86%E4%B8%89%E9%83%A8%E8%B5%B0/images/c2.png)

![image](https://github.com/seven-it/Learn-Vue/blob/master/Vue%E5%93%8D%E5%BA%94%E5%BC%8F%E5%8E%9F%E7%90%86%E4%B8%89%E9%83%A8%E8%B5%B0/images/c3.png)

##### 好了，现在我们完成了第二步 模板编译，下一篇我们来完成最后一步 发布订阅模式 
#### 参考资料
- [不好意思！耽误你的十分钟，让MVVM原理还给你](https://juejin.im/post/5abdd6f6f265da23793c4458)
- [入口开始，解读Vue源码（四）—— 实现一个基础的 Vue 双向绑定](https://github.com/muwoo/blogs/blob/master/src/Vue/5.md)