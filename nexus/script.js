class ParticleField {
  constructor() {
    this.canvas = document.getElementById("particle-container");
    this.ctx = this.canvas.getContext("2d");
    this.particles = [];
    this.mousePosition = { x: 0, y: 0 };
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("mousemove", (e) => {
      this.mousePosition.x = e.clientX;
      this.mousePosition.y = e.clientY;
    });

    this.createParticles();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    const particleCount = 100;
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 1,
        speedX: Math.random() * 2 - 1,
        speedY: Math.random() * 2 - 1,
        color: Math.random() > 0.5 ? "#6e00ff" : "#00fff2",
      });
    }
  }

  animate() {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((particle) => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;

      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.y > this.canvas.height) particle.y = 0;
      if (particle.y < 0) particle.y = this.canvas.height;

      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color;
      this.ctx.fill();

      const dx = this.mousePosition.x - particle.x;
      const dy = this.mousePosition.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 100) {
        this.ctx.beginPath();
        this.ctx.moveTo(particle.x, particle.y);
        this.ctx.lineTo(this.mousePosition.x, this.mousePosition.y);
        this.ctx.strokeStyle = `rgba(110, 0, 255, ${1 - distance / 100})`;
        this.ctx.stroke();
      }
    });

    requestAnimationFrame(() => this.animate());
  }
}
class VimEditor {
  constructor() {
    this.lines = [
      ["# Unlock Your Potential", 2000],
      ["", 10],
      ["We are at the dawn of a new era", 10],
      ["where technology transcends its", 10],
      ["role as mere tools and becomes", 10],
      ["an extension of human creativity", 10],
      ["and capability.", 500],
      ["", 10],
      ["This is our vision.", 1000],
      ["", 10],
      ["We believe that technology will", 10],
      ["evolve beyond mere automation", 10],
      ["and become amplifiers of our", 10],
      ["imagination.", 500],
      ["The next generation of tools will", 10],
      ["not replace human creativity", 10],
      ["but rather unlock new dimensions", 10],
      ["of possibility that we have", 10],
      ["yet to imagine.", 2000],
    ];
    this.currentLine = 0;
    this.currentChar = 0;
    this.textContent = document.querySelector(".text-content");
    this.lineNumbers = document.querySelector(".line-numbers");
    this.cursor = document.querySelector(".cursor");
    this.typing = true;
    this.init();
  }

  init() {
    this.updateLineNumbers();
    this.typeNextChar();
  }

  updateLineNumbers() {
    this.lineNumbers.innerHTML = Array.from(
      { length: Math.max(1, this.currentLine + 1) },
      (_, i) => `<div class="line">${i + 1}</div>`
    ).join("");
  }

  createNewLine() {
    const newLine = document.createElement("ul");
    newLine.className = "line";
    return newLine;
  }

  resetEditor() {
    this.currentLine = 0;
    this.currentChar = 0;
    this.textContent.innerHTML = "";
    const cursor = document.createElement("div");
    cursor.className = "cursor";
    this.textContent.appendChild(cursor);
    this.cursor = cursor;
    this.updateLineNumbers();
    setTimeout(() => this.typeNextChar(), 2000);
  }

  typeNextChar() {
    if (this.currentLine >= this.lines.length) {
      setTimeout(() => this.resetEditor(), 3000);
      return;
    }

    const current = this.lines[this.currentLine];
    const currentText = current[0];
    const currentDelay = current[1];

    // Initialize new line if starting
    if (this.currentChar === 0) {
      // Clear previous content and recreate structure
      this.textContent.innerHTML = "";

      // Add previous completed lines
      for (let i = 0; i < this.currentLine; i++) {
        const line = this.createNewLine();
        line.textContent = this.lines[i][0];
        this.textContent.appendChild(line);
      }

      // Add current line and cursor
      const currentLineElement = this.createNewLine();
      this.textContent.appendChild(currentLineElement);
      const cursor = document.createElement("div");
      cursor.className = "cursor";
      this.textContent.appendChild(cursor);
      this.cursor = cursor;
    }

    // Get the current line element (always the last line before cursor)
    const currentLineElement = this.textContent.querySelector(
      ":nth-last-child(-n+1 of ul.line)"
    );

    if (currentLineElement && this.currentChar < currentText.length) {
      currentLineElement.textContent = currentText.slice(
        0,
        this.currentChar + 1
      );
      this.cursor.style.left = `${this.currentChar + 2.1}ch`;
      this.cursor.style.top = `${this.currentLine * 1.5}em`;
      this.currentChar++;
      this.cursor.classList.add("typing");

      setTimeout(() => this.typeNextChar(), 50 + Math.random() * 50);
    } else {
      this.cursor.classList.remove("typing");
      this.currentChar = 0;
      this.currentLine++;
      this.updateLineNumbers();
      setTimeout(() => this.typeNextChar(), currentDelay);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadScript();
});

function loadScript() {
  new ParticleField();
  new VimEditor();
}

(async function () {
  const init = () => {
    loadScript();
  };
  init();
})();
