const vShader = `#version 300 es
precision mediump float;

in vec4 position;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
out vec3 vBaryCoord;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
    vBaryCoord = vec3(position.w == 0.0 ? 1.0 : 0.0,
                        position.w == 1.0 ? 1.0 : 0.0,
                        position.w == 2.0 ? 1.0 : 0.0);
}`;

const fShader = `#version 300 es
precision mediump float;

uniform highp float time;
in vec3 vBaryCoord;
out vec4 fragColor;

vec4 smoothRandomColor(float time) {
    float r = 0.5 + 0.5 * sin(time * 0.1);
    float g = 0.5 + 0.5 * sin(time * 0.15);
    float b = 0.5 + 0.5 * sin(time * 0.2);
    
    return vec4(r, g, b, 1.0);
}

float edgeFactor() {
    vec3 d = fwidth(vBaryCoord);
    vec3 a3 = smoothstep(vec3(0.0), d * 1.5, vBaryCoord);
    return min(min(a3.x, a3.y), a3.z);
}

void main() {
    vec4 wireColor = smoothRandomColor(time);
    vec4 faceColor = vec4(0.3, 0.3, 0.3, 0.8);
    
    float ef = edgeFactor();
    fragColor = mix(wireColor, faceColor, ef);
}`;

class MeshRenderer {
  constructor() {
    this.canvas = document.getElementById("meshCanvas");
    this.gl = this.canvas.getContext("webgl2");
    if (!this.gl) throw new Error("WebGL2 not supported");

    this.resizeCanvas();
    this.initGL();
    this.createShaderProgram();
    this.createMesh();
    this.setupMouseInteraction();
    this.render();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth * devicePixelRatio;
    this.canvas.height = window.innerHeight * devicePixelRatio;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  initGL() {
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.SAMPLE_ALPHA_TO_COVERAGE);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
  }

  createShaderProgram() {
    const vertexShader = this.createShader(
      this.gl,
      this.gl.VERTEX_SHADER,
      vShader
    );
    const fragmentShader = this.createShader(
      this.gl,
      this.gl.FRAGMENT_SHADER,
      fShader
    );

    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      throw new Error("Shader program failed to link");
    }
  }

  createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  createMesh() {
    const gridSize = 40;
    const vertices = [];
    const size = 4.0;

    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const x = (i / gridSize - 0.5) * size;
        const z = (j / gridSize - 0.5) * size;
        const y = Math.sin(i * 0.3) * Math.cos(j * 0.3) * 0.2;

        if (i < gridSize && j < gridSize) {
          // First triangle
          vertices.push(x, y, z, 0);
          vertices.push(x + size / gridSize, y, z, 1);
          vertices.push(x, y, z + size / gridSize, 2);

          // Second triangle
          vertices.push(x + size / gridSize, y, z, 0);
          vertices.push(x + size / gridSize, y, z + size / gridSize, 1);
          vertices.push(x, y, z + size / gridSize, 2);
        }
      }
    }

    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(vertices),
      this.gl.STATIC_DRAW
    );
    this.vertexCount = vertices.length / 4;
  }

  setupMouseInteraction() {
    this.mousePos = { x: 0, y: 0 };
    this.canvas.addEventListener("mousemove", (e) => {
      this.mousePos.x = (e.clientX / this.canvas.width) * 2 - 1;
      this.mousePos.y = -(e.clientY / this.canvas.height) * 2 + 1;
    });
  }

  render() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.gl.useProgram(this.program);

    // Set up attributes
    const positionLocation = this.gl.getAttribLocation(
      this.program,
      "position"
    );
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.vertexAttribPointer(
      positionLocation,
      4,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    // Set up matrices
    const modelViewMatrix = this.createModelViewMatrix();
    const projectionMatrix = this.createProjectionMatrix();

    const modelViewLocation = this.gl.getUniformLocation(
      this.program,
      "modelViewMatrix"
    );
    const projectionLocation = this.gl.getUniformLocation(
      this.program,
      "projectionMatrix"
    );

    this.gl.uniformMatrix4fv(modelViewLocation, false, modelViewMatrix);
    this.gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);

    const timeLocation = this.gl.getUniformLocation(this.program, "time");
    this.gl.uniform1f(timeLocation, performance.now() * 0.001);

    // Draw
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertexCount);

    requestAnimationFrame(() => this.render());
  }

  createModelViewMatrix() {
    // Simple rotation matrix
    const time = performance.now() * 0.001;
    const cos = Math.cos(time * 0.5);
    const sin = Math.sin(time * 0.5);

    return new Float32Array(
      [cos, 0, sin, 0]
        .concat([0, 1, 0, 0])
        .concat([-sin, 0, cos, 0])
        .concat([0, 0, -5, 1])
    );
  }

  createProjectionMatrix() {
    const aspect = this.canvas.width / this.canvas.height;
    const fov = Math.PI / 4;
    const near = 0.1;
    const far = 100.0;

    const f = 1.0 / Math.tan(fov / 2);

    return new Float32Array(
      [f / aspect, 0, 0, 0]
        .concat([0, f, 0, 0])
        .concat([0, 0, (far + near) / (near - far), -1])
        .concat([0, 0, (2 * far * near) / (near - far), 0])
    );
  }
}

window.addEventListener("load", () => {
  loadScript();
});

window.addEventListener("resize", () => {
  location.reload();
});

function loadScript() {
  new MeshRenderer();
}

(async function () {
  const init = () => {
    loadScript();
  };
  init();
})();
