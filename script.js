// script.js
const canvas = document.getElementById('logoCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];
const logoShape = []; // Array of target coordinates for particles to form the logo

// Logo dimensions
const LOGO_WIDTH = 731;
const LOGO_HEIGHT = 107;

// Example: Function to get logo shape coordinates (replace with your logic)
function getLogoCoordinates(imageSrc, particleGap = 0) {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
        const offscreenCanvas = document.createElement('canvas');
        const offscreenCtx = offscreenCanvas.getContext('2d');
        offscreenCanvas.width = img.width;
        offscreenCanvas.height = img.height;
        offscreenCtx.drawImage(img, 0, 0);

        const imageData = offscreenCtx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;

        // Find bounding box of non-transparent pixels
        let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
        for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
                const index = (y * img.width + x) * 4;
                const alpha = data[index + 3];
                if (alpha > 0) {
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                }
            }
        }
        const logoWidth = maxX - minX;
        const logoHeight = maxY - minY;

        // Calculate final logo position (centered on page)
        const finalLogoX = canvas.width / 2 - LOGO_WIDTH / 2;
        const finalLogoY = canvas.height / 2 - LOGO_HEIGHT / 2;

        // Calculate scale factors
        const scaleX = LOGO_WIDTH / logoWidth;
        const scaleY = LOGO_HEIGHT / logoHeight;

        // Calculate viewport-scaled logo position (for starting positions)
        const viewportScaleX = canvas.width / logoWidth;
        const viewportScaleY = canvas.height / logoHeight;
        const viewportScale = Math.min(viewportScaleX, viewportScaleY) * 0.98; // 0.8 to leave some margin

        // Calculate viewport-scaled logo center
        const viewportLogoX = canvas.width / 2 - (logoWidth * viewportScale) / 2;
        const viewportLogoY = canvas.height / 2 - (logoHeight * viewportScale) / 2;

        // Now push coordinates with both start and target positions
        for (let y = 0; y < img.height; y += (particleGap + 1))  {
            for (let x = 0; x < img.width; x += (particleGap + 1)) {
                const index = (y * img.width + x) * 4;
                const alpha = data[index + 3];
                if (alpha > 0) {
                    // Calculate relative position within the logo (0-1)
                    const relativeX = (x - minX) / logoWidth;
                    const relativeY = (y - minY) / logoHeight;

                    // Calculate start position (viewport-scaled)
                    const startX = viewportLogoX + (relativeX * logoWidth * viewportScale);
                    const startY = viewportLogoY + (relativeY * logoHeight * viewportScale);

                    // Calculate target position (final logo size)
                    const targetX = finalLogoX + (relativeX * LOGO_WIDTH);
                    const targetY = finalLogoY + (relativeY * LOGO_HEIGHT);

                    logoShape.push({ 
                        startX, 
                        startY, 
                        targetX, 
                        targetY 
                    });
                }
            }
        }
        initParticles();
    };
}

class Particle {
    constructor(startX, startY, targetX, targetY) {
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.97;
        this.radius = 1;
        this.color = 'white';
        this.animationProgress = 0;
        this.animationSpeed = 0.02; // Adjust for faster/slower animation
    }

    update() {
        // Calculate direction to target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Attraction force
        if (distance > 1) {
            const attractionForce = 0.2;
            this.vx += (dx / distance) * attractionForce;
            this.vy += (dy / distance) * attractionForce;
        }

        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Update animation progress
        this.animationProgress += this.animationSpeed;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    for (let i = 0; i < logoShape.length; i++) {
        const particle = new Particle(
            logoShape[i].startX, 
            logoShape[i].startY, 
            logoShape[i].targetX, 
            logoShape[i].targetY
        );
        particles.push(particle);
    }
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
}

// Call function to load logo and start animation
getLogoCoordinates('./bryan-elliott-image.png', 2);
animate();