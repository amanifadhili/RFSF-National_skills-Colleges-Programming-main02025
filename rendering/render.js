/**
 * Handles all rendering related to debugging (HUD, Map, Meshes, etc.).
 * Renders all debug visualizations to the main canvas.
 */
function drawDebug() {
    const canvas = mainCanvas;
    const context = mainContext;

    // Display FPS and draw calls on-screen
    if (debugInfo) {
        drawHUDText(`fps: ${averageFPS | 0} draws: ${glDrawCalls}`, vec3(.8, .05), .04);
    }

    // Show 2D minimap of the track
    if (showMap) {
        renderDebugTrackMap(context, canvas);
    }

    // Show generative canvas for texture or tile inspection
    if (debugGenerativeCanvas) {
        const s = 512;
        context.imageSmoothingEnabled = true;
        context.drawImage(generativeCanvas, 0, 0, s, s);
    }

    // Capture a screenshot of the WebGL output
    if (debugTakeScreenshot) {
        debugTakeScreenshot = 0;
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(glCanvas, 0, 0);
        debugSaveCanvas(canvas);
    }

    // Optional: render a debug 3D mesh
    if (debugMesh) {
        const transform = buildMatrix(cameraPos.add(vec3(0, 400, 1000)), vec3(0, time, 0), vec3(200));
        debugMesh.render(transform, WHITE);
    }

    // Optional: render a specific generative tile
    if (debugTile) {
        const s = 256;
        const tileSize = generativeTileSize;
        const tilePos = debugTile.scale(tileSize);
        const x = canvas.width / 2 - s / 2;

        context.fillStyle = '#555';
        context.fillRect(x, 0, s, s);
        context.drawImage(generativeCanvas, tilePos.x, tilePos.y, tileSize, tileSize, x, 0, s, s);
        context.strokeRect(x, 0, s, s);
    }

    // Final render call for WebGL scene
    glRender();
}

/**
 * Renders a simplified top-down track map on the canvas.
 */
function renderDebugTrackMap(context, canvas) {
    context.save();
    context.beginPath();

    for (let layer = 2; layer--;) {
        let p = vec3();
        let direction = vec3(0, -0.5);
        let velocity = 0;

        for (let i = 0; i < 500; i++) {
            let index = (playerVehicle.pos.z / trackSegmentLength + i - 100) | 0;
            if (!track[index]) break;

            const segment = track[index];
            velocity += segment.offset.x;
            p = p.add(direction.rotateZ(velocity * 0.005));

            if (index % 5 === 0) {
                const offsetY = segment.offset.y;
                const color = hsl(offsetY * 0.0001, 1, layer ? 0 : 0.5, layer ? 0.5 : 1);
                const size = segment.width / 199;

                context.fillStyle = color;
                context.fillRect(canvas.width - 200 + p.x, canvas.height - 100 + p.y + (layer ? 5 : -offsetY * 0.01), size, size);
            }
        }
    }

    context.restore();
}

// Add this enhanced environment rendering function:
function renderEnvironment() {
    // Update environment colors
    updateEnvironmentColors();
    



    const env = environmentManager.currentEnvData;
    





    // Apply dramatic screen effects based on environment
    applyEnvironmentScreenEffects(env);
    
    // Render rain if needed


    if (env.hasRain) {
        renderDramaticRain();
    }
    
    // Add environment-specific particle effects
    renderEnvironmentParticles(env);
}



// Add dramatic screen effects
function applyEnvironmentScreenEffects(env) {
    const canvas = mainCanvas;
    const context = mainContext;
    
    // Create overlay effects based on environment
    switch(env.name) {
        case "night":
            // Add dark vignette effect for night
            const gradient = context.createRadialGradient(
                canvas.width/2, canvas.height/2, 0,
                canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)/2
            );
            gradient.addColorStop(0, 'rgba(0,0,20,0)');
            gradient.addColorStop(0.7, 'rgba(0,0,20,0.3)');
            gradient.addColorStop(1, 'rgba(0,0,20,0.8)');
            
            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);
            break;
            
        case "desert":
            // Add heat shimmer effect
            const heatGradient = context.createLinearGradient(0, 0, 0, canvas.height);
            heatGradient.addColorStop(0, 'rgba(255,200,100,0)');
            heatGradient.addColorStop(0.8, 'rgba(255,200,100,0.1)');
            heatGradient.addColorStop(1, 'rgba(255,150,50,0.2)');
            
            context.fillStyle = heatGradient;
            context.fillRect(0, 0, canvas.width, canvas.height);
            break;
            
        case "forest":
            // Add green tint overlay
            context.fillStyle = 'rgba(0,50,0,0.15)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            break;
            
        case "sunny_day":
            // Add bright, warm overlay
            context.fillStyle = 'rgba(255,255,200,0.1)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            break;
    }
}

// Enhanced rain rendering
function renderDramaticRain() {
    const particles = environmentManager.rainParticles;
    
    // Draw rain with more dramatic effect
    for (const particle of particles) {








        // Create rain streaks instead of simple lines
        const startPos = vec3(particle.x, particle.y, particle.z);
        const endPos = vec3(particle.x, particle.y - 40, particle.z);
        
        // Draw multiple rain lines for heavier effect
        for (let i = 0; i < 3; i++) {
            const offset = (Math.random() - 0.5) * 10;
            drawLine(
                vec3(startPos.x + offset, startPos.y, startPos.z),
                vec3(endPos.x + offset, endPos.y, endPos.z),
                rgb(0.6, 0.7, 1.0, 0.7), // Semi-transparent blue
                1
            );
        }
    }
}

// Add environment-specific particles
function renderEnvironmentParticles(env) {
    // This is where you could add dust for desert, leaves for forest, etc.
    // For now, we'll keep it simple but you can expand this later
}

// Simple line drawing function (add this if you don't have one)
function drawLine(start, end, color, width = 1) {
    // This is a simplified version - you might need to adapt it to your rendering system
    // Use your existing mesh/sprite system to draw a thin rectangle between start and end points
}