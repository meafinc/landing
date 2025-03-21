const vertexShaderSource = `#version 300 es
precision mediump float;

in vec4 position;

void main() {
    gl_Position = position; // Pass through position
}`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

uniform float time;
uniform vec2 resolution;
out vec4 fragColor;

// Adjust saturation
vec3 adjustSaturation(vec3 color, float saturation) {
    const vec3 luminosityFactor = vec3(0.2126, 0.7152, 0.0722); // Human perception factors
    vec3 grayscale = vec3(dot(color, luminosityFactor)); // Convert to grayscale
    return mix(grayscale, color, 1.0 + saturation); // Interpolate between grayscale and original color
}

// Adjust contrast
vec3 adjustContrast(vec3 color, float contrast) {
    return mix(vec3(0.5), color, contrast); // Blend between gray and original color
}

vec2 pixelate(vec2 uv, float pixels) {
    vec2 pix = vec2(pixels) * vec2(resolution.x / resolution.y, 1.0);
    return floor(uv * pix) / pix;
}

float scanlines(vec2 uv) {
    return 0.9 + 0.1 * sin(uv.y * resolution.y * 3.1415);
}

void main() {
    // Base coordinates
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / resolution.y;

    // Pixelation effect (adjust for resolution)
    uv = pixelate(uv, 64.0);

    // Animated wave pattern
    float dist = length(uv);
    float angle = atan(uv.y, uv.x);
    float pattern = sin(dist * 20.0 - time * 5.0) * cos(angle * 5.0 + time * 2.0);

    // Base color from palette
    vec3 baseColor = vec3(pattern * 0.5 + 0.1, pattern * 0.4 + 0.1, pattern * 0.7 + 0.3);

    // Apply saturation adjustment (higher values for vibrancy)
    baseColor = adjustSaturation(baseColor, 1.5);

    // Apply contrast adjustment (higher values for sharper colors)
    baseColor = adjustContrast(baseColor, 1.8);

    // Retro effects: scanlines and slight distortion
    baseColor *= scanlines(uv);
    
    fragColor = vec4(baseColor, 1.0);
}
`;


function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program linking error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function main() {
  const canvas = document.getElementById("retroCanvas");
  const gl = canvas.getContext("webgl2");

  if (!gl) {
    console.error("WebGL2 not supported in this browser.");
    return;
  }

  // Resize canvas to fit the screen
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  resizeCanvas();

  window.addEventListener("resize", resizeCanvas);

  const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

  const positionBuffer = gl.createBuffer();

  const positions = [-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1];

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, "position");

  const vao = gl.createVertexArray();

  gl.bindVertexArray(vao);

  gl.enableVertexAttribArray(positionLocation);

  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  let timeUniformLocation = null;
  let resolutionUniformLocation = null;

  function render(time) {
    time *= 0.001; // Convert to seconds
    resizeCanvas();

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    // Set uniforms
    if (!timeUniformLocation) {
      timeUniformLocation = gl.getUniformLocation(program, "time");
      resolutionUniformLocation = gl.getUniformLocation(program, "resolution");
    }

    gl.uniform1f(timeUniformLocation, time);
    gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);

    // Draw full-screen quad
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
  }

  // Start rendering loop
  requestAnimationFrame(render);
}

// Initialize the demo
main();

// Add CRT overlay effect
const crtOverlay = document.createElement("div");
crtOverlay.style = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    background: 
        linear-gradient(to bottom, 
            rgba(0, 0, 0, 0.1) 50%, 
            rgba(0, 0, 0, 0.2) 51%),
        radial-gradient(circle at center,
            transparent 60%,
            rgba(0, 0, 0, 0.4));
    background-size: 100% 4px, 100% 100%;
    z-index: 2;
`;
document.body.appendChild(crtOverlay);
