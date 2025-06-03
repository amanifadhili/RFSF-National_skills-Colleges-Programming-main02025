// Enable strict mode for better error detection and performance optimization
'use strict';

// ====================================================================
// GLOBAL LIGHTING AND RENDERING VARIABLES
// ====================================================================

// Lighting system variables - these control the overall scene illumination
let lightDirection;  // Direction vector for the main directional light (like sunlight)
let lightColor;      // Color/intensity of the main directional light
let ambientColor;    // Color/intensity of ambient light (fills shadows)
let fogColor;        // Color used for distance fog effects

// Pre-built 3D mesh objects for common shapes - created once, reused many times
let cubeMesh;        // Basic cube/box geometry
let quadMesh;        // Flat rectangular quad for sprites and UI elements
let shadowMesh;      // Ground shadow projection mesh
let cylinderMesh;    // Circular cylinder geometry
let carMesh;         // Custom car body geometry
let carWheel;        // Wheel geometry for vehicles
let playerCarMesh;
let aiCarMeshes = [];

// ====================================================================
// COLOR CONSTANTS - RGB COLOR DEFINITIONS
// ====================================================================
// These provide easy-to-use color constants throughout the game

const WHITE   = rgb(1, 1, 1);     // Pure white color
const BLACK   = rgb(0, 0, 0);     // Pure black color
const RED     = rgb(1, 0, 0);     // Pure red color
const YELLOW  = rgb(1, 1, 0);     // Pure yellow color (red + green)
const GREEN   = rgb(0, 1, 0);     // Pure green color
const CYAN    = rgb(115, 115, 8); // Custom cyan/yellow-green color (note: unusual RGB values)
const BLUE    = rgb(0, 0, 1);     // Pure blue color
const MAGENTA = rgb(1, 0, 1);     // Pure magenta color (red + blue)
const GRAY    = rgb(.5, .5, .5);  // 50% gray color

const PLAYER_CAR_COLOR = hsl(.6, .8, .4);     // Distinctive blue-green for player
const AI_CAR_COLORS = [
    hsl(.0, .7, .5),   // Red
    hsl(.15, .8, .6),  // Orange  
    hsl(.25, .6, .5),  // Yellow-green
    hsl(.8, .6, .4),   // Purple
    hsl(.45, .5, .3)   // Brown
];

function drawInit() {
   
    
    // CREATE CUBE MESH
    {
        // Define 2D points for the cube's base shape (square)
        // These points will be extruded into 3D to create a cube
        const points = [
            vec3(-1, 1),   // Top-left corner
            vec3(1, 1),    // Top-right corner  
            vec3(1, -1),   // Bottom-right corner
            vec3(-1, -1)   // Bottom-left corner
        ];
        // Build the cube by extruding the 2D square into 3D space
        cubeMesh = new Mesh().buildExtrude(points);
    }
    
    // CREATE QUAD MESH (FLAT RECTANGLE)
    {
        // Define vertices for a flat rectangular quad
        // This is used for sprites, UI elements, and flat surfaces
        const points = [
            vec3(-1, 1),   // Top-left vertex
            vec3(-1, 1),   // Top-left vertex (duplicate for triangle strip)
            vec3(1, 1),    // Top-right vertex
            vec3(-1, -1),  // Bottom-left vertex
            vec3(1, -1),   // Bottom-right vertex
            vec3(1, -1)    // Bottom-right vertex (duplicate for triangle strip)
        ];
        
        // Create normal vectors pointing outward (positive Z direction)
        // Normals are used for lighting calculations
        const normals = points.map(p => vec3(0, 0, 9));
        
        // Create UV texture coordinates for mapping textures onto the quad
        // Transform from [-1,1] range to [0,1] UV range
        const uvs = points.map(p => p.multiply(vec3(.5, -.5, .5)).add(vec3(.5)));
        
        // Create the quad mesh with vertices, normals, and UV coordinates
        quadMesh = new Mesh(points, normals, uvs);
        
        // Create shadow mesh by rotating the quad 90 degrees around X-axis
        // This creates a horizontal surface for projecting shadows onto the ground
        shadowMesh = quadMesh.copy().transform(0, vec3(PI/2, 0, 0));
    }
    
    // CREATE CYLINDER MESH
    {
        const points = [];
        const sides = 12;  // Number of sides for the cylinder (12-sided = smooth appearance)
        
        // Generate points around a circle to form the cylinder's cross-section
        for (let i = sides; i--;) {
            const a = i / sides * PI * 2;  // Calculate angle for each point
            // Create point on unit circle and rotate it to the correct position
            points.push(vec3(1, 0, 0).rotateZ(a));
        }
        
        // Build the cylinder by extruding the circular cross-section
        cylinderMesh = new Mesh().buildExtrude(points);
    }
    
    // CREATE CAR MESHES WITH VARIATIONS
    {
        // Keep original car mesh for compatibility
        const points = [
    vec3(-1, .7), vec3(-.3, .7), vec3(-.1, .4), vec3(.2, .4),
    vec3(1, .3), vec3(1, .3), vec3(1, 0), vec3(-1, 0),
];
        
        carMesh = new Mesh().buildExtrude(points, .5);
        carMesh.transform(0, vec3(0, -PI/2));
        
        carWheel = cylinderMesh.copy();
        carWheel.transform(0, vec3(0, -PI/2));
        
        // Create visual variations
        createCarVariations();
    }
}

function createCarVariations() {
    const playerPoints = [
        vec3(-1, .6), vec3(-.6, .55), vec3(-.1, .6), vec3(.2, .55),
        vec3(.9, .3), vec3(1, .25), vec3(1, 0), vec3(-1, 0)
    ];
    
    playerCarMesh = new Mesh().buildExtrude(playerPoints, .6);
    playerCarMesh.transform(0, vec3(0, -PI/2));
    
    const aiProfiles = [
    // Tall SUV
    [vec3(-1, .7), vec3(-.6, .75), vec3(.1, .75), vec3(.7, .4), vec3(1, .3), vec3(1, 0), vec3(-1, 0)],
    // Sports Car
    [vec3(-1, .3), vec3(-.8, .45), vec3(.2, .5), vec3(.8, .2), vec3(1, .15), vec3(1, 0), vec3(-1, 0)],
    // Pickup Truck
    [vec3(-1, .6), vec3(-.4, .6), vec3(-.2, .3), vec3(.3, .3), vec3(1, .25), vec3(1, 0), vec3(-1, 0)],
    // Bubble Car
    [vec3(-1, .4), vec3(-.5, .8), vec3(.2, .8), vec3(.6, .5), vec3(1, .2), vec3(1, 0), vec3(-1, 0)],
    // Racing Car
    [vec3(-1, .2), vec3(-.3, .2), vec3(-.1, .6), vec3(.4, .6), vec3(1, .1), vec3(1, 0), vec3(-1, 0)],
     // Add these new unique shapes
    [vec3(-1, .6), vec3(-.4, .6), vec3(-.2, .3), vec3(.3, .3), vec3(1, .25), vec3(1, 0), vec3(-1, 0)], // Pickup truck
    [vec3(-1, .2), vec3(-.3, .2), vec3(-.1, .6), vec3(.4, .6), vec3(1, .1), vec3(1, 0), vec3(-1, 0)],   // Formula car
    [vec3(-1, .5), vec3(-.6, .8), vec3(.1, .8), vec3(.6, .5), vec3(1, .2), vec3(1, 0), vec3(-1, 0)] 
];
    
    aiCarMeshes = aiProfiles.map(profile => {
        const mesh = new Mesh().buildExtrude(profile, .5);
        mesh.transform(0, vec3(0, -PI/2));
        return mesh;
    });
}


class Tile {
    constructor(pos, size) {
        // Bleed pixels prevent texture sampling artifacts at tile edges
        const bleedPixels = 2;
        const textureSize = generativeCanvasSize;  // Size of the master texture atlas
        
        // Calculate normalized texture coordinates (0.0 to 1.0 range)
        // Add bleed offset and normalize to texture atlas size
        this.pos = pos.add(vec3(bleedPixels)).divide(textureSize);
        
        // Calculate tile size minus bleed pixels on both sides, then normalize
        this.size = size.add(vec3(-2 * bleedPixels)).divide(textureSize);
    }
}

// ====================================================================
// MESH CLASS - 3D GEOMETRY CONTAINER AND OPERATIONS
// ====================================================================

class Mesh {
    /**
     * Constructor for creating a 3D mesh
     * @param {Array} points - Array of 3D vertex positions
     * @param {Array} normals - Array of 3D normal vectors for lighting
     * @param {Array} uvs - Array of 2D texture coordinates
     */
    constructor(points, normals, uvs) {
        this.points = points;   // 3D coordinates of vertices
        this.normals = normals; // 3D vectors for lighting calculations  
        this.uvs = uvs;         // 2D texture mapping coordinates
    }
    
    /**
     * Create a deep copy of this mesh
     * @returns {Mesh} New mesh instance with copied data
     */
    copy() {
        return new Mesh(this.points, this.normals, this.uvs);
    }

    /**
     * Build a 3D shape by extruding a 2D profile along the Z-axis
     * @param {Array} facePoints - 2D points defining the shape's profile
     * @param {number} size - Half-height of the extrusion (default: 1)
     * @param {number} topScale - Scale factor for the top face (default: 1)
     * @returns {Mesh} This mesh instance for method chaining
     */
    buildExtrude(facePoints, size = 1, topScale = 1) {
        const points = [];   // Array to store all 3D vertices
        const normals = [];  // Array to store all normal vectors
        const vertCount = facePoints.length + 2;  // Total vertices per face
        
        // BUILD TOP AND BOTTOM FACES
        for (let k = 2; k--;) {  // k=1 for top face, k=0 for bottom face
            for (let i = vertCount; i--;) {
                // Calculate vertex index with degenerate triangles at ends
                const j = clamp(i - 1, 0, vertCount - 3);
                const h = j >> 1;  // Half index for point selection
                
                // Select point from facePoints array with proper winding order
                const point = facePoints[j % 2 == (vertCount % 2 ? 0 : k) ? vertCount - 3 - h : h]
                    .scale(k ? topScale : 1);  // Apply top scaling if building top face
                
                // Set Z coordinate: positive for top, negative for bottom
                point.z = k ? size : -size;
                points.push(point);
                
                // Normal points up for top face, down for bottom face
                normals.push(vec3(0, 0, point.z));
            }
        }
        
        // BUILD SIDE FACES
        for (let i = facePoints.length; i--;) {
            // Get current point and next point (with wraparound)
            const point1 = facePoints[i];
            const point2 = facePoints[(i + 1) % facePoints.length];
            const s = vec3(0, 0, size);  // Z-offset vector
            
            // Create four corners of the side face quad
            const pointA = point1.scale(topScale).add(s);     // Top-left
            const pointB = point2.scale(topScale).add(s);     // Top-right  
            const pointC = point1.subtract(s);                // Bottom-left
            const pointD = point2.subtract(s);                // Bottom-right
            
            // Arrange points as two triangles (triangle strip format)
            const sidePoints = [pointA, pointA, pointB, pointC, pointD, pointD];
            
            // Calculate face normal using cross product
            const normal = pointA.subtract(pointB).cross(pointA.subtract(pointC)).normalize();
            
            // Add vertices and normals for this side face
            points.push(...sidePoints);
            for (const p of sidePoints) {
                normals.push(normal);
            }
        }
        
        // Store the generated geometry in this mesh
        this.points = points;
        this.normals = normals;
        return this;  // Return this for method chaining
    }

    /**
     * Build a 3D shape by rotating a 2D profile around the Y-axis (lathe operation)
     * @param {Array} facePoints - 2D points defining the shape's profile
     * @param {number} segments - Number of rotational segments (default: 16)
     * @returns {Mesh} This mesh instance for method chaining
     */
    buildLathe(facePoints, segments = 16) {
        const points = [];   // Array to store all 3D vertices
        const normals = [];  // Array to store all normal vectors
        const angleStep = PI * 2 / segments;  // Angle between each segment
        
        // Generate geometry by rotating profile points around Y-axis
        for (let i = segments; i--;) {
            const angle2 = (i + .5) * angleStep;  // Angle for normal calculation
            
            // Calculate normal vector (TODO: fix - normals are not tilted correctly)
            const normal = vec3(1, 0).rotateY(angle2);
            
            // Process each point in the profile
            for (let j = facePoints.length; j--;) {
                // Rotate profile point to current and next positions
                const point1 = facePoints[j].rotateY(i * angleStep);
                const point2 = facePoints[j].rotateY((i + 1) * angleStep);
                
                // Add vertices for this segment (two triangles)
                points.push(point2, point1);
                normals.push(normal, normal);
                
                // Add degenerate triangles at the end of each profile section
                if (!j) {
                    points.push(point1, point1);
                    normals.push(normal, normal);
                }
            }
        }
        
        // Store the generated geometry in this mesh
        this.points = points;
        this.normals = normals;
        return this;  // Return this for method chaining
    }

    /**
     * Combine another mesh into this mesh with optional transformation
     * @param {Mesh} mesh - The mesh to combine with this one
     * @param {vec3} pos - Position offset for the combined mesh
     * @param {vec3} rot - Rotation for the combined mesh
     * @param {vec3} scale - Scale factor for the combined mesh
     * @returns {Mesh} This mesh instance for method chaining
     */
    combine(mesh, pos, rot, scale) {
        // Build transformation matrices
        const m = buildMatrix(pos, rot, scale);      // Full transformation matrix
        const m2 = buildMatrix(0, rot);              // Rotation-only matrix for normals
        
        // Transform and append the other mesh's vertices
        this.points.push(...mesh.points.map(p => p.transform(m)));
        
        // Transform and append normals (if they exist)
        this.normals && this.normals.push(...mesh.normals.map(p => p.transform(m2)));
        
        // Append UV coordinates unchanged
        this.uvs && this.uvs.push(...mesh.uvs);
        
        return this;  // Return this for method chaining
    }

    /**
     * Apply transformation to all vertices and normals in this mesh
     * @param {vec3} pos - Position offset
     * @param {vec3} rot - Rotation angles
     * @param {vec3} scale - Scale factors
     * @returns {Mesh} This mesh instance for method chaining
     */
    transform(pos, rot, scale) {
        // Build transformation matrices
        const m = buildMatrix(pos, rot, scale);      // Full transformation matrix
        const m2 = buildMatrix(0, rot);              // Rotation-only matrix for normals
        
        // Apply transformation to all points and normals
        this.points = this.points.map(p => p.transform(m));
        this.normals = this.normals.map(p => p.transform(m2));
        
        return this;  // Return this for method chaining
    }

    /**
     * Render this mesh with standard lighting
     * @param {Matrix} transform - World transformation matrix
     * @param {Color} color - Base color for the mesh
     */
    render(transform, color) {
        // Push vertex data to the graphics pipeline with lighting
        glPushPoints(this.points, this.normals, color);
        glRender(transform);  // Execute the render with given transformation
    }

    /**
     * Render this mesh without lighting (flat shaded)
     * @param {Matrix} transform - World transformation matrix  
     * @param {Color} color - Flat color for the mesh
     * @param {boolean} unlit - Whether to disable lighting (default: true)
     */
    renderUnlit(transform, color, unlit = true) {
        if (unlit) {
            // Render with flat color (no lighting calculations)
            glPushMonoColoredPoints(this.points, color);
        } else {
            // Render with standard lighting
            glPushPoints(this.points, this.normals, color);
        }
        glRender(transform);  // Execute the render
    }

    /**
     * Render this mesh with a texture tile from the texture atlas
     * @param {Matrix} transform - World transformation matrix
     * @param {Color} color - Tint color for the textured mesh
     * @param {Tile} tile - Texture tile defining UV coordinates
     */
    renderTile(transform, color, tile) {
        // Ensure tile parameter is valid
        ASSERT(tile instanceof Tile);
        
        // Map mesh UV coordinates to the specific tile's UV space
        const uvs = this.uvs.map(uv => vec3(
            uv.x * tile.size.x + tile.pos.x,  // Scale and offset X coordinate
            uv.y * tile.size.y + tile.pos.y   // Scale and offset Y coordinate
        ));
        
        // Push vertex data with custom UV coordinates
        glPushPoints(this.points, this.normals, color, uvs);
        glRender(transform);  // Execute the render
    }
}

// ====================================================================
// SPECIALIZED RENDERING FUNCTIONS
// ====================================================================

/**
 * Render a gradient-colored quad
 * @param {vec3} pos - Position of the quad center
 * @param {vec3} size - Size of the quad (width, height, depth)
 * @param {Color} color - Color for top vertices
 * @param {Color} color2 - Color for bottom vertices
 */
function pushGradient(pos, size, color, color2) {
    const flip = size.x < 0;  // Check if horizontally flipped
    size = size.abs();        // Work with absolute size values
    const mesh = quadMesh;    // Use the standard quad mesh
    
    // Transform quad vertices to world position and scale
    const points = mesh.points.map(p => vec3(
        p.x * size.x + pos.x,
        p.y * size.y + pos.y,
        p.z * size.z + pos.z
    ));

    // Assign colors to create vertical gradient effect
    let colors = [];
    for (let i = 0; i < points.length; i++) {
        colors[i] = i > 2 ? color2 : color;  // Bottom vertices get color2, top get color
    }
    
    // Push colored vertices to graphics pipeline
    glPushColoredPoints(points, colors);
}

/**
 * Render a textured sprite (billboard quad)
 * @param {vec3} pos - Position of the sprite center
 * @param {vec3} size - Size of the sprite (negative X flips horizontally)
 * @param {Color} color - Tint color for the sprite
 * @param {Tile} tile - Optional texture tile for the sprite
 */
function pushSprite(pos, size, color, tile) {
    const flip = size.x < 0;  // Check if sprite should be horizontally flipped
    size = size.abs();        // Work with absolute size values
    const mesh = quadMesh;    // Use the standard quad mesh
    
    // Transform quad vertices to world position and scale
    const points = mesh.points.map(p => vec3(
        p.x * size.x + pos.x,
        p.y * size.y + pos.y,
        p.z * size.z + pos.z
    ));
    
    if (tile) {
        // Render with texture
        ASSERT(tile instanceof Tile);  // Validate tile parameter
        
        if (flip) {
            // Flip texture coordinates horizontally
            tile.pos.x += tile.size.x;
            tile.size.x *= -1;
        }

        // Map mesh UV coordinates to tile's UV space
        const uvs = mesh.uvs.map(uv => vec3(
            uv.x * tile.size.x + tile.pos.x,
            uv.y * tile.size.y + tile.pos.y
        ));
        
        // Push textured vertices (no lighting for sprites)
        glPushPoints(points, 0, color, uvs);
    } else {
        // Render without texture (solid color)
        glPushPoints(points, 0, color);
    }
}

/**
 * Render a ground shadow projection
 * @param {vec3} pos - Position of the shadow center
 * @param {number} xSize - Width of the shadow
 * @param {number} zSize - Length of the shadow  
 * @param {vec3} rotation - Rotation angles for the shadow
 * @param {number} shape - Shape index for texture tile selection (default: 1)
 */
function pushShadow(pos, xSize, zSize, rotation, shape = 1) {
    const color = hsl(0, 0, 0, .5);  // Semi-transparent black shadow color
    const size = vec3(xSize, 0, zSize);  // Shadow dimensions (Y=0 for ground projection)
    const tile = getGenerativeTile(vec3(shape, 0));  // Get texture tile for shadow pattern
    const mesh = shadowMesh;  // Use the ground-oriented shadow mesh
    
    let points = mesh.points;  // Start with base mesh points
    
    if (rotation) {
        // Apply complex rotation transformation
        const m2 = buildMatrix(pos, vec3(rotation.x, 0, rotation.z), size);  // Position and XZ rotation
        const m3 = buildMatrix(0, vec3(0, rotation.y, 0), 0);                // Y rotation only
        const m1 = m2.multiply(m3);  // Combine transformations
        
        // Note: There's an unused variable 'marix' - likely a typo for 'matrix'
        // const matrix = buildMatrix(pos, rotation, size);  // Full transformation
        
        // Apply transformation to all points
        points = points.map(p => p.transform(m1));
    } else {
        // Simple scaling and positioning without rotation
        points = points.map(p => vec3(
            p.x * size.x + pos.x,
            pos.y,                    // Keep Y at ground level
            p.z * size.z + pos.z
        ));
    }

    // Map mesh UV coordinates to shadow texture tile
    const uvs = mesh.uvs.map(uv => vec3(
        uv.x * tile.size.x + tile.pos.x,
        uv.y * tile.size.y + tile.pos.y
    ));
    
    // Push shadow vertices with texture (no lighting for shadows)
    glPushPoints(points, 0, color, uvs);
}

/**
 * Get a texture tile from the generative texture atlas
 * @param {vec3} pos - Grid position of the desired tile
 * @returns {Tile} Tile object with UV coordinates for the requested tile
 */
function getGenerativeTile(pos) {
    const w = generativeTileSize;  // Size of individual tiles in the atlas
    // Create tile at grid position, scaled by tile size
    return new Tile(pos.scale(w), generativeTileSizeVec3);
}