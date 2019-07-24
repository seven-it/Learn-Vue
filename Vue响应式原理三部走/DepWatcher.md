## 前言
**上一篇我们完成了第一步 (数据劫持)，从而完成了对属性的监听，这一篇我们来完成最后一步（发布-订阅）**

[Vue 响应式原理简易 MVVM 三步走第一步 (数据劫持）](https://juejin.im/post/5d2d6bad6fb9a07ef710a683)

[Vue响应式原理简易Mvvm三步走第二步 (模板解析）](https://juejin.im/post/5d2e8efff265da1bbd4ba9d5)

[Vue响应式原理简易Mvvm三步走第三步 (发布-订阅）](https://juejin.im/post/5d2ecfc3f265da1ba84ac616)


发布订阅的关系主要靠数组来维护，订阅就是将函数添加到数组，发布就是将数组中的函数执行

```
// 创建一个数组
function Dep() {
    this.subs = []
}
Dep.prototype = {
    // 将订阅内容添加到数组
    addSub(fn) {
        this.subs.push(fn)
    },
    
    // 每个订阅内容都有一个 update 方法，通知内容发布
    notify() {
        this.subs.forEach(sub => sub.update())
    }
}

function Watcher(fn) {
    this.fn = fn
}

// 发布内容
Watcher.prototype.update = function () {
    this.fn()
}

let watcher = new Watcher(() => console.log('娜美'))
let dep = new Dep()

dep.addSub(watcher)  
dep.addSub(watcher)
dep.notify()  // 娜美 ，娜美
```

#### 利用发布订阅实现数据驱动视图
我们的Dep构造函数不需要变动，需要先修改下 Wather

```
...
+ let hasWatcher = false // 添加一个开关 确保Watcher只实例化一次
if (node.nodeType === 3 && reg.test(txt)) {
    function replaceTxt() {
        node.textContent = txt.replace(reg, (matched, placeholder) => { 
            // 只有第一次编译才会实例化Watcher
+            if (!hasWatcher) {
+                new Watcher(vm, placeholder, replaceTxt);   // 监听变化，进行匹配替换内容
+                hasWatcher = true
+            }

            return placeholder.split('.').reduce((val, key) => {
                return val[key]; 
            }, vm);
        });
    };
    // 替换
    replaceTxt();
}

// 修改 Watcher
function Watcher(vm, exp, fn) {
     this.fn = fn  
+    this.arr = exp.split('.')  // exp 是正则匹配后的字符串  a.b.c
+    this.vm = vm               // vm  是mvvm的实例对象
+    Dep.target = this          // 添加一个标识，用于收集订阅时的判断
     // 通过访问 vm 的属性来触发对应属性的 get 如 vm.a.b.c, 从而收集当前的Wathcer
+    let val = vm
+    this.arr.forEach(key => {
+        val = val[key]
+    })
     
     // 收集完订阅内容时置空    
+    Dep.target = null
}

Watcher.prototype.update = function() {
    this.fn();
}
```
上面我们说到通过属性的get方法来收集Watcher, 那么我们还需要修改下Observe

```
// + 号表示新增代码 
function Observe(data) {
+    let dep = new Dep();  // 实例化Dep ，创建一个用来存放Watcher的数组
    for (let key in data) {
        let val = data[key]
        observe(val)
        Object.defineProperty(data, key, {
            configurable: true,
            get() {
                // 判断 Dep.target 存在，向数组中添加 Watcher
+                Dep.target && dep.addSub(Dep.target)
                return val;
            },
            set(newVal) {
                if (val === newVal) {
                    return;
                }
                console.log('数据被修改')
                val = newVal;
                observe(newVal);
+                dep.notify()  // 数据被修改时 触发Watcher更新视图
            }
        })
    }
}
```
#### 测试一下
控制台修改name属性， 视图也发生了变化

![image](https://github.com/seven-it/Learn-Vue/blob/master/Vue%E5%93%8D%E5%BA%94%E5%BC%8F%E5%8E%9F%E7%90%86%E4%B8%89%E9%83%A8%E8%B5%B0/images/d1.png)

![image](https://github.com/seven-it/Learn-Vue/blob/master/Vue%E5%93%8D%E5%BA%94%E5%BC%8F%E5%8E%9F%E7%90%86%E4%B8%89%E9%83%A8%E8%B5%B0/images/d2.png)

##### 好了，现在我们终于完成了一个简易的Mvvm，希望对大家会有帮助。

[完整DEMO地址](https://github.com/seven-it/Learn-Vue/tree/master/Vue%E5%93%8D%E5%BA%94%E5%BC%8F%E5%8E%9F%E7%90%86%E4%B8%89%E9%83%A8%E8%B5%B0/mvvm)


#### 参考资料
- [不好意思！耽误你的十分钟，让MVVM原理还给你](https://juejin.im/post/5abdd6f6f265da23793c4458)
- [入口开始，解读Vue源码（四）—— 实现一个基础的 Vue 双向绑定](https://github.com/muwoo/blogs/blob/master/src/Vue/5.md)
