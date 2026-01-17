class Starfield {
    constructor({
        canvasId = "starfield",
        starsCount = 300,
        starsColor = "#ffffff",
        starsRotationSpeed = 3, // degrees per second
        nebulasIntensity = 10,
        bgColor = "rgb(8,8,8)",
        originOffsetX = 0,
        originOffsetY = 0
    } = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Starfield: canvas with id "${canvasId}" not found.`);
        }
        this.ctx = this.canvas.getContext("2d");
        this.colorCtx = document.createElement("canvas").getContext("2d");
        this.starsCount = starsCount;
        this.starsColor = this.parseColor(starsColor);
        this.starsRotationSpeed = starsRotationSpeed;
        this.nebulasIntensity = nebulasIntensity;
        this.bgColor = bgColor;
        this.originOffsetX = originOffsetX;
        this.originOffsetY = originOffsetY;

        this.nebulaCanvas = document.createElement("canvas");
        this.nebulaCtx = this.nebulaCanvas.getContext("2d");
        this.randomSeed = 43214;
        this.nebulaColors = ["rgb(6,2,122)", "rgb(6,66,18)", "#57046e"].map((c) => this.parseColor(c));
        this.nebulaLayers = this.buildNebulaLayers();

        this.stars = [];
        this.starBuffer = document.createElement("canvas");
        this.starBufferCtx = this.starBuffer.getContext("2d");
        this.isRunning = false;
        this.rafId = null;
        this.lastTimestamp = null;
        this.starRotation = 0;

        this.resize = this.resize.bind(this);
        this.loop = this.loop.bind(this);

        this.resize();
        window.addEventListener("resize", this.resize);
        this.initStars();
        this.renderNebula();
        this.play();
    }

    regenerateNebula(seed) {
        if (typeof seed === "number" && Number.isFinite(seed)) {
            this.randomSeed = seed >>> 0;
        } else {
            this.randomSeed = Math.floor(Math.random() * 4294967296) >>> 0;
        }
        this.nebulaLayers = this.buildNebulaLayers();
        this.renderNebula();
    }

    parseColor(color) {
        if (!this.colorCtx) {
            this.colorCtx = document.createElement("canvas").getContext("2d");
        }
        const ctx = this.colorCtx;
        if (!ctx) {
            throw new Error("Starfield: unable to create 2d context for color parsing.");
        }
        ctx.fillStyle = color;
        const computed = ctx.fillStyle;
        ctx.fillStyle = computed;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return [r, g, b];
    }

    nextRandom() {
        // simple LCG for deterministic layering
        this.randomSeed = (this.randomSeed * 1664525 + 1013904223) % 4294967296;
        return this.randomSeed / 4294967296;
    }

    buildNebulaLayers() {
        const layers = [];
        const layersPerColor = 2;
        for (let c = 0; c < this.nebulaColors.length; c++) {
            for (let i = 0; i < layersPerColor; i++) {
                const cxNorm = 0.1 + this.nextRandom() * 0.8;
                const cyNorm = 0.1 + this.nextRandom() * 0.8;
                const radiusFactor = 0.25 + this.nextRandom() * 0.15;
                layers.push({
                    color: this.nebulaColors[c],
                    cxNorm,
                    cyNorm,
                    radiusFactor
                });
            }
        }
        return layers;
    }

    resize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.originX = this.canvas.width / 2 + this.originOffsetX;
        this.originY = this.canvas.height / 2 + this.originOffsetY;
        this.starBuffer.width = this.canvas.width;
        this.starBuffer.height = this.canvas.height;
        this.renderNebula();
        this.initStars();
    }

    initStars() {
        const maxRadius = Math.hypot(this.canvas.width, this.canvas.height) * 0.55;
        this.stars = new Array(this.starsCount).fill(0).map(() => {
            // sqrt-distribution to spread stars more evenly across the area
            const distance = Math.sqrt(Math.random()) * maxRadius;
            const angle = Math.random() * Math.PI * 2;
            const size = Math.random() * 1.5 + 0.2;
            return { distance, angle, size };
        });
        this.renderStarBuffer();
    }

    renderNebula() {
        const { nebulaCtx: ctx, nebulaCanvas: canvas, nebulasIntensity, bgColor } = this;
        if (!ctx) return;
        canvas.width = this.canvas.width;
        canvas.height = this.canvas.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const alphaScale = Math.min(0.3, nebulasIntensity * 0.01);
        ctx.globalCompositeOperation = "lighter";
        this.nebulaLayers.forEach((layer) => {
            const cx = canvas.width * layer.cxNorm;
            const cy = canvas.height * layer.cyNorm;
            const radius = Math.max(canvas.width, canvas.height) * layer.radiusFactor;
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            gradient.addColorStop(0, this.withAlpha(layer.color, alphaScale));
            gradient.addColorStop(0.32, this.withAlpha(layer.color, alphaScale * 0.85));
            gradient.addColorStop(0.6, this.withAlpha(layer.color, alphaScale * 0.4));
            gradient.addColorStop(1, this.withAlpha(layer.color, 0));
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });
        ctx.globalCompositeOperation = "source-over";
    }

    renderStarBuffer() {
        const ctx = this.starBufferCtx;
        if (!ctx) return;
        ctx.clearRect(0, 0, this.starBuffer.width, this.starBuffer.height);
        ctx.fillStyle = `rgb(${this.starsColor[0]}, ${this.starsColor[1]}, ${this.starsColor[2]})`;
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            const x = this.originX + Math.cos(star.angle) * star.distance;
            const y = this.originY + Math.sin(star.angle) * star.distance;
            ctx.beginPath();
            ctx.arc(x, y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    withAlpha(colorArr, alpha) {
        return `rgba(${colorArr[0]}, ${colorArr[1]}, ${colorArr[2]}, ${alpha})`;
    }

    drawStars(deltaSeconds) {
        const { ctx, originX, originY, starsRotationSpeed } = this;
        const rotationRadians = (starsRotationSpeed * Math.PI / 180) * deltaSeconds;
        this.starRotation += rotationRadians;

        ctx.save();
        ctx.translate(originX, originY);
        ctx.rotate(this.starRotation);
        ctx.translate(-originX, -originY);
        ctx.drawImage(this.starBuffer, 0, 0);
        ctx.restore();
    }

    loop(timestamp) {
        if (!this.isRunning) return;
        if (this.lastTimestamp === null) {
            this.lastTimestamp = timestamp;
        }
        const deltaMs = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        const deltaSeconds = deltaMs / 1000;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.nebulaCanvas) {
            this.ctx.drawImage(this.nebulaCanvas, 0, 0);
        }
        this.drawStars(deltaSeconds);

        this.rafId = requestAnimationFrame(this.loop);
    }

    play() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTimestamp = null;
        this.rafId = requestAnimationFrame(this.loop);
    }

    pause() {
        if (!this.isRunning) return;
        this.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    destroy() {
        this.pause();
        window.removeEventListener("resize", this.resize);
    }
}

export { Starfield };
