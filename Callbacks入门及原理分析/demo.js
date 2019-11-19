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