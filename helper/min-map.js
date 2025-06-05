// Draw circular mini-map
function drawMiniMap(ctx, playerCar, otherCars, track) {
    // Safety checks
    if (!ctx || !playerCar) {
        return;
    }

    // Get canvas for bottom positioning
    const canvas = ctx.canvas;
    const centerX = MINIMAP.x + MINIMAP.radius;
    const centerY = getMiniMapY(canvas) + MINIMAP.radius;
    const radius = MINIMAP.radius;

    const segmentsToShowBefore = 50; // Number of segments behind player to show
    const segmentsToShowAfter = 250; // Number of segments ahead of player to show

    // Calculate vertical scaling factor once
    const verticalScale = (2 * radius) / (segmentsToShowBefore + segmentsToShowAfter);

    // Draw circular background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw circular border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw the track line using projected coordinates
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 2; // Thicker line for visibility
    ctx.beginPath();

    if (track && track.length > 0) {
        const playerSegmentIndex = Math.floor(playerCar.pos.z / trackSegmentLength);

        const startSegmentIndex = Math.max(0, playerSegmentIndex - segmentsToShowBefore);
        const endSegmentIndex = Math.min(track.length, playerSegmentIndex + segmentsToShowAfter);

        let currentHorizontalOffset = 0;
        let firstPoint = true;

        // Use a more appropriate loop range for drawing the track line
        for (let i = startSegmentIndex; i < endSegmentIndex; i++) {
            const segment = track[i];
            // Accumulate horizontal offset
            currentHorizontalOffset += segment.offset.x;

            // Calculate vertical position based on distance from player (scaled to fit minimap)
            // Player is at the bottom (centerY + radius)
            // Points ahead of player move upwards towards (centerY - radius)
            const distanceInSegments = i - playerSegmentIndex;
            const projectedY = centerY + radius - (distanceInSegments + segmentsToShowBefore) * verticalScale;

            // Calculate horizontal position based on accumulated offset (scaled)
            // Need to determine a suitable scaling factor for horizontal offset
            const horizontalScale = MINIMAP.scale * 100; // Adjust this factor as needed
            const projectedX = centerX + currentHorizontalOffset * horizontalScale;

            // Check if point is within the circle (simple check, clipping handles exact boundary)
            const dx = projectedX - centerX;
            const dy = projectedY - centerY;
            if (dx * dx + dy * dy <= radius * radius) {
                if (firstPoint) {
                    ctx.moveTo(projectedX, projectedY);
                    firstPoint = false;
                } else {
                    ctx.lineTo(projectedX, projectedY);
                }
            } else if (!firstPoint) {
                 // If we went outside, stop drawing this line segment
                 // Consider drawing a line to the intersection point on the circle edge for a smoother track edge
                 // For simplicity now, just break.
                 break;
            }
        }
    }
    ctx.stroke();

    // Restore the clipping context
    ctx.restore();

    // Draw player car (red dot) - fixed at bottom center
    drawCarOnCircularMiniMap(ctx, centerX, centerY + radius, {
        x: 0, // Always at horizontal center relative to the player's projected position
        y: 0, // Always at the bottom relative to the player's projected position
        angle: playerCar.turn // Still use car's angle for direction indicator
    }, 'red', true);

    // Draw other cars (blue dots)
    if (otherCars) {
        const playerZ = playerCar.pos.z;
        otherCars.forEach(car => {
            if (!car.isPlayer) {
                // Calculate position relative to player (distance and horizontal offset)
                const distanceBehindPlayer = playerZ - car.pos.z;
                const horizontalOffset = car.pos.x - playerCar.pos.x; // Offset relative to player's lane

                // Map relative distance to vertical position on the minimap
                const segmentsAhead = -distanceBehindPlayer / trackSegmentLength; // Convert distance to segments

                // Use the pre-calculated verticalScale and the radius defined earlier
                const projectedCarY = centerY + radius - (segmentsAhead + segmentsToShowBefore) * verticalScale;


                // Map relative horizontal offset to horizontal position on the minimap
                const horizontalScale = MINIMAP.scale * 0.5; // Adjust this factor as needed for lane positioning
                const projectedCarX = centerX + horizontalOffset * horizontalScale;


                // Check if car position is within the circle before drawing
                const dx = projectedCarX - centerX;
                const dy = projectedCarY - centerY;
                if (dx * dx + dy * dy <= radius * radius) {
                    drawCarOnCircularMiniMap(ctx, projectedCarX, projectedCarY, {
                        x: 0, // The projectedCarX and projectedCarY are the target coordinates
                        y: 0,
                        angle: car.turn // Still use car's angle for direction indicator
                    }, 'blue', false);
                }
            }
        });
    }
}

// Draw car on circular mini-map
function drawCarOnCircularMiniMap(ctx, x, y, car, color, isPlayer) {
    // The input x and y are now the canvas coordinates to draw the car at
    // Convert world coordinates to mini-map coordinates
    let mapX = x;
    let mapY = y;

    // Keep within mini-map bounds - This logic might need refinement with the new projection
    // For now, let's disable this bounds check to see the full projected path if it goes outside
    // mapX = Math.max(MINIMAP.x, Math.min(mapX, MINIMAP.x + MINIMAP.width));
    // mapY = Math.max(MINIMAP.y, Math.min(mapY, MINIMAP.y + MINIMAP.height));

    // Draw car dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(mapX, mapY, isPlayer ? 5 : 3, 0, 2 * Math.PI);
    ctx.fill();

    // Add direction indicator for player
    if (isPlayer) {
        // The angle should rotate the direction vector relative to the projected track
        // This part might need more complex calculation based on the track's tangent at the player's position
        // For a simplified approach, we'll just use the car's heading to rotate a fixed-length line
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mapX, mapY);
        // Use Math.cos and Math.sin with the car's angle to draw the direction line
        // The length of the direction indicator line
        const indicatorLength = isPlayer ? 15 : 10;
        ctx.lineTo(
            mapX + Math.cos(car.angle - Math.PI/2) * indicatorLength, // Adjust angle for canvas coordinates
            mapY + Math.sin(car.angle - Math.PI/2) * indicatorLength  // Adjust angle for canvas coordinates
        );
        ctx.stroke();
    }
}