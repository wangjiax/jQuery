#Callbacks入门及原理分析
##Callbacks概念：

    1. $.Callback用于管理函数队列
    2. 通过add添加处理函数到队列中，通过fire去执行这些处理函数
    Note:$Callbacks是在jquery内部使用的，如为$.ajax,$.Deferred等组件提供基础功能的函数。
    它也可以用在类似功能的一些组件中，如自己开发的组件
    
使用：
<div style="text-align: center;">
    <img src="../images/callback使用.png">
</div>
<p>
    $.Callback可以通过字符串参数的方式，支持4种特定的功能: once,unique,stopOnfalse,memory
</p>

<ul>
<li>once: 函数队列只执行一次</li>
    
    // 不添加任何参数
    var cb = $.Callbacks();
    cb.add(function() {
        console.log('add');
    });

    cb.fire();      //add
    cb.fire();      //add

    // 添加参数'once'
    var cb = $.Callbacks('once');
    cb.add(function() {
        console.log('add');
    });

    cb.fire();      //add
    cb.fire();
    

<li>unique: 往内部队列添加的函数保持唯一，不能重复添加</li>

    // 不添加任何参数
    var cb = $.Callbacks();
    function demo() {
        console.log('demo');
    };

    cb.add(demo, demo);
    cb.fire();      //demo demo

    // 添加参数'once'
    var cb = $.Callbacks('unique');
    function demo() {
        console.log('demo');
    };

    cb.add(demo, demo);
    cb.fire();      // demo

<li>stopOnfalse: 内部队列里的函数是依次执行的，当某个函数的返回值是false时，停止继续执行剩下的函数</li>

    // 不添加参数
    var cb = $.Callbacks();
    cb.add(function() {
        console.log('add one');
        return false;
    }, function() {
        console.log('add two);
    });

    cb.fire();  // add one add two

    // 添加参数
    var cb = $.Callbacks('stopOnFalse');
    cb.add(function() {
        console.log('add one');
        return false;
    }, function() {
        console.log('add two);
    });

    cb.fire();  // add one

<li>memory: 当函数队列fire一次过后，内部会记录当前fire的参数。当下次调用add的时候，会把记录的参数传递给新添加的函数并立即执行这个新添加的函数</li>

    // 不添加参数
    var cb = $.Callbacks();
    cb.add(function() {
        console.log('add one');
        return false;
    });

    cb.fire();  // add one

    cb.add(function() {
        console.log('add two');
    });

    // 添加参数
    var cb = $.Callbacks('memory');
    cb.add(function() {
        console.log('add one');
        return false;
    });

    cb.fire();  // add one

    cb.add(function() {
        console.log('add two');
    });         //add two

###从事件函数了解Callbacks
    事件通常与函数配合使用，这样就可以通过发生的事件来驱动函数的执行。

    原则：一个事件对应一个事件函数

    在一个事件对应多个事件函数的情况下，后者会覆盖前者。

    eg:
    Element.onclick = function () {
        console.log(code);
    }
    Element.onclick = function () {         // 下面的事件函数会覆盖上面的事件函数
        console.log(code1);
    }

###事件驱动方式改造

    // 一对多的事件模型
    var callbacks = [function(){}, function(){}, function(){}];
    Element.onclick = function(){
        var _this = this;
        callbacks.forEach(function(fn){
            fn.call(_this);
        });
    }

<span style="color: red;">*</span>Note：Callbacks不仅仅是一个数组。我们可以将其改造成一个听话的容器

方法：
<ul>
    <li>add() 往容器里添加处理函数</li>
    <li>fire() 按照添加函数的顺序依次执行处理函数</li>
</ul>
参数控制：
<ul>
    <li>stopOnFalse：可选，执行某个处理函数时，返回值为false，则终止后续处理函数的执行。</li>
    <li>once：默认，fire调用后关闭容器，add添加进容器的处理函数将不会再被执行。</li>
    <li>memory：可选，fire调用后开放容器，add添加进容器的处理函数将会立即执行。</li>
</ul>

    (function(root){
        var optionsCache = {};

        var _ = {
            callbacks: function(options){
                options = typeof options === 'string' ? (optionsCache[options] || createOptions(options)) : {};
                
                // 处理函数队列
                var list = [];
                var index, length, testting, memory, start, starts;

                // 执行队列里函数的方法:fire，内部方法，不对外部开放
                var fire = function(data){
                    memory = options.memory && data;

                    // start：记录之前fire时候处理函数队列执行到的下标，再次fire时从该下边开始，若无，则从0开始
                    index = starts || 0;

                    // start必须得重重为0，否则每次fire的时候都只会执行队列里的最后一个
                    start = 0;
                    length = list.length;
                    testting = true;
                    for(; index < length; index++) {
                        // 当处理函数的返回值为false以及设置了stopOnfalse的时候，及时终止处理函数队列的执行
                        if(list[index].apply(data[0], data[1]) === false && options.stopOnFalse) {
                            break;
                        }
                    }
                }
                
                // 暴露外部的闭包，用来添加和执行处理函数
                var self = {
                    // 往函数队列中添加处理函数，可以传多个，传入处理函数数组
                    add: function(){
                        // 将类数组转化为真正的数组
                        var args = Array.prototype.slice.call(arguments);
                        start = list.length;
                        // 循环数组中的每项成员赋给fn
                        args.forEach(function(fn){
                            // 判断每项是否为函数，若是，则push进处理函数队列list
                            if (toString.call(fn) === '[object Function]') {
                                list.push(fn);
                            }
                        });
                        
                        // 若是之前设置过memory并且fire过，则再次调用add添加新的处理函数后，直接执行新添加的处理函数，这是memory的作用
                        // 若不满足上述条件（设置了memory且fire过），则memory为undefined，在再次调用add添加新的处理函数后，不会执行新的处理函数
                        console.log('hhh');
                        console.log(starts);
                        if(memory) {
                            starts = start;
                            fire(memory);
                        }
                        console.log(starts);
                    },

                    // 控制函数队列中的处理函数执行时的上下文绑定
                    fireWidth :function(context, arguments){
                        var args = [context, arguments];
                        
                        // 调用执行处理函数队列的方法并将args传给它，只有在没有设置'once'的时候才会执行，但是第一次得执行，由变量testting控制
                        if(!options.once || !testting){
                            fire(args);
                        }
                    },

                    // 控制函数队列中的处理函数执行时的参数的传递
                    fire: function(){
                        // this指向self，arguments为调用self.fire()时接收的参数
                        self.fireWidth(this, arguments);
                    }
                };

                return self;
            }
        };
        root._ = _;

        function createOptions(options) {
            var object = optionsCache[options] = {};
            options.split(/\s+/).forEach(function(value){
                object[value] = true;
            });
            return object;
        }
    })(this);