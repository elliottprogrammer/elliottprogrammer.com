// script.js
const canvas = document.getElementById('logoCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];
const logoShape = []; // Array of target coordinates for particles to form the logo

// Example: Function to get logo shape coordinates (replace with your logic)
function getLogoCoordinates(imageSrc) {
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

        for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
                const index = (y * img.width + x) * 4;
                const alpha = data[index + 3];
                if (alpha > 0) { // Only consider non-transparent pixels
                    logoShape.push({ x: x, y: y });
                }
            }
        }
        initParticles();
    };
}

class Particle {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.friction = .95;
        this.radius = 1;//Math.random() * 2 + 1;
        this.color = 'white'; // Customize particle color
    }

    update() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Attraction force
        if (distance > 1) { // Avoid division by zero
            const attractionForce = 0.3; // Adjust as needed
            this.vx += (dx / distance) * attractionForce;
            this.vy += (dy / distance) * attractionForce;
        }

        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Update position
        this.x += this.vx;
        this.y += this.vy;
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
        const randomX = Math.random() * canvas.width;
        const randomY = Math.random() * canvas.height;
        const particle = new Particle(randomX, randomY, logoShape[i].x, logoShape[i].y);
        particles.push(particle);
    }
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
}

// Call function to load logo and start animation
getLogoCoordinates('./bryan-elliott-image.png');
animate();