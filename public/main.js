var image = null;
const NUM = 10;
let FORCE_ALLOC = false;


function upload() {
  //Get input from file input
  var fileinput = document.getElementById("finput");
  //Make new SimpleImage from file input
  image = new SimpleImage(fileinput);
//   
  //Get canvas
  var canvas = document.getElementById("can");

  FORCE_ALLOC = true;
  //Draw image on canvas
  image.drawTo(canvas);
}

function JSGrayscale(imageDataBuffer) {
    for (let i = 0; i < imageDataBuffer.length; i += 4) {
        const gray = (imageDataBuffer[i] + imageDataBuffer[i + 1] + imageDataBuffer[i + 2]) / 3;
        imageDataBuffer[i] = imageDataBuffer[i + 1] = imageDataBuffer[i + 2] = gray;
    }
}

function makeGrayJS() {
    const ts = performance.now();
    image2 = new SimpleImage(image)
    image2.imageData.data.set(image.imageData.data);
    for (let a = 0; a < NUM; a++ ) {
        
        JSGrayscale(image2.imageData.data);
    }
    const te = performance.now();
    const timeDiff = te - ts;

    console.log(`JS test for ${NUM} times take: ${timeDiff} ms`);

    canvas = document.getElementById("can-JS-Gray");
    image2.drawTo(canvas);
}

function makeGrayASM() {
    let image3 = new SimpleImage(image)
    let memoryWasmPull;
    image3.imageData.data.set(image.imageData.data);
    const ts = performance.now();
    for (let a = 0; a < NUM; a++ ) {
        memoryWasmPull = WASMGrayscale(image3.imageData.data, FORCE_ALLOC);
        FORCE_ALLOC = false;
    }
    const te = performance.now();
    const timeDiff = te - ts;

    image3.imageData.data.set(memoryWasmPull.slice(image3.imageData.data.byteLength, image3.imageData.data.byteLength * 2));


    console.log(`WASM test for ${NUM} times take: ${timeDiff} ms`);

    const canvas = document.getElementById("can-ASM-Gray");
    image3.drawTo(canvas);
}
