let image = null;
const NUM = 10;
let FORCE_ALLOC = false;


function upload() {
  FORCE_ALLOC = true;

  const fileinput = document.getElementById("finput");
  // библиотечка для работы с изображениями https://www.dukelearntoprogram.com/course1/common/js/image/SimpleImage.js
  image = new SimpleImage(fileinput);
  const canvas = document.getElementById("can");
  image.drawTo(canvas);
}

function JSGrayscale(imageDataBuffer) {
    // операция обработки изображения в js быстрая, потмоу что работаем c TypedArray,
    // а не с js массивом. Разница примерно в 5-10 раз, по отношению в обычному массиву
    for (let i = 0; i < imageDataBuffer.byteLength; i += 4) {
        const gray = (imageDataBuffer[i] + imageDataBuffer[i + 1] + imageDataBuffer[i + 2]) / 3;
        imageDataBuffer[i] = imageDataBuffer[i + 1] = imageDataBuffer[i + 2] = gray;
    }
    return imageDataBuffer;
}

function makeGrayJS() {
    let grayArray;

    // создаем новую картинку из исходной
    image2 = new SimpleImage(image)

    // замеряем время
    const ts = performance.now();
    for (let a = 0; a < NUM; a++ ) {
        grayArray = JSGrayscale(image.imageData.data);
    }
    const te = performance.now();
    const timeDiff = te - ts;
    console.log(`JS test for ${NUM} times take: ${timeDiff} ms`);

    image2.imageData.data.set(grayArray);
    canvas = document.getElementById("can-JS-Gray");
    image2.drawTo(canvas);
}

function makeGrayASM() {
    // создаем новую картинку из исходной
    let image3 = new SimpleImage(image)
    let memoryWasmPull;
    image3.imageData.data.set(image.imageData.data);

    // замеряем время
    const ts = performance.now();
    for (let a = 0; a < NUM; a++ ) {
        memoryWasmPull = WASMGrayscale(image3.imageData.data, FORCE_ALLOC);
        // если следующую строку расскоментировать, проиграем по временив 2 раза
        // выделение памяти, копирование данных – долгие операции.
        // но если вынести за пределы цикла и не учитывать операцию копирования данных (67 строка),
        // то webassembly будет работать быстрее с изображением, чем js
        // image3.imageData.data.set(memoryWasmPull);
        FORCE_ALLOC = false;
    }
    const te = performance.now();
    const timeDiff = te - ts;
    console.log(`WASM test for ${NUM} times take: ${timeDiff} ms`);
    // здесь копируем обработанные в данные в буффер изображения.
    // но можно сразу создать буффер изображения из памяти выделенной в webassembly,
    // тогда не будет необходимости перекопирвоать данные
    image3.imageData.data.set(memoryWasmPull.slice(image3.imageData.data.byteLength, image3.imageData.data.byteLength * 2));

    const canvas = document.getElementById("can-ASM-Gray");
    image3.drawTo(canvas);
}
