

SimpleImage = function () {
    // function map for to support "overloaded constructor"
    var funMap = [
        function () {
            return __SimpleImageUtilities.EMPTY_IMAGE;
        },
        function (source) {
            if (source instanceof HTMLInputElement && source.type == 'file') {
                return __SimpleImageUtilities.makeHTMLImageFromInput(source.files[0], this);
            } else if (source instanceof SimpleImage) {
                return source.canvas;
            }
        },
        function (width, height) {
            if (width > 0 && height > 0) {
                return __SimpleImageUtilities.makeHTMLImageFromSize(width, height);
            } else {
                __SimpleImageUtilities.throwError('Unable to create a SimpleImage with a negative width or height [' + width + 'x' + height + ']');
            }
        }
    ];

    // call appropriate constructor
    var htmlImage = funMap[arguments.length].apply(this, arguments);
    // actual content is backed by an invisible canvas
    this.canvas = __SimpleImageUtilities.makeHTMLCanvas('SimpleImageCanvas');
    this.canvas.style.display = 'none';
    this.context = this.canvas.getContext('2d');
    // when image is loaded, it will fill this in
    this.imageData = null;
    // check to see if we can complete the constructor now instead of waiting
    if (htmlImage != null && (htmlImage instanceof HTMLCanvasElement || htmlImage.complete)) {
        this.__init(htmlImage);
    }
    this.ACCEPTED_FILES = 'image.*';
}


SimpleImage.prototype = {
    constructor: SimpleImage,
    complete: function () {
        return this.imageData != null;
    },
    getWidth: function () {
        __SimpleImageUtilities.funCheck('getWidth', 0, arguments.length);
        return this.width;
    },
    getHeight: function () {
        __SimpleImageUtilities.funCheck('getHeight', 0, arguments.length);
        return this.height;
    },
  
    // Scales contents of SimpleIage to the given size
    setSize: function (width, height) {
        __SimpleImageUtilities.funCheck('setSize', 2, arguments.length);
        width = Math.floor(width);
        height = Math.floor(height);
        if (width > 0 && height > 0) {
            // make sure we have the most current changes
            __SimpleImageUtilities.flush(this.context, this.imageData);
            this.imageData = __SimpleImageUtilities.changeSize(this.canvas, width, height);
            this.width = width;
            this.height = height;
            this.canvas.width = width;
            this.canvas.height = height;
        }
        else {
            __SimpleImageUtilities.throwError('You tried to set the size of a SimpleImage to a negative width or height [' + width + 'x' + height + ']');
        }
    },
    // Draws to the given canvas, setting its size to match SimpleImage's size
    drawTo: function (toCanvas) {
        if (this.imageData != null) {
            __SimpleImageUtilities.flush(this.context, this.imageData);
            toCanvas.width = this.getWidth();
            toCanvas.height = this.getHeight();
            toCanvas.getContext('2d').drawImage(this.canvas, 0, 0, toCanvas.width, toCanvas.height);
        }
        else {
            var myself = this;
            setTimeout(function() {
                myself.drawTo(toCanvas);
            }, 100);
        }
    },
    // Export an image as an linear array of pixels that can be iterated over


    // Private methods: should not be called publicly, but it should not hurt if it is
    // Completes the construction of this object once the htmlImage is loaded
    __init: function (img) {
        try {
            this.id = img.id;
            // this is a hack to make three different cases work together:
            // - small empty image, thumbnail images, and canvases
            this.width = ('naturalWidth' in img) ? Math.max(img.naturalWidth, img.width) : img.width;
            this.height = ('naturalHeight' in img) ? Math.max(img.naturalHeight, img.height) : img.height;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            // are we copying an already loaded image or drawing it fresh
            if (img instanceof HTMLCanvasElement) {
                var canvasData = img.getContext('2d').getImageData(0, 0, this.width, this.height);
                this.context.putImageData(canvasData, 0, 0);
            }
            else {
                this.context.drawImage(img, 0, 0, this.width, this.height);
            }
            this.imageData = this.context.getImageData(0, 0, this.width, this.height);
           
           
        }
        catch (err) {
            console.log(err);
            __SimpleImageUtilities.throwError('The name you used to create a SimpleImage was not correct: ' + img.id);
        }
    },
    // computes index into 1-d array, and checks correctness of x,y values
    __getIndex: function (funName, x, y) {
        __SimpleImageUtilities.rangeCheck(x, 0, this.getWidth(), funName, 'x', 'wide');
        __SimpleImageUtilities.rangeCheck(y, 0, this.getHeight(), funName, 'y', 'tall');
        return (Math.floor(x) + Math.floor(y) * this.getWidth()) * 4;
    }
};


// Private helper functions, add __ to reduce chance they will conflict with anyone else's method names
var __SimpleImageUtilities = (function () {
    // private globals
    // image needed to seed "sized" image
    var EMPTY_IMAGE_DATA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAQAAAAnZu5uAAAAAXNSR0IArs4c6QAAABVJREFUeJxiYPgPhyQwAQAAAP//AwCgshjoJhZxhgAAAABJRU5ErkJggg==';
    // number of canvases created to hold images
    var globalCanvasCount = 0;
    // load image by wrapping it in an HTML element
    function makeHTMLImage (url, name, simpleImage, loadFunc) {
        if (loadFunc == null) {
            loadFunc = function() {
                simpleImage.__init(this);
                console.log('loaded image: ' + simpleImage.id);
            }
        }
        var img = new Image();
        img.onload = loadFunc;
        img.src = url;
        img.id = name;
        img.style.display = 'none';
        return img;
    }

    // public utility functions
    return {
        // make a blank image so it is cached for future uses
        EMPTY_IMAGE: makeHTMLImage(EMPTY_IMAGE_DATA, 'EMPTY', null, function () {}),

        // create a canvas element
        makeHTMLCanvas: function (prefix) {
            var canvas = document.createElement('canvas');
            canvas.id = prefix + globalCanvasCount;
            canvas.style.display = 'none';
            canvas.innerHTML = 'Your browser does not support HTML5.'
            globalCanvasCount++;
            return canvas;
        },

        // get image from uploaded file input
        makeHTMLImageFromInput: function (file, simpleImage) {
            console.log('creating image: ' + file.name);
            var reader = new FileReader();
            reader.onload = function() {
                makeHTMLImage(this.result, file.name.substr(file.name.lastIndexOf('/') + 1), simpleImage);
            }
            reader.readAsDataURL(file);
            return null;
        },

        // clamp values to be in the range 0..255
        clamp: function (value) {
            return Math.max(0, Math.min(Math.floor(value), 255));
        },

        // push accumulated local changes out to the screen
        flush: function (context, imageData) {
            if (imageData != null) {
                context.putImageData(imageData, 0, 0, 0, 0, imageData.width, imageData.height);
            }
        },

        // called from user-facing functions to check number of arguments
        funCheck: function (funcName, expectedLen, actualLen) {
            if (expectedLen != actualLen) {
                var s1 = (actualLen == 1) ? '' : 's';  // pluralize correctly
                var s2 = (expectedLen == 1) ? '' : 's';
                var message = 'You tried to call ' + funcName + ' with ' + actualLen + ' value' + s1 +
                              ', but it expects ' + expectedLen + ' value' + s2 + '.';
                // someday: think about "values" vs. "arguments" here
                __SimpleImageUtilities.throwError(message);
            }
        },

        // called from user-facing functions to check if given value is valid
        rangeCheck: function (value, low, high, funName, coordName, size) {
            if (value < low || value >= high) {
                var message = 'You tried to call ' + funName + ' for a pixel with ' + coordName + '-coordinate of ' + value +
                              ' in an image that is only ' + high + ' pixels ' + size +
                              ' (valid ' + coordName + ' coordinates are ' + low + ' to ' + (high-1) + ').';
                __SimpleImageUtilities.throwError(message);
            }
        }
    };
})();