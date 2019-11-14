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

    (function (root) {
        var _ = {
            callbacks: function(){

            }
        };
        root._ = _;
    })(this);