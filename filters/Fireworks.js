const particles = [];
const gravity = 0.05; // Simulate gravity pulling particles down
const friction = 0.98; // Simulate air resistance slowing particles

class Particle {
  constructor(x, y, radius, color, velocity, ctx) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.alpha = 1; // Transparency of the particle
    this.trail = []; // Stores previous positions for the trail
    this.trailLength = 10; // Number of previous positions to store
    this.ctx = ctx;
  }

  draw() {
    this.ctx.save();
    this.ctx.globalAlpha = this.alpha; // Apply current transparency
    // Draw the particle's trail
    for (let i = 0; i < this.trail.length; i++) {
      const trailParticle = this.trail[i];
      this.ctx.beginPath();
      this.ctx.arc(trailParticle.x, trailParticle.y, trailParticle.radius, 0, Math.PI * 2, false);
      this.ctx.fillStyle = this.color;
      this.ctx.fill();
    }

    // Draw the main particle
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    this.ctx.fillStyle = this.color;
    this.ctx.fill();
    this.ctx.restore();
  }

  update() {
    // Apply friction and gravity to velocity
    this.velocity.x *= friction;
    this.velocity.y *= friction;
    this.velocity.y += gravity;

    // Update position based on velocity
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    // Fade out the particle over time
    this.alpha -= 0.005;

    // Add current position to the trail
    this.trail.push({ x: this.x, y: this.y, radius: this.radius * 0.5 });
    if (this.trail.length > this.trailLength) {
      this.trail.shift(); // Remove oldest trail point
    }
  }
}

export function FireworksFilter(ctx, width, height) {

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);

  function createFirework(x, y) {
    const particleCount = Math.floor(Math.random() * 160); // Number of particles in the explosion
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF', '#FFFFFF'];
    const color = colors[Math.floor(Math.random() * colors.length)]; // Random color

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2; // Random angle for particle trajectory
      const speed = Math.random() * 3 + 1; // Random speed for particles
      const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      };
      particles.push(new Particle(x, y, 2, color, velocity, ctx));
    }
  }

  if (particles.length === 0) {
    for (let i = 0; i < 5; i++) {
      createFirework(Math.random() * width, Math.random() * height / 2);
    }
  }

  function animate() {
    // Clear the canvas with a fading black effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // Semi-transparent black for fade effect
    ctx.fillRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.update();
      particle.draw();

      // Remove particles that have faded out or are too small
      if (particle.alpha <= 0.01 || particle.radius < 0.5) {
        particles.splice(i, 1);
      }
    }

    // Periodically create new fireworks launching from the bottom
    if (Math.random() < 0.02) { // 2% chance each frame to launch a new firework
      createFirework(Math.random() * width, height * 0.3); // Launch from bottom
    }
  }

  animate(); // Start the animation
}


