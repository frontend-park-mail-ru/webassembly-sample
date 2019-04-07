
var wasmModule;
var memoryData = {};
var memory = new WebAssembly.Memory({initial:8});
//забираем файл по нужному локейшену
fetch("optimized.wasm")
    .then(function(response) {
        return response.arrayBuffer();
    })
    .then(buffer => WebAssembly.instantiate(buffer, {
        //создаем объект webassembly модуля с заданным объектом памяти
        env: {
        memory,
        abort: function() {}
        },
        global: {},
    }))
    .then(function(module) {
        //предаллоцируем память на 1мб. если обратится к неаллоцированной памяти, 
        //выпадет ексепшен. поэтому необходимо следить за расходом памяти
        //и ее очисткой
        //представление памяти - массив с выравнивание на 8бит. 
        //поэтому все равно что туда писать, главное знать размер одного элемента
        //память работает через указатели. в представлении webassembly  в js -
        //указатель на память - индекс в массиве выделенной памяти. 
        wasmModule = module;
        var size = 1024 * 1024;
        memoryData.memoryPullPointer = wasmModule.instance.exports.allocate(size);
        memoryData.pullSize = size;
        memoryData.memoryWasmPull =
            new Uint8Array (
                wasmModule.instance.exports.memory.buffer,
                memoryData.memoryPullPointer,
                memoryData.pullSize
            );
    }).catch((err) => {
        debugger;
    });

function WASMAllocate(imageData, forceAlloc) {
    const pullSize = imageData.byteLength * 2;

    //проверяем, хватает ли нам предаллоцированной памяти. если нет - перевыделяем.
    //и пользуемся до тех пор, пока опять не придут данные большие, чем объем выделенной памяти 
	if (pullSize > memoryData.pullSize || forceAlloc) {

		wasmModule.instance.exports.freeBuffer(memoryData.memoryPullPointer);
		memoryData.memoryPullPointer = wasmModule.instance.exports.allocate(pullSize);
		memoryData.pullSize = pullSize;
		memoryData.memoryWasmPull =
			new Uint8Array(
				wasmModule.instance.exports.memory.buffer,
				memoryData.memoryPullPointer,
				memoryData.pullSize
			);
        memoryData.memoryWasmPull.set(imageData);
	}
}

function WASMGrayscale(imageData, forceAlloc) {

    //try для дебага
	try {
    WASMAllocate(imageData, forceAlloc);
    const wasmSourceImgPointer = memoryData.memoryPullPointer;
    const wasmDistImgPointer = memoryData.memoryPullPointer + imageData.byteLength;
    wasmModule.instance.exports.toGrayscale(wasmSourceImgPointer, imageData.byteLength, wasmDistImgPointer);

    return memoryData.memoryWasmPull

	} catch(err) {
		debugger;
	}
}
