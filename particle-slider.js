function ParticleSlider(options) {
    var self = this;
    
    // Default properties
    self.sliderId = "particle-slider";
    self.color = "#fff";
    self.hoverColor = "#88f";
    self.width = 0;
    self.height = 20;
    self.ptlGap = 0;
    self.ptlSize = 1;
    self.slideDelay = 10;
    self.arrowPadding = 10;
    self.showArrowControls = true;
    self.onNextSlide = null;
    self.onWidthChange = null;
    self.onHeightChange = null;
    self.onSizeChange = null;
    self.monochrome = false;
    self.mouseForce = 10000;
    self.restless = true;
    self.imgs = [];
    
    // Apply custom options
    if (options) {
        var optionKeys = [
            "color", "hoverColor", "width", "height", "ptlGap", "ptlSize", 
            "slideDelay", "arrowPadding", "sliderId", "showArrowControls", 
            "onNextSlide", "monochrome", "mouseForce", "restless", "imgs", 
            "onSizeChange", "onWidthChange", "onHeightChange"
        ];
        
        for (var i = 0, len = optionKeys.length; i < len; i++) {
            if (options[optionKeys[i]]) {
                self[optionKeys[i]] = options[optionKeys[i]];
            }
        }
    }
    
    // DOM elements
    self.$container = self.$("#" + self.sliderId);
    self.$$children = self.$container.childNodes;
    self.$controlsContainer = self.$(".controls");
    self.$$slides = self.$(".slide", self.$(".slides").childNodes, true);
    self.$controlLeft = null;
    self.$controlRight = null;
    self.$canv = self.$(".draw");
    
    // Canvas elements
    self.$srcCanv = document.createElement("canvas");
    self.$srcCanv.style.display = "none";
    self.$container.appendChild(self.$srcCanv);
    
    self.$prevCanv = document.createElement("canvas");
    self.$prevCanv.style.display = "none";
    self.$container.appendChild(self.$prevCanv);
    
    self.$nextCanv = document.createElement("canvas");
    self.$nextCanv.style.display = "none";
    self.$container.appendChild(self.$nextCanv);
    
    self.$overlay = document.createElement("p");
    self.$container.appendChild(self.$overlay);
    
    // Control images
    self.imgControlPrev = null;
    self.imgControlNext = null;
    
    // Disable arrow controls if only one slide
    if (self.$$slides.length <= 1) {
        self.showArrowControls = false;
    }
    
    // Setup arrow controls
    if (self.$controlsContainer && self.$controlsContainer.childNodes && self.showArrowControls === true) {
        self.$controlLeft = self.$(".left", self.$controlsContainer.childNodes);
        self.$controlRight = self.$(".right", self.$controlsContainer.childNodes);
        
        self.imgControlPrev = new Image();
        self.imgControlNext = new Image();
        
        self.imgControlPrev.onload = function() {
            self.$prevCanv.height = this.height;
            self.$prevCanv.width = this.width;
            self.loadingStep();
        };
        
        self.imgControlNext.onload = function() {
            self.$nextCanv.height = this.height;
            self.$nextCanv.width = this.width;
            self.loadingStep();
        };
        
        self.imgControlPrev.src = self.$controlLeft.getAttribute("data-src");
        self.imgControlNext.src = self.$controlRight.getAttribute("data-src");
    } else {
        self.showArrowControls = false;
    }
    
    // Set dimensions if not specified
    if (self.width <= 0) {
        self.width = self.$container.clientWidth;
    }
    if (self.height <= 0) {
        self.height = self.$container.clientHeight;
    }
    
    // Mouse and interaction properties
    self.mouseDownRegion = 0;
    self.colorArr = self.parseColor(self.color);
    self.hoverColorArr = self.parseColor(self.hoverColor);
    self.mx = -1;
    self.my = -1;
    self.swipeOffset = 0;
    
    // Canvas dimensions
    self.cw = self.getCw();
    self.ch = self.getCh();
    
    // Animation properties
    self.frame = 0;
    self.nextSlideTimer = false;
    self.currImg = 0;
    self.lastImg = 0;
    self.imagesLoaded = 0;
    
    // Particle buffers
    self.pxlBuffer = { first: null };
    self.recycleBuffer = { first: null };
    
    // Canvas contexts
    self.ctx = self.$canv.getContext("2d");
    self.srcCtx = self.$srcCanv.getContext("2d");
    self.prevCtx = self.$prevCanv.getContext("2d");
    self.nextCtx = self.$nextCanv.getContext("2d");
    
    // Set canvas dimensions
    self.$canv.width = self.cw;
    self.$canv.height = self.ch;
    
    // Shuffle function for arrays
    self.shuffle = function() {
        var temp, randomIndex;
        for (var i = 0, len = this.length; i < len; i++) {
            randomIndex = Math.floor(Math.random() * len);
            temp = this[i];
            this[i] = this[randomIndex];
            this[randomIndex] = temp;
        }
    };
    Array.prototype.shuffle = self.shuffle;
    
    // Mouse event handlers
    self.$canv.onmouseout = function() {
        self.mx = -1;
        self.my = -1;
        self.mouseDownRegion = 0;
    };
    
    self.$canv.onmousemove = function(event) {
        function getOffset(element) {
            var offsetLeft = 0;
            var offsetTop = 0;
            var targetElement = typeof element === "string" ? self.$(element) : element;
            
            if (targetElement) {
                offsetLeft = targetElement.offsetLeft;
                offsetTop = targetElement.offsetTop;
                var body = document.getElementsByTagName("body")[0];
                
                while (targetElement.offsetParent && targetElement !== body) {
                    offsetLeft += targetElement.offsetParent.offsetLeft;
                    offsetTop += targetElement.offsetParent.offsetTop;
                    targetElement = targetElement.offsetParent;
                }
            }
            
            this.x = offsetLeft;
            this.y = offsetTop;
        }
        
        var offset = new getOffset(self.$container);
        self.mx = event.clientX - offset.x + document.body.scrollLeft + document.documentElement.scrollLeft;
        self.my = event.clientY - offset.y + document.body.scrollTop + document.documentElement.scrollTop;
    };
    
    self.$canv.onmousedown = function() {
        if (self.imgs.length > 1) {
            var region = 0;
            if (self.mx >= 0 && self.mx < self.arrowPadding * 2 + self.$prevCanv.width) {
                region = -1;
            } else if (self.mx > 0 && self.mx > self.cw - (self.arrowPadding * 2 + self.$nextCanv.width)) {
                region = 1;
            }
            self.mouseDownRegion = region;
        }
    };
    
    self.$canv.onmouseup = function() {
        if (self.imgs.length > 1) {
            var region = "";
            if (self.mx >= 0 && self.mx < self.arrowPadding * 2 + self.$prevCanv.width) {
                region = -1;
            } else if (self.mx > 0 && self.mx > self.cw - (self.arrowPadding * 2 + self.$nextCanv.width)) {
                region = 1;
            }
            
            if (region !== 0 && self.mouseDownRegion !== 0) {
                if (region !== self.mouseDownRegion) {
                    region *= -1;
                }
                if (self.nextSlideTimer) {
                    clearTimeout(self.nextSlideTimer);
                }
                self.nextSlide(region);
            }
            self.mouseDownRegion = 0;
        }
    };
    
    // Load images from slides
    if (self.imgs.length === 0) {
        for (var i = 0, len = self.$$slides.length; i < len; i++) {
            var img = new Image();
            self.imgs.push(img);
            img.src = self.$$slides[i].getAttribute("data-src");
        }
    }
    
    if (self.imgs.length > 0) {
        self.imgs[0].onload = function() {
            self.loadingStep();
        };
    }
    
    // Start animation
    self.requestAnimationFrame(function() {
        self.nextFrame();
    });
}

// Particle class
var psParticle = function(particleSlider) {
    this.ps = particleSlider;
    this.ttl = null;
    this.color = particleSlider.colorArr;
    this.next = null;
    this.prev = null;
    this.gravityX = 0;
    this.gravityY = 0;
    this.x = Math.random() * particleSlider.cw;
    this.y = Math.random() * particleSlider.ch;
    this.velocityX = Math.random() * 10 - 5;
    this.velocityY = Math.random() * 10 - 5;
};

psParticle.prototype.move = function() {
    var particleSlider = this.ps;
    var self = this;
    
    if (this.ttl !== null && this.ttl-- <= 0) {
        particleSlider.swapList(self, particleSlider.pxlBuffer, particleSlider.recycleBuffer);
        this.ttl = null;
    } else {
        var dx = this.gravityX + particleSlider.swipeOffset - this.x;
        var dy = this.gravityY - this.y;
        var distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
        var angle = Math.atan2(dy, dx);
        var force = distance * 0.01;
        
        if (particleSlider.restless === true) {
            force += Math.random() * 0.1 - 0.05;
        } else if (force < 0.01) {
            this.x = this.gravityX + 0.25;
            this.y = this.gravityY + 0.25;
        }
        
        var mouseForce = 0;
        var mouseAngle = 0;
        
        if (particleSlider.mx >= 0 && particleSlider.mouseForce) {
            var mouseDx = this.x - particleSlider.mx;
            var mouseDy = this.y - particleSlider.my;
            mouseForce = Math.min(particleSlider.mouseForce / (Math.pow(mouseDx, 2) + Math.pow(mouseDy, 2)), particleSlider.mouseForce);
            mouseAngle = Math.atan2(mouseDy, mouseDx);
            
            if (typeof this.color === "function") {
                mouseAngle += Math.PI;
                mouseForce *= 0.001 + Math.random() * 0.1 - 0.05;
            }
        } else {
            mouseForce = 0;
            mouseAngle = 0;
        }
        
        this.velocityX += force * Math.cos(angle) + mouseForce * Math.cos(mouseAngle);
        this.velocityY += force * Math.sin(angle) + mouseForce * Math.sin(mouseAngle);
        
        this.velocityX *= 0.92;
        this.velocityY *= 0.92;
        
        this.x += this.velocityX;
        this.y += this.velocityY;
    }
};

ParticleSlider.prototype.Particle = psParticle;

ParticleSlider.prototype.swapList = function(particle, fromList, toList) {
    var self = this;
    
    if (particle === null) {
        particle = new self.Particle(self);
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
};

ParticleSlider.prototype.parseColor = function(color) {
    var result;
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
};

ParticleSlider.prototype.loadingStep = function() {
    var self = this;
    self.imagesLoaded++;
    
    if (self.imagesLoaded >= 3 || self.showArrowControls === false) {
        self.resize();
        if (self.slideDelay > 0) {
            self.nextSlideTimer = setTimeout(function() {
                self.nextSlide();
            }, 1000 * self.slideDelay);
        }
    }
};

ParticleSlider.prototype.$ = function(selector, context, multiple) {
    var self = this;
    
    if (selector[0] === ".") {
        var className = selector.substr(1);
        if (!context) {
            context = self.$$children;
        }
        
        var results = [];
        for (var i = 0, len = context.length; i < len; i++) {
            if (context[i].className && context[i].className === className) {
                results.push(context[i]);
            }
        }
        
        if (results.length === 0) {
            return null;
        } else if (results.length === 1 && !multiple) {
            return results[0];
        } else {
            return results;
        }
    }
    
    return document.getElementById(selector.substr(1));
};

ParticleSlider.prototype.nextFrame = function() {
    var self = this;
    
    if ((self.mouseDownRegion === 1 && self.mx < self.cw / 2) || 
        (self.mouseDownRegion === -1 && self.mx > self.cw / 2)) {
        self.swipeOffset = self.mx - self.cw / 2;
    } else {
        self.swipeOffset = 0;
    }
    
    var particle = self.pxlBuffer.first;
    var nextParticle = null;
    
    while (particle !== null) {
        nextParticle = particle.next;
        particle.move();
        particle = nextParticle;
    }
    
    self.drawParticles();
    
    if (self.frame++ % 25 === 0 && (self.cw !== self.getCw() || self.ch !== self.getCh())) {
        var newHeight = self.getCh();
        var newWidth = self.getCw();
        
        if (self.ch !== newWidth && typeof self.onWidthChange === "function") {
            self.onWidthChange(self, newWidth);
        }
        if (self.ch !== newHeight && typeof self.onHeightChange === "function") {
            self.onHeightChange(self, newHeight);
        }
        if (typeof self.onSizeChange === "function") {
            self.onSizeChange(self, newWidth, newHeight);
        }
        self.resize();
    }
    
    setTimeout(function() {
        self.requestAnimationFrame(function() {
            self.nextFrame();
        });
    }, 15);
};

ParticleSlider.prototype.nextSlide = function(direction) {
    var self = this;
    
    if (self.nextSlideTimer !== null && self.imgs.length > 1) {
        self.currImg = (self.currImg + self.imgs.length + (direction ? direction : 1)) % self.imgs.length;
        self.resize();
        
        if (self.slideDelay > 0) {
            self.nextSlideTimer = setTimeout(function() {
                self.nextSlide();
            }, 1000 * self.slideDelay);
        }
    } else if (self.slideDelay > 0) {
        self.nextSlideTimer = setTimeout(function() {
            self.nextSlide();
        }, 1000 * self.slideDelay);
    }
    
    if (typeof self.onNextSlide === "function") {
        self.onNextSlide(self.currImg);
    }
};

ParticleSlider.prototype.drawParticles = function() {
    var self = this;
    var imageData = self.ctx.createImageData(self.cw, self.ch);
    var data = imageData.data;
    var pixelIndex, x, y, pixelX, pixelY, color, alpha;
    
    var particle = self.pxlBuffer.first;
    while (particle !== null) {
        x = ~~particle.x;
        y = ~~particle.y;
        
        for (pixelX = x; pixelX < x + self.ptlSize && pixelX >= 0 && pixelX < self.cw; pixelX++) {
            for (pixelY = y; pixelY < y + self.ptlSize && pixelY >= 0 && pixelY < self.ch; pixelY++) {
                pixelIndex = (pixelY * imageData.width + pixelX) * 4;
                color = typeof particle.color === "function" ? particle.color() : particle.color;
                
                data[pixelIndex + 0] = color[0];
                data[pixelIndex + 1] = color[1];
                data[pixelIndex + 2] = color[2];
                data[pixelIndex + 3] = color[3];
            }
        }
        particle = particle.next;
    }
    
    imageData.data = data;
    self.ctx.putImageData(imageData, 0, 0);
};

ParticleSlider.prototype.getPixelFromImageData = function(imageData, offsetX, offsetY) {
    var self = this;
    var pixels = [];
    
    for (var x = 0; x < imageData.width; x += self.ptlGap + 1) {
        for (var y = 0; y < imageData.height; y += self.ptlGap + 1) {
            var pixelIndex = (y * imageData.width + x) * 4;
            var alpha = imageData.data[pixelIndex + 3];
            
            if (alpha > 0) {
                pixels.push({
                    x: offsetX + x,
                    y: offsetY + y,
                    color: self.monochrome === true ? 
                        [self.colorArr[0], self.colorArr[1], self.colorArr[2], self.colorArr[3]] :
                        [imageData.data[pixelIndex], imageData.data[pixelIndex + 1], 
                         imageData.data[pixelIndex + 2], imageData.data[pixelIndex + 3]]
                });
            }
        }
    }
    
    return pixels;
};

ParticleSlider.prototype.init = function(force) {
    var self = this;
    
    if (self.imgs.length > 0) {
        self.$srcCanv.width = self.imgs[self.currImg].width;
        self.$srcCanv.height = self.imgs[self.currImg].height;
        self.srcCtx.clearRect(0, 0, self.$srcCanv.width, self.$srcCanv.height);
        self.srcCtx.drawImage(self.imgs[self.currImg], 0, 0);
        
        var pixels = self.getPixelFromImageData(
            self.srcCtx.getImageData(0, 0, self.$srcCanv.width, self.$srcCanv.height),
            ~~(self.cw / 2 - self.$srcCanv.width / 2),
            ~~(self.ch / 2 - self.$srcCanv.height / 2)
        );
        
        if (self.showArrowControls === true) {
            // Previous button
            self.prevCtx.clearRect(0, 0, self.$prevCanv.width, self.$prevCanv.height);
            self.prevCtx.drawImage(self.imgControlPrev, 0, 0);
            
            var prevPixels = self.getPixelFromImageData(
                self.prevCtx.getImageData(0, 0, self.$prevCanv.width, self.$prevCanv.height),
                self.arrowPadding,
                ~~(self.ch / 2 - self.$prevCanv.height / 2)
            );
            
            for (var i = 0, len = prevPixels.length; i < len; i++) {
                prevPixels[i].color = function() {
                    return self.mx >= 0 && self.mx < self.arrowPadding * 2 + self.$prevCanv.width ? 
                        self.hoverColorArr : self.colorArr;
                };
                pixels.push(prevPixels[i]);
            }
            
            // Next button
            self.nextCtx.clearRect(0, 0, self.$nextCanv.width, self.$nextCanv.height);
            self.nextCtx.drawImage(self.imgControlNext, 0, 0);
            
            var nextPixels = self.getPixelFromImageData(
                self.nextCtx.getImageData(0, 0, self.$nextCanv.width, self.$nextCanv.height),
                self.cw - self.arrowPadding - self.$nextCanv.width,
                ~~(self.ch / 2 - self.$nextCanv.height / 2)
            );
            
            for (var i = 0, len = nextPixels.length; i < len; i++) {
                nextPixels[i].color = function() {
                    return self.mx > 0 && self.mx > self.cw - (self.arrowPadding * 2 + self.$nextCanv.width) ? 
                        self.hoverColorArr : self.colorArr;
                };
                pixels.push(nextPixels[i]);
            }
        }
        
        if (self.currImg !== self.lastImg || force === true) {
            pixels.shuffle();
            self.lastImg = self.currImg;
        }
        
        var particle = self.pxlBuffer.first;
        for (var i = 0, len = pixels.length; i < len; i++) {
            var newParticle = null;
            
            if (particle !== null) {
                newParticle = particle;
                particle = particle.next;
            } else {
                self.swapList(self.recycleBuffer.first, self.recycleBuffer, self.pxlBuffer);
                newParticle = self.pxlBuffer.first;
            }
            
            newParticle.gravityX = pixels[i].x;
            newParticle.gravityY = pixels[i].y;
            newParticle.color = pixels[i].color;
        }
        
        while (particle !== null) {
            particle.ttl = ~~(Math.random() * 10);
            particle.gravityY = ~~(self.ch * Math.random());
            particle.gravityX = ~~(self.cw * Math.random());
            particle = particle.next;
        }
        
        self.$overlay.innerHTML = self.$$slides[self.currImg].innerHTML;
    }
};

ParticleSlider.prototype.getCw = function() {
    var self = this;
    return Math.min(document.body.clientWidth, self.width, self.$container.clientWidth);
};

ParticleSlider.prototype.getCh = function() {
    var self = this;
    return Math.min(document.body.clientHeight, self.height, self.$container.clientHeight);
};

ParticleSlider.prototype.resize = function() {
    var self = this;
    self.cw = self.getCw();
    self.ch = self.getCh();
    self.$canv.width = self.cw;
    self.$canv.height = self.ch;
    self.init(true);
};

ParticleSlider.prototype.setColor = function(color) {
    var self = this;
    self.colorArr = self.parseColor(color);
};

ParticleSlider.prototype.setHoverColor = function(color) {
    var self = this;
    self.hoverColorArr = self.parseColor(color);
};

ParticleSlider.prototype.requestAnimationFrame = function(callback) {
    var self = this;
    var requestAnimFrame = window.requestAnimationFrame || 
                          window.webkitRequestAnimationFrame || 
                          window.mozRequestAnimationFrame || 
                          window.oRequestAnimationFrame || 
                          window.msRequestAnimationFrame || 
                          function(callback) {
                              window.setTimeout(callback, 1000 / 60);
                          };
    requestAnimFrame(callback);
};