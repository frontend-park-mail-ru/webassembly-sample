
let wasmModule;
const memoryData = {};
const memory = new WebAssembly.Memory({initial:8});
const INIT_PULL_SIZE = 1024 * 1024;

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
        memoryData.memoryPullPointer = wasmModule.instance.exports.allocate(INIT_PULL_SIZE);
        memoryData.pullSize = INIT_PULL_SIZE;
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
    //и пользуемся до тех пор, пока опять не придут данные большИе, чем объем выделенной памяти 
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
	try {
        // аллоцируем память
        WASMAllocate(imageData, forceAlloc); 
        // указатель на начало выделнного фрагмента памяти
        const wasmSourceImgPointer = memoryData.memoryPullPointer; 
        // указатель на начало памяти, выделенной для записи нового изображения
        const wasmDistImgPointer = memoryData.memoryPullPointer + imageData.byteLength; 
        // вызываем экспортирпуемую из wasm модуля функцию
        wasmModule.instance.exports.toGrayscale(wasmSourceImgPointer, imageData.byteLength, wasmDistImgPointer);

        // возвращаем указатель на buffer с записаным ответом
        // return memoryData.memoryWasmPull.slice(imageData.byteLength, imageData.byteLength * 2)
        return memoryData.memoryWasmPull;
	} catch(err) {
		debugger;
	}
}
