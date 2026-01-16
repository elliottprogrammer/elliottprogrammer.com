class ImageAtomizer {
    constructor(imageSrc, options) {
        // Default properties
        this.elementId = "image-atomizer";
        this.width = 0;
        this.height = 0;
        this.particleGap = 0;
        this.particleSize = 2;
        this.offsetX = 0;
        this.offsetY = 0;
        this.monochrome = false;
        this.monochromeColor = "#fff";
        this.mouseForce = 4000;
        this.restless = false;
        this.timeScale = 1;
        this.onWidthChange = null;
        this.onHeightChange = null;
        this.onSizeChange = null;
        this.onInitialized = null;
        this.isRunning = false;
        this.rafId = null;

        this.nextFrame = this.nextFrame.bind(this);
        
        // Apply custom options
        if (options) {
            const optionKeys = [
                'elementId', 'width', 'height', 'particleGap', 'particleSize', 'monochrome', 'monochromeColor',
                'mouseForce', 'restless', 'onWidthChange', 'onHeightChange', 'onSizeChange', 'onInitialized',
                'offsetX', 'offsetY', 'timeScale'
            ];
            
            for (let i = 0, len = optionKeys.length; i < len; i++) {
                if (options[optionKeys[i]]) {
                    this[optionKeys[i]] = options[optionKeys[i]];
                }
            }
        }
        
        // DOM elements
        this.$container = document.getElementById(this.elementId);
        this.$canv = this.$container.querySelector("canvas.atomizer");
        
        // Canvas elements
        this.$srcCanv = document.createElement("canvas");
        this.$srcCanv.style.display = "none";
        this.$container.appendChild(this.$srcCanv);
        
        // Set dimensions if not specified
        if (this.width <= 0) {
            this.width = this.$container.clientWidth;
        }
        if (this.height <= 0) {
            this.height = this.$container.clientHeight;
        }
        
        // Mouse and interaction properties 
        this.monochromeColorArr = this.parseColor(this.monochromeColor);
        this.mx = -1;
        this.my = -1;
        // For touch/swipe devices
        this.touchX = null;
        this.touchY = null;
        
        // Canvas dimensions
        this.cw = this.getCanvasWidth();
        this.ch = this.getCanvasHeight();
        
        // Animation properties
        this.frame = 0;
        this.hasInitialized = false;
        this.lastTimestamp = null;
        this.baseFrameDuration = 1000 / 60;
        
        // Particle buffers
        this.pxlBuffer = { first: null };
        this.recycleBuffer = { first: null };
        
        // Canvas contexts
        this.ctx = this.$canv.getContext("2d");
        this.srcCtx = this.$srcCanv.getContext("2d", { willReadFrequently: true });
        
        // Set canvas dimensions
        this.$canv.width = this.cw;
        this.$canv.height = this.ch;

        this.supportsSwipeEvents = function() {
            return window && 'ontouchstart' in window;
        }
        
        // Shuffle function for arrays
        this.shuffle = function() {
            let temp, randomIndex;
            for (let i = 0, len = this.length; i < len; i++) {
                randomIndex = Math.floor(Math.random() * len);
                temp = this[i];
                this[i] = this[randomIndex];
                this[randomIndex] = temp;
            }
        };
        Array.prototype.shuffle = this.shuffle;

        const getOffset = (element) => {
            let offsetLeft = 0;
            let offsetTop = 0;
            let targetElement = typeof element === "string" ? document.getElementById(element) : element;
            
            if (targetElement) {
                offsetLeft = targetElement.offsetLeft;
                offsetTop = targetElement.offsetTop;
                const body = document.getElementsByTagName("body")[0];
                
                while (targetElement.offsetParent && targetElement !== body) {
                    offsetLeft += targetElement.offsetParent.offsetLeft;
                    offsetTop += targetElement.offsetParent.offsetTop;
                    targetElement = targetElement.offsetParent;
                }
            }
            return { x: offsetLeft + this.offsetX, y: offsetTop + this.offsetY };
        };
        
        // Mouse event handlers
        this.$canv.onmouseout = () => {
            this.mx = -1;
            this.my = -1;
        };
        
        if (this.supportsSwipeEvents()) {
            const trackTouchCoordinates = (x, y) => {
                const offset = getOffset(this.$container);
                this.mx = x - offset.x + window.scrollX;
                this.my = y - offset.y + window.scrollY;
            }
            this.$canv.ontouchstart = (event) => {
                trackTouchCoordinates(event.touches[0].clientX, event.touches[0].clientY);
            }
            this.$canv.ontouchmove = (event) => {
                trackTouchCoordinates(event.touches[0].clientX, event.touches[0].clientY);
            }
            this.$canv.ontouchend = (event) => {
                this.mx = -1;
                this.my = -1;
            }
        } else {
            this.$canv.onmousemove = (event) => {
                const offset = getOffset(this.$container);
                this.mx = event.clientX - offset.x + window.scrollX;
                this.my = event.clientY - offset.y + window.scrollY;
            };
        }
        
        this.loadImage = function(imageSource) {
            // Set the image source
            this.image = new Image();
            this.isImageLoaded = false;

            if (imageSource) {
                this.image.src = imageSource;
                
                this.image.onload = () => {
                    this.isImageLoaded = true;
                    this.resize();
                    // Start animation
                    this.play();
                };
            } else {
                return console.error('ImageAtomizer: You must provide an image source as the first argument when instanciating a `new ImageAtomizer(imageSrc, options)`.');
            }

            this.image.onerror = () => {
                return console.error('ImageAtomizer: Failed to load the provided image source (%s). Please check the image exists.', imageSource);
            }
        }
        this.loadImage(imageSrc);   
    }
    
    // Particle class as inner class
    static Particle = class {
        constructor(imageAtomizer) {
            this.atomizer = imageAtomizer;
            this.ttl = null;
            this.color = imageAtomizer.colorArr;
            this.next = null;
            this.prev = null;
            this.gravityX = 0;
            this.gravityY = 0;
            this.x = Math.random() * imageAtomizer.cw;
            this.y = Math.random() * imageAtomizer.ch;
            this.velocityX = Math.random() * 10;
            this.velocityY = Math.random() * 10;
        }
        
        move(timeStep) {
            const imageAtomizer = this.atomizer;
            
            if (this.ttl !== null && (this.ttl -= timeStep) <= 0) {
                imageAtomizer.swapList(this, imageAtomizer.pxlBuffer, imageAtomizer.recycleBuffer);
                this.ttl = null;
            } else {
                const dx = this.gravityX - this.x;
                const dy = this.gravityY - this.y;
                const distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
                const angle = Math.atan2(dy, dx);
                let force = distance * 0.008;
                
                if (imageAtomizer.restless === true) {
                    force += Math.random() * 0.1 - 0.05;
                } else if (force < 0.01) {
                    this.x = this.gravityX + 0.25;
                    this.y = this.gravityY + 0.25;
                }
                
                let mouseForce = 0;
                let mouseAngle = 0;
                
                if (imageAtomizer.mx >= 0 && imageAtomizer.mouseForce) {
                    const mouseDx = this.x - imageAtomizer.mx;
                    const mouseDy = this.y - imageAtomizer.my;
                    mouseForce = Math.min(imageAtomizer.mouseForce / (Math.pow(mouseDx, 2) + Math.pow(mouseDy, 2)), imageAtomizer.mouseForce);
                    mouseAngle = Math.atan2(mouseDy, mouseDx);
                    
                    if (typeof this.color === "function") {
                        mouseAngle += Math.PI;
                        mouseForce *= 0.001 + Math.random() * 0.1 - 0.05;
                    }
                } else {
                    mouseForce = 0;
                    mouseAngle = 0;
                }

                this.velocityX += (force * Math.cos(angle) + mouseForce * Math.cos(mouseAngle)) * timeStep;
                this.velocityY += (force * Math.sin(angle) + mouseForce * Math.sin(mouseAngle)) * timeStep;

                this.velocityX *= Math.pow(0.90, timeStep);
                this.velocityY *= Math.pow(0.90, timeStep);
                
                // this.x += this.velocityX * timeStep;
                // this.y += this.velocityY * timeStep;
                this.x += this.velocityX;
                this.y += this.velocityY;
            }
        }
    };
    
    swapList(particle, fromList, toList) {
        if (particle === null) {
            particle = new ImageAtomizer.Particle(this);
        }
        
        if (fromList.first === particle) {
            if (particle.next !== null) {
                particle.next.prev = null;
                fromList.first = particle.next;
            } else {
                fromList.first = null;
            }
        } else {
            if (particle.next === null) {
                particle.prev = null;
            } else {
                particle.prev.next = particle.next;
                particle.next.prev = particle.prev;
            }
        }
        
        if (toList.first === null) {
            toList.first = particle;
            particle.prev = null;
            particle.next = null;
        } else {
            particle.next = toList.first;
            toList.first.prev = particle;
            toList.first = particle;
            particle.prev = null;
        }
    }
    
    parseColor(color) {
        let result;
        color = color.replace(" ", "");
        
        if (result = /^#([\da-fA-F]{2})([\da-fA-F]{2})([\da-fA-F]{2})/.exec(color)) {
            result = [
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16)
            ];
        } else if (result = /^#([\da-fA-F])([\da-fA-F])([\da-fA-F])/.exec(color)) {
            result = [
                parseInt(result[1], 16) * 17,
                parseInt(result[2], 16) * 17,
                parseInt(result[3], 16) * 17
            ];
        } else if (result = /^rgba\(([\d]+),([\d]+),([\d]+),([\d]+|[\d]*.[\d]+)\)/.exec(color)) {
            result = [+result[1], +result[2], +result[3], +result[4]];
        } else if (result = /^rgb\(([\d]+),([\d]+),([\d]+)\)/.exec(color)) {
            result = [+result[1], +result[2], +result[3]];
        } else {
            return null;
        }
        
        if (isNaN(result[3])) {
            result[3] = 1;
        }
        result[3] *= 255;
        
        return result;
    }
    
    nextFrame(timestamp) {
        if (!this.isRunning) {
            return;
        }
        if (typeof timestamp !== "number") {
            timestamp = performance.now();
        }
        if (this.lastTimestamp === null) {
            this.lastTimestamp = timestamp - this.baseFrameDuration;
        }
        const deltaMs = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        const timeStep = (deltaMs / this.baseFrameDuration) * this.timeScale;
        
        let particle = this.pxlBuffer.first;
        let nextParticle = null;
        
        while (particle !== null) {
            nextParticle = particle.next;
            particle.move(timeStep);
            particle = nextParticle;
        }
        
        this.drawParticles();
        
        if (this.frame++ % 25 === 0 && (this.cw !== this.getCanvasWidth() || this.ch !== this.getCanvasHeight())) {
            const newWidth = this.getCanvasWidth();
            const newHeight = this.getCanvasHeight();
            
            if (this.cw !== newWidth && typeof this.onWidthChange === "function") {
                this.onWidthChange(this, newWidth);
            }
            if (this.ch !== newHeight && typeof this.onHeightChange === "function") {
                this.onHeightChange(this, newHeight);
            }
            if ( (this.cw !== newWidth || this.ch !== newHeight) && typeof this.onSizeChange === "function") {
                this.onSizeChange(this, newWidth, newHeight);
            }
            this.resize();
        }
        
        if (this.isRunning) {
            this.rafId = this.requestAnimationFrame(this.nextFrame);
        }
    }
    
    drawParticles() {
        let imageData = this.ctx.createImageData(this.cw, this.ch);
        let pixelIndex, x, y, pixelX, pixelY, color;
        
        let particle = this.pxlBuffer.first;
        while (particle !== null) {
            x = ~~particle.x;
            y = ~~particle.y;
            
            for (pixelX = x; pixelX < x + this.particleSize && pixelX >= 0 && pixelX < this.cw; pixelX++) {
                for (pixelY = y; pixelY < y + this.particleSize && pixelY >= 0 && pixelY < this.ch; pixelY++) {
                    pixelIndex = (pixelY * imageData.width + pixelX) * 4;
                    color = typeof particle.color === "function" ? particle.color() : particle.color;
                    
                    imageData.data[pixelIndex + 0] = color[0];
                    imageData.data[pixelIndex + 1] = color[1];
                    imageData.data[pixelIndex + 2] = color[2];
                    imageData.data[pixelIndex + 3] = color[3];
                }
            }
            particle = particle.next;
        }
        
        this.ctx.putImageData(imageData, 0 + this.offsetX, 0 + this.offsetY);
    }
    
    getPixelFromImageData(imageData, offsetX, offsetY) {
        const pixels = [];
        
        for (let x = 0; x < imageData.width; x += this.particleGap + 1) {
            for (let y = 0; y < imageData.height; y += this.particleGap + 1) {
                const pixelIndex = (y * imageData.width + x) * 4;
                const alpha = imageData.data[pixelIndex + 3];
                
                if (alpha > 0) {
                    pixels.push({
                        x: offsetX + x,
                        y: offsetY + y,
                        color: this.monochrome === true
                            ? [this.monochromeColorArr[0], this.monochromeColorArr[1], this.monochromeColorArr[2], this.monochromeColorArr[3]]
                            : [imageData.data[pixelIndex], imageData.data[pixelIndex + 1], imageData.data[pixelIndex + 2], imageData.data[pixelIndex + 3]],
                    });
                }
            }
        }
        
        return pixels;
    }
    
    init() {
        if (this.isImageLoaded) {
            this.$srcCanv.width = this.image.width;
            this.$srcCanv.height = this.image.height;
            this.srcCtx.clearRect(0, 0, this.$srcCanv.width, this.$srcCanv.height);
            this.srcCtx.drawImage(this.image, 0, 0);
            
            const pixels = this.getPixelFromImageData(
                this.srcCtx.getImageData(0, 0, this.$srcCanv.width, this.$srcCanv.height),
                ~~(this.cw / 2 - this.$srcCanv.width / 2),
                ~~(this.ch / 2 - this.$srcCanv.height / 2),
            );
            
            pixels.shuffle();
            
            let particle = this.pxlBuffer.first;
            for (let i = 0; i < pixels.length; ++i) {
                var newParticle = null;
                
                if (particle !== null) {
                    newParticle = particle;
                    particle = particle.next;
                } else {
                    this.swapList(this.recycleBuffer.first, this.recycleBuffer, this.pxlBuffer);
                    newParticle = this.pxlBuffer.first;
                }
                
                newParticle.gravityX = pixels[i].x;
                newParticle.gravityY = pixels[i].y;
                newParticle.color = pixels[i].color;
            }
            
            while (particle !== null) {
                particle.ttl = ~~(Math.random() * 10);
                particle.gravityY = ~~(this.ch * Math.random());
                particle.gravityX = ~~(this.cw * Math.random());
                particle = particle.next;
            }
        }
        if (!this.hasInitialized && this.onInitialized) {
            this.onInitialized();
        }
        this.hasInitialized = true;

    }
    
    getCanvasWidth() {
        //return Math.min(document.body.clientWidth, this.width, this.$container.clientWidth);
        return this.$container.clientWidth;
    }
    
    getCanvasHeight() {
        //return Math.min(document.body.clientHeight, this.height, this.$container.clientHeight);
        return this.$container.clientHeight;
    }
    
    resize() {
        this.cw = this.getCanvasWidth();
        this.ch = this.getCanvasHeight();
        this.$canv.width = this.cw;
        this.$canv.height = this.ch;
        this.init();
    }
    
    setColor(color) {
        this.monochromeColorArr = this.parseColor(color);
    }

    play() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        this.lastTimestamp = null; // avoid a large delta after a pause
        this.rafId = this.requestAnimationFrame(this.nextFrame);
    }

    pause() {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.lastTimestamp = null;
    }
    
    requestAnimationFrame(callback) {
        const requestAnimFrame = window.requestAnimationFrame || 
                              window.webkitRequestAnimationFrame || 
                              window.mozRequestAnimationFrame || 
                              window.oRequestAnimationFrame || 
                              window.msRequestAnimationFrame || 
                              function(callback) {
                                  return window.setTimeout(callback, 1000 / 60);
                              };
        return requestAnimFrame(callback);
    }
}

export { ImageAtomizer };
