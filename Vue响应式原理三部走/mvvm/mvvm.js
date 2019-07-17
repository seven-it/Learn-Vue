class Mvvm {
    constructor(options = {}) {
        this.$options = options;
        this._data = this.$options.data;
        observe(this._data)
        
        for(let key in this._data) {
            Object.defineProperty(this, key, {
                configurable: true,
                get() {
                    return this._data[key];
                },
                set(newVal) {
                    this._data[key] = newVal
                }
            })
        }

        new Compile(options.el, this);    
    }
}

function Observe(data) {
    let dep = new Dep();
    for (let key in data) {
        let val = data[key]
        observe(val)
        Object.defineProperty(data, key, {
            configurable: true,
            get() {
                Dep.target && dep.addSub(Dep.target)
                return val;
            },
            set(newVal) {
                if (val === newVal) {
                    return;
                }
                console.log('数据被修改')
                val = newVal;
                observe(newVal);
                dep.notify()
            }
        })
    }
}

function observe(data) {
    if(!data || typeof data !== 'object') return;
    return new Observe(data)
}

function Compile(el, vm) {
    vm.$el = document.querySelector(el);
    let fragment = document.createDocumentFragment();

    while (child = vm.$el.firstChild) {
        fragment.appendChild(child)
    }
    
    function replace(frag) {
        Array.from(frag.childNodes).forEach(node => {
            let txt = node.textContent;
            let reg = /\{\{(.*?)\}\}/g; 
            let hasWatcher = false

            if (node.nodeType === 3 && reg.test(txt)) {
                function replaceTxt() {
                    node.textContent = txt.replace(reg, (matched, placeholder) => {  
                        if (!hasWatcher) {
                            new Watcher(vm, placeholder, replaceTxt);   // 监听变化，进行匹配替换内容
                            hasWatcher = true
                        }

                        return placeholder.split('.').reduce((val, key) => {
                            return val[key]; 
                        }, vm);
                    });
                };
                // 替换
                replaceTxt();
            }

            if (node.childNodes && node.childNodes.length){
                replace(node)
            }
        })
    }

    replace(fragment)

    vm.$el.appendChild(fragment)
}

function Dep() {
    this.subs = [];
}

Dep.prototype = {
    addSub(sub) {
        this.subs.push(sub);
    },
    notify() {
        this.subs.forEach(sub => sub.update());
    }
}

function Watcher(vm, exp, fn) {
    this.fn = fn
    this.arr = exp.split('.')
    this.vm = vm
    Dep.target = this
    let val = vm
    this.arr.forEach(key => {
        val = val[key]
    })
    console.log(exp)
    Dep.target = null
}

Watcher.prototype.update = function() {
    this.fn();
}