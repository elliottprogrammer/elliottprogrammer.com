#### elliottprogrammer.com portfolio website

Currently in development - Coming soon!!


#### Goal: Create particles that attract to make the shape of a logo or basic image.

Creating a particle animation that forms a logo in Javascript typically involves using an HTML5 Canvas and libraries like particles.js or building it with vanilla Javascript and basic physics principles.

Here's a breakdown of the process:
1. Setting up the canvas
- HTML: You'll need an HTML Canvas element where the animation will be drawn.
- Javascript: Get a reference to the Canvas and its 2D rendering context.
2. Defining particles and physics
- Particle Class: Create a Javascript class or object to represent each particle. Each particle should have properties like its position (x, y), velocity (vx, vy), acceleration, friction, and a target destination within the logo's shape.
- Motion and Attraction: Implement physics within the particle's update method:
    - Attraction: Calculate the force of attraction towards the target destination within the logo. This force will guide the particles toward their final positions.
    - Friction: Apply friction to gradually slow down the particles as they approach their destination.
    - Collision Detection: You might consider incorporating collision detection for more realistic particle behavior, especially if particles are interacting with each other.
3. Creating the logo shape
- Logo Representation: The logo can be represented in various ways:
    - Pixel Data: If it's an image, you could load the image onto an off-screen canvas and analyze its pixel data to determine the target positions for particles within the logo's shape.
    - Predefined Coordinates: For a simpler shape or text, you can predefine the coordinates that form the logo's outline.
- Particle Generation: Generate particles either randomly on the canvas or strategically near the logo's shape.
4. Animation loop
- requestAnimationFrame: Use requestAnimationFrame for a smooth animation loop that syncs with the browser's refresh rate.
- Clear and Redraw: In each frame of the animation:
    - Clear the canvas.
    - Update each particle's position and velocity based on the physics calculations.
    - Draw the particles on the canvas.
5. User interaction (optional)
- Mouse Interaction: You can add interactivity where the mouse pointer repels or attracts particles, creating a dynamic effect.

#### Libraries

While the animation can be built with vanilla Javascript, libraries like Particles.js or Proton can simplify the process of creating and managing particle effects. Particles.js is a lightweight Javascript library that allows for customizing particle shapes, sizes, colors, and interactions. You can define the attraction behavior using the `attract` property within its configuration.
```javascript
// Example (simplified) structure for the animation

// index.html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; overflow: hidden; background-color: black; }
        canvas { display: block; }
    </style>
</head>
<body>
    <canvas id="logoCanvas"></canvas>
    <script src="script.js"></script>
</body>
</html>

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
        this.friction = 0.9;
        this.radius = Math.random() * 2 + 1;
        this.color = 'white'; // Customize particle color
    }

    update() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Attraction force
        if (distance > 1) { // Avoid division by zero
            const attractionForce = 0.05; // Adjust as needed
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
getLogoCoordinates('your-logo.png'); // Replace 'your-logo.png' with your logo image path
animate();
```

Remember to adapt it to your specific logo and desired animation effects. Consider factors like particle density, attraction strength, and friction to achieve the visual style you're aiming for. Testing the animation on different devices is recommended to ensure smooth performance.