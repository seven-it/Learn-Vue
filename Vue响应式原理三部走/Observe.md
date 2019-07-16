### 前言
##### Vue响应式原理主要通过以下三点来实现
1. 通过数据劫持监听数据变化
2. 通过模板编译进行数据渲染
3. 通过发布订阅模式实现视图与数据的同步

**下面我们将通过这三点来实现一个简易的mvvm, 从而加深对Vue响应式的理解**
### 数据劫持
Vue2实现数据劫持是利用ES5的 **Object.defineProperty** , 利用它会为对象添加get/set方法，从而监听属性的读取与修改。

```
// html代码
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    <div id="app">
        <h1>{{name}}</h1>
        <p>身份：{{about.title}}</p>
        <p>梦想：找到{{about.dream}}，并成为海贼王。</p>
        <p>恶魔果实：{{about.fruit}}。</p>
        他的标志性特征是一顶草帽，因此常被直接称呼为“{{about.alias}}”
    </div>
    <!--实现的mvvm-->
    <script src="./mvvm.js"></script>
    <script>
        let mvvm = new Mvvm({
            el: '#app',
            data: { 
                name: '蒙奇·D·路飞',
                about: {
                    title: '草帽海贼团船长',
                    dream: 'ONE PIECE',
                    fruit: '超人系橡胶果实',
                    alias: '草帽'
                }
            }
        });
    </script>
</body>
</html>
```

### 简易Mvvm第一步
```
// 创建一个Mvvm构造函数，参数是一个选项对象
class Mvvm {
    constructor(options = {}) {
        this.$options = options;
        this._data = this.$options.data;
        
        // 通过 observe 劫持data对象，从而监听其内部属性
        observe(this._data)
    }
}
```

### 实现 Observe

```
function Observe(data) {
    for (let key in data) {
        let val = data[key]
        // 开头调用 observe 判断当前属性是否为一个对象，
        // 如果是一个对象， 则递归调用Observe 确保监听到深层属性
        observe(val)
        
        // 通过 Object.defineProperty 为每一个属性添加get/set方法
        // 当属性被读取时会触发get ，属性被修改时触发set
        Object.defineProperty(data, key, {
            configurable: true,
            get() {
                return val;
            },
            set(newVal) {
                if (val === newVal) return;
                val = newVal;
                
                // 这里我们打一个log 测试时使用
                console.log('数据被修改')
                
                // 确保新属性的值是一个对象时也能监听到其内部属性
                observe(newVal);
            }
        })
    }
}

function observe(data) {
    if(!data || typeof data !== 'object') return;
    return new Observe(data)
}
```
### 测试一下
数据劫持基本已经完成，下面我们来看一看observe是否有效 

打开控制台，输入mvvm, 可以看到_data中的属性都被添加上了get/set方法

![image](https://github.com/seven-it/Learn-Vue/blob/master/Vue%E5%93%8D%E5%BA%94%E5%BC%8F%E5%8E%9F%E7%90%86%E4%B8%89%E9%83%A8%E8%B5%B0/images/01.png)

我们测试一下修改属性是否能触发set, 可以看到数据修改并打印了log

![image](https://github.com/seven-it/Learn-Vue/blob/master/Vue%E5%93%8D%E5%BA%94%E5%BC%8F%E5%8E%9F%E7%90%86%E4%B8%89%E9%83%A8%E8%B5%B0/images/02.png)

#### 为什么要再set中调用 observe(newVal)？
当我们将一个属性值修改为一个对象，这个新对象中的属性是没有被observe监听到的，所以我们需要再set时调用一下observe来确能监听到新对象的属性

例如： 当我们将name属性值修改为一个对象，当没有在set中调用observe时是这样的

![image](https://github.com/seven-it/Learn-Vue/blob/master/Vue%E5%93%8D%E5%BA%94%E5%BC%8F%E5%8E%9F%E7%90%86%E4%B8%89%E9%83%A8%E8%B5%B0/images/03.png)

调用了observe(newVal)时

![image](https://github.com/seven-it/Learn-Vue/blob/master/Vue%E5%93%8D%E5%BA%94%E5%BC%8F%E5%8E%9F%E7%90%86%E4%B8%89%E9%83%A8%E8%B5%B0/images/04.png)

