'use strict'; // Enforce strict mode to catch common JavaScript errors

// Declare global variables used throughout the rendering pipeline
let glCanvas, glContext, glDrawCount, glDrawCalls, glEnableFog = 1;
let glActiveTexture, glShader, glArrayBuffer, glPositionData, glColorData;
let glEnvironmentColors = {
    skyColor: rgb(0.5, 0.8, 1.0),
    fogColor: rgb(0.7, 0.9, 1.0),
    groundColor: rgb(0.2, 0.6, 0.2),
    brightness: 1.0,
    fogDensity: 0.3
};

// Add this function to update environment colors
function updateEnvironmentColors() {
    const env = environmentManager.getCurrentEnvironment();
    glEnvironmentColors.skyColor = env.skyColor;
    glEnvironmentColors.fogColor = env.fogColor;
    glEnvironmentColors.groundColor = env.groundColor;
    glEnvironmentColors.brightness = env.brightness;
    glEnvironmentColors.fogDensity = env.fogDensity;
}
///////////////////////////////////////////////////////////////////////////////
// Initialize WebGL context and setup shaders, buffers, and render settings
function glInit() {
    // Create a new canvas element and append it to the document body
    document.body.appendChild(glCanvas = document.createElement('canvas'));

    // Initialize WebGL2 rendering context with anti-aliasing disabled
    glContext = glCanvas.getContext('webgl2', {antialias: false});

    // Create and compile vertex and fragment shaders, and link them into a program
    glShader = glCreateProgram(
        // Vertex Shader
        '#version 300 es\n' +
        'precision highp float;' +
        'uniform vec4 l,g,a;' +         // Light direction, light color, ambient color
        'uniform mat4 m,o;' +           // Combined matrix, object transform matrix
        'in vec4 p,n,u,c;' +            // Position, normal, UV coordinates, color
        'out vec4 v,d,e;' +             // Varying UV, color, and transformed position
        'void main(){' +
        'e = o * p;' +                  // Apply object transformation to vertex
        'gl_Position = m * e;' +        // Apply camera and projection transformation
        'd = n.z > 1. ? c : c * (a + vec4(g.xyz * dot(l.xyz, normalize(transpose(inverse(mat3(o))) * n.xyz)), 1));' + // Compute lighting
        'v = u;' +                      // Pass UV to fragment shader
        '}' ,

        // Fragment Shader
        '#version 300 es\n' +
        'precision highp float;' +
        'in vec4 v,d,e;' +              // UV, color, and position from vertex shader
        'uniform vec4 f;' +             // Fog color and density
        'uniform sampler2D s;' +        // Texture sampler
        'out vec4 c;' +                 // Final color output
        'void main(){' +
        'c = v.z > 1. ? d : texture(s, v.xy) * d;' + // Use solid color if v.z > 1, else apply texture
        'c = v.w > 1. ? c : vec4(mix(f.xyz, c.xyz, 1. - (gl_FragCoord.z / gl_FragCoord.w) / 5e4), c.w);' + // Apply fog
        '}' 
    );

    // Create and initialize shared vertex buffer (used for both position and color)
    const glVertexData = new ArrayBuffer(gl_VERTEX_BUFFER_SIZE);
    glPositionData = new Float32Array(glVertexData); // Float view for position/normal/uv
    glColorData = new Uint32Array(glVertexData);     // Uint view for color

    // Activate shader program and texture
    glContext.useProgram(glShader);
    glContext.activeTexture(gl_TEXTURE0);
    glContext.bindTexture(gl_TEXTURE_2D, glActiveTexture);

    // Create and bind vertex buffer
    glContext.bindBuffer(gl_ARRAY_BUFFER, glArrayBuffer = glContext.createBuffer());
    glContext.bufferData(gl_ARRAY_BUFFER, gl_VERTEX_BUFFER_SIZE, gl_DYNAMIC_DRAW);

    // Set blending and culling
    glContext.blendFunc(gl_SRC_ALPHA, gl_ONE_MINUS_SRC_ALPHA);
    glContext.enable(gl_CULL_FACE);
    glContext.enable(gl_BLEND);

    // Define vertex attributes layout
    let offset = 0;
    const vertexAttribute = (name, type, typeSize, size) => {
        const location = glContext.getAttribLocation(glShader, name);
        const normalize = typeSize === 1; // normalize bytes (e.g., color)
        glContext.enableVertexAttribArray(location);
        glContext.vertexAttribPointer(location, size, type, normalize, gl_VERTEX_BYTE_STRIDE, offset);
        offset += size * typeSize;
    };

    vertexAttribute('p', gl_FLOAT, 4, 4);         // position: 4 floats
    vertexAttribute('n', gl_FLOAT, 4, 4);         // normal: 4 floats
    vertexAttribute('u', gl_FLOAT, 4, 4);         // uv: 4 floats
    vertexAttribute('c', gl_UNSIGNED_BYTE, 1, 4); // color: 4 bytes (RGBA)
}

// Enable or disable polygon offset (useful for depth-fighting issues)
function glPolygonOffset(offset = 50, scale = 1) {
    if (offset) {
        glContext.enable(gl_POLYGON_OFFSET_FILL);
        glContext.polygonOffset(scale, -offset);
    } else {
        glContext.disable(gl_POLYGON_OFFSET_FILL);
    }
}

// Compile shader from source and check for errors
function glCompileShader(source, type) {
    const shader = glContext.createShader(type);
    glContext.shaderSource(shader, source);
    glContext.compileShader(shader);
    if (debug && !glContext.getShaderParameter(shader, gl_COMPILE_STATUS))
        throw glContext.getShaderInfoLog(shader);
    return shader;
}

// Create shader program from vertex and fragment shader sources
function glCreateProgram(vsSource, fsSource) {
    const program = glContext.createProgram();
    glContext.attachShader(program, glCompileShader(vsSource, gl_VERTEX_SHADER));
    glContext.attachShader(program, glCompileShader(fsSource, gl_FRAGMENT_SHADER));
    glContext.linkProgram(program);
    if (debug && !glContext.getProgramParameter(program, gl_LINK_STATUS))
        throw glContext.getProgramInfoLog(program);
    return program;
}

// Create a texture from an image and apply nearest filtering
function glCreateTexture(image) {
    const texture = glContext.createTexture();
    glContext.bindTexture(gl_TEXTURE_2D, texture);
    glContext.texImage2D(gl_TEXTURE_2D, 0, gl_RGBA, gl_RGBA, gl_UNSIGNED_BYTE, image);
    glContext.texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MIN_FILTER, gl_NEAREST);
    glContext.texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MAG_FILTER, gl_NEAREST);
    return texture;
}

// Prepare frame for rendering
function glPreRender() {
    // Update environment colors FIRST
    updateEnvironmentColors();
    
    // Resize WebGL canvas to match main canvas
    glContext.viewport(0, 0, glCanvas.width = mainCanvas.width, glCanvas.height = mainCanvas.height);

    // Use dynamic environment colors for background with enhanced contrast
    const env = glEnvironmentColors;
    
    // Apply more dramatic background color
    glContext.clearColor(
        Math.pow(env.skyColor.r, 0.8), // Gamma correction for more punch
        Math.pow(env.skyColor.g, 0.8), 
        Math.pow(env.skyColor.b, 0.8), 
        1
    );
    glContext.clear(gl_DEPTH_BUFFER_BIT | gl_COLOR_BUFFER_BIT);
    glDrawCalls = glDrawCount = 0;

    // Create view-projection matrix and upload to shader
    const viewMatrix = buildMatrix(cameraPos, cameraRot).invertSelf();
    const combinedMatrix = glCreateProjectionMatrix().multiplySelf(viewMatrix);
    glContext.uniformMatrix4fv(glUniform('m'), 0, combinedMatrix.toFloat32Array());

    // Upload light and fog uniforms with MUCH more dramatic changes
    const initUniform4f = (name, x, y, z, w = 0) => glContext.uniform4f(glUniform(name), x, y, z, w);
    initUniform4f('l', lightDirection.x, lightDirection.y, lightDirection.z);
    
    // Apply dramatic brightness changes to light color
    const brightnessFactor = Math.pow(env.brightness, 1.5); // More dramatic brightness curve
    const adjustedLightColor = {
        r: Math.min(lightColor.r * brightnessFactor, 2.0), // Allow over-bright
        g: Math.min(lightColor.g * brightnessFactor, 2.0),
        b: Math.min(lightColor.b * brightnessFactor, 2.0)
    };
    initUniform4f('g', adjustedLightColor.r, adjustedLightColor.g, adjustedLightColor.b);
    
    // Apply dramatic ambient lighting changes
    const ambientFactor = Math.max(0.05, env.brightness + (env.ambientBoost || 0));
    const adjustedAmbient = {
        r: ambientColor.r * ambientFactor,
        g: ambientColor.g * ambientFactor,
        b: ambientColor.b * ambientFactor
    };
    initUniform4f('a', adjustedAmbient.r, adjustedAmbient.g, adjustedAmbient.b);
    
    // Apply dramatic fog with enhanced density
    const fogDensityFactor = Math.pow(env.fogDensity, 1.2); // More dramatic fog curve
    initUniform4f('f', env.fogColor.r, env.fogColor.g, env.fogColor.b, fogDensityFactor);
}
// Create a perspective projection matrix
function glCreateProjectionMatrix() {
    const aspect = mainCanvas.width / mainCanvas.height;
    const fov = .5, f = 1 / Math.tan(fov);
    const near = 1, far = 20, range = far - near;
    return new DOMMatrix([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) / range, 2 * near * far / range,
        0, 0, -1, 0
    ]);
}

// Helper to get uniform location
function glUniform(name) {
    return glContext.getUniformLocation(glShader, name);
}

///////////////////////////////////////////////////////////////////////////////
// Drawing functions

// Render current draw buffer with a transform matrix
function glRender(transform = new DOMMatrix()) {
    ASSERT(glDrawCount < gl_MAX_BATCH, 'Too many points!');
    glContext.uniformMatrix4fv(glUniform('o'), 0, transform.toFloat32Array());
    const vertexData = glPositionData.subarray(0, glDrawCount * gl_INDICIES_PER_VERT);
    glContext.bufferSubData(gl_ARRAY_BUFFER, 0, vertexData);
    glContext.drawArrays(gl_TRIANGLE_STRIP, 0, glDrawCount);
    glDrawCount = 0;
    ++glDrawCalls;
}

// Enable/disable depth testing and depth writing
function glSetDepthTest(depthTest = true, depthWrite = true) {
    depthTest ? glContext.enable(gl_DEPTH_TEST) : glContext.disable(gl_DEPTH_TEST);
    glContext.depthMask(depthWrite);
}

// Add a single point to the draw buffer with all necessary attributes
function glDrawPoint(pos, normal, uv, rgba) {
    let offset = glDrawCount * gl_INDICIES_PER_VERT;
    glPositionData[offset++] = pos.x;
    glPositionData[offset++] = pos.y;
    glPositionData[offset++] = pos.z;
    glPositionData[offset++] = 1;
    glPositionData[offset++] = normal.x;
    glPositionData[offset++] = normal.y;
    glPositionData[offset++] = enableLighting ? normal.z : 9;
    glPositionData[offset++] = 0;
    glPositionData[offset++] = uv.x;
    glPositionData[offset++] = uv.y;
    glPositionData[offset++] = enableTexture ? uv.z : 9;
    glPositionData[offset++] = glEnableFog ? 0 : 9;
    glColorData[offset++] = rgba;
    ++glDrawCount;
}

// Push an array of points (optionally as polygon strip)
function glPushPoints(points, normals, color = WHITE, uvs, makePoly) {
    const totalPoints = makePoly ? points.length + 2 : points.length;
    ASSERT(totalPoints < gl_MAX_BATCH - glDrawCount, 'Too many points!');
    const rgba = color.rgbaInt();
    const na = vec3(9); // 'No lighting' or 'no texture' indicator
    for (let i = 0; i < totalPoints; i++) {
        const j = makePoly ? clamp(i - 1, 0, points.length - 1) : i;
        glDrawPoint(points[j], normals ? normals[j] : na, uvs ? uvs[j] : na, rgba);
    }
}

// Push an array of colored points (each point with individual color)
function glPushColoredPoints(points, colors) {
    const totalPoints = points.length;
    ASSERT(totalPoints < gl_MAX_BATCH - glDrawCount, 'Too many points!');
    const na = vec3(9); // 'No lighting' or 'no texture'
    for (let i = 0; i < totalPoints; i++) {
        glDrawPoint(points[i], na, na, colors[i].rgbaInt());
    }
}

// Push points that all share the same color
function glPushMonoColoredPoints(points, color) {
    const totalPoints = points.length;
    ASSERT(totalPoints < gl_MAX_BATCH - glDrawCount, 'Too many points!');
    const na = vec3(9); // z > 1 means no lighting/texture
    for(let i = 0; i < totalPoints; i++)
        glDrawPoint(points[i], na, na, color.rgbaInt());
}

///////////////////////////////////////////////////////////////////////////////
// store gl constants as integers so they can be minifed

const 
gl_TRIANGLE_STRIP = 5,
gl_DEPTH_BUFFER_BIT = 256,
gl_LEQUAL = 515,
gl_SRC_ALPHA = 770,
gl_ONE_MINUS_SRC_ALPHA = 771,
gl_CULL_FACE = 2884,
gl_DEPTH_TEST = 2929,
gl_BLEND = 3042,
gl_TEXTURE_2D = 3553,
gl_UNSIGNED_BYTE = 5121,
gl_FLOAT = 5126,
gl_RGBA = 6408,
gl_NEAREST = 9728,
gl_TEXTURE_MAG_FILTER = 10240,
gl_TEXTURE_MIN_FILTER = 10241,
gl_COLOR_BUFFER_BIT = 16384,
gl_POLYGON_OFFSET_FILL = 32823,
gl_TEXTURE0 = 33984,
gl_ARRAY_BUFFER = 34962,
gl_DYNAMIC_DRAW = 35048,
gl_FRAGMENT_SHADER = 35632, 
gl_VERTEX_SHADER = 35633,
gl_COMPILE_STATUS = 35713,
gl_LINK_STATUS = 35714,

// constants for batch rendering
gl_MAX_BATCH = 1e5,
gl_INDICIES_PER_VERT =  (1 * 4) * 3 + (1) * 1, // vec4 * 3 + color
gl_VERTEX_BYTE_STRIDE = (4 * 4) * 3 + (4) * 1, // vec4 * 3 + color
gl_VERTEX_BUFFER_SIZE = gl_MAX_BATCH * gl_INDICIES_PER_VERT * 4;