/**
 * Handles all rendering related to debugging (HUD, Map, Meshes, etc.).
 * Renders all debug visualizations to the main canvas.
 */

let showMiniMap = true;
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

    if (showMiniMap) {
        drawMiniMap(context, playerVehicle, vehicles, track);
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
