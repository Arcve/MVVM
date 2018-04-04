// import './observe'
// import './compile'

function Compile(el, vm){
    vm.$el = document.querySelector(el)
       
    let fragment = document.createDocumentFragment();

    // firstChild是指向元素首个子节点的引用。
    // 将firstChild引用指向的对象append到父对象的末尾，
    // 原来firstChild引用的对象就跳到了container对象的末尾，
    // 而firstChild就指向了本来是排在第二个的元素对象。如此循环下去，链接就逐个往后跳了
    while( child = vm.$el.firstChild)
        fragment.appendChild(child)       
    

    function replace(frag){
        Array.from(frag.childNodes).forEach(node => {
            let txt = node.textContent
            let reg = /\{\{(.*)\}\}/ 

            if(node.nodeType === 3 && reg.test(txt)){
                console.log(RegExp.$1)
                let arr = RegExp.$1.split('.')
                let val = vm
                arr.forEach(key => {
                    val = val[key]
                })

                
                node.textContent = txt.replace(reg, val).trim()

                new Watcher(vm, RegExp.$1, newVal => {
                    node.textContent = txt.replace(reg, newVal).trim()
                })
            }

            if(node.nodeType === 1){
                let attrs = node.attributes
                Array.from(attrs).forEach(({name, value}) =>{

                    console.log("name" + name + " value " + value )
                    if(name.includes('v-')){
                        let arr = value.split('.')
                        let val = vm
                        arr.forEach( key => { val = val[key] })
                        node.value = val
                    }
                    new Watcher(vm, value, newVal => {
                        node.value = newVal
                    })
                    node.addEventListener('input', e => {
                        let newVal = e.target.value
                    
                        let arr = value.split('.')
                        let key = arr.pop();
                        let val = vm


                        arr.forEach( key => { val = val[key] })
                        val[key] = newVal
                    })
                })

                
            }

            if(node.childNodes && node.childNodes.length){
                replace(node)
            }
        })
    }

    replace(fragment)
    vm.$el.appendChild(fragment)
}

function Observe(data){
       let dep = new Dep()

       for (let key in data) {
          let val = data[key]
          observe(val)
   
          Object.defineProperty(data, key, {
              configurable:true,
              get() {
                  Dep.target && dep.addSub(Dep.target)
                  return val
              },
              set(newVal) {
                   if(newVal === val) return 
                   
                   val = newVal
                   observe(newVal)
                   dep.notify()
              }
          })
       }
   }
   
function observe(data){
    if(!data || typeof data !== 'object') return
    return new Observe(data)
}

function Dep(){
    this.subs = []
}

Dep.prototype ={
    addSub(sub) {
        this.subs.push(sub);
    },

    notify(){
        this.subs.forEach(sub => sub.update());
    }
}


function Watcher(vm, exp, fn){
    this.fn = fn
    this.vm = vm
    this.exp = exp

    Dep.target = this

    let arr = this.exp.split('.')
    let val = vm
    arr.forEach( key => { val = val[key] })

    Dep.target = null
}

Watcher.prototype.update = function(){
    let arr = this.exp.split('.')
    let val = this.vm
    arr.forEach( key => { val = val[key] })

    this.fn(val)
}

function MVVM(options = {}){
    this.$options = options
    let data = this._data = this.$options.data;

    observe(data)
    for (let key in data){
        Object.defineProperty(this, key, {
            configurable: true,
            get() {
                return this._data[key]
            },
            set(newVal) {
                return this._data[key] = newVal
            }
        })
    }

    new Compile(options.el, this)
}

