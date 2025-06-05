'use strict';

/**
 * Updates camera position and calculates track projections before rendering
 * This function runs every frame to prepare the scene for drawing
 */
function trackPreRender()
{
    // Calculate camera's position along the track based on player vehicle position
    cameraOffset = playerVehicle.pos.z - cameraPlayerOffset.z;
    
    // Get track segment information at camera position for terrain following
     cameraTrackInfo = new TrackSegmentInfo(cameraOffset);
    
     // Enhanced world heading for curves - smoother rotation
    const curveStrength = cameraTrackInfo.offset.x / 1000; // Normalize curve intensity
    worldHeading += 0.0001 * curveStrength * playerVehicle.velocity.z; // Smoother curve rotation

    // Gradually rotate world heading based on track curves and player speed
    // Creates subtle banking effect when going around turns
    // worldHeading += .00005 * cameraTrackInfo.offset.x * playerVehicle.velocity.z;
    

    // Set camera height - much higher in attract mode for overview effect
   if (attractMode)
        cameraPos.y = cameraTrackInfo.offset.y + 1e3; // 1000 units high for attract mode
    else {
        // Smoother hill following with look-ahead
        const lookAheadInfo = new TrackSegmentInfo(cameraOffset + trackSegmentLength * 5);
        const avgHeight = (cameraTrackInfo.offset.y + lookAheadInfo.offset.y) / 2;
        cameraPos.y = avgHeight + cameraPlayerOffset.y; // Follow average height
    }

    // Tilt camera based on track pitch (up/down slopes) for immersion
   cameraRot.x = cameraTrackInfo.pitch / 1.5;
   cameraRot.z = curveStrength * 0.1; // Add banking/roll effect for curves
    
   // Enhanced camera lateral movement - follows curves better
    const lookAheadDistance = playerVehicle.velocity.z * 2;
    const lookAheadInfo = new TrackSegmentInfo(cameraOffset + lookAheadDistance);
    const avgCurve = (cameraTrackInfo.offset.x + lookAheadInfo.offset.x) / 2;
    cameraPos.x = playerVehicle.pos.x * 0.7 + avgCurve * 0.3;

    // Smooth camera horizontal movement - follows 70% of player's lateral position
    // cameraPos.x = playerVehicle.pos.x * .7;

    // === LIGHTING AND ATMOSPHERE SETUP ===
    // Dynamic lighting that rotates with world heading for consistent shadows
    lightDirection = vec3(0, 4, -1).rotateY(worldHeading).normalize()
    
    // Set lighting colors for the scene
    lightColor = hsl(0, 1, 1);        // Pure white light
    ambientColor = hsl(.7, .1, .2);   // Dim bluish ambient light
    fogColor = hsl(.6, 1, .7);        // Cyan fog color

    // === TRACK GEOMETRY PROJECTION ===
    // Calculate world positions for track segments (iterate in reverse for proper Z-order)
    const cameraTrackSegment = cameraTrackInfo.segment;           
    const cameraTrackSegmentPercent = cameraTrackInfo.percent;   
    const turnScale = 3; // Increased from 2 for more dramatic curves
    
    let x = 0;  // Accumulated horizontal offset
    let v = 0;  // Velocity/rate of horizontal change
    let i = 0;  // Loop counter
    
    // Process each track segment from camera position forward
    for(x = v = i = 0; i < drawDistance + 1; ++i)
    {
        const j = cameraTrackSegment + i;  // Actual track segment index
        
        // Stop if we've reached the end of the track
        if (!track[j])
            break;

        // Calculate interpolation factor for smooth segment transitions
        // First segment uses remaining percent, others use full segment
        const s = i < 1 ? 1 - cameraTrackSegmentPercent : 1;
        
        // Create world position for this track segment
         track[j].pos = track[j].offset.copy();    // Start with track's base offset
        
        // Apply accumulated horizontal curvature
        // This creates the "projection" effect where turns appear curved
         track[j].pos.x = x += v += turnScale * s * track[j].offset.x;
        
        track[j].pos.z -= cameraOffset;
    }
}

/**
 * Renders the road surface with multiple passes for ground, road, and lane markings
 * @param {number} zwrite - Whether to write to depth buffer (1) or not (0)
 */
function drawRoad(zwrite = 0)
{
    glSetDepthTest(zwrite, zwrite);
    
    const cameraTrackSegment = cameraTrackInfo.segment;
    let segment2;
    
    for(let i = drawDistance; i--; )
    {
        const segmentIndex = cameraTrackSegment + i;
        const segment1 = track[segmentIndex];
        
        if (!segment1 || !segment2)
        {
            segment2 = segment1;
            continue;
        }
<<<<<<< HEAD:track.js
        

        const p1 = segment1.pos;
        const p2 = segment2.pos;
        
=======

        const p1 = segment1.pos;
        const p2 = segment2.pos;
        
>>>>>>> 2536a8a29d5b8bc8f4afbf7f22300ff8e8530a3f:objects/object-logics.js
        if (i % (lerp(i / drawDistance, 1, 6) | 0) == 0)
        {
            const normals = [segment1.normal, segment1.normal, segment2.normal, segment2.normal];
            
            // Enhanced: 6 passes (ground, road, 2 lane dividers, 2 curbs)
            for(let pass = 0; pass < (zwrite ? 1 : 6); ++pass) // Changed from 4 to 6
            {
                let color, offset, laneOffset = 0;
                
                if (pass == 0)
                {
                    // PASS 1: Ground/grass
                    color = hsl(0.25, 0.5, 0.3);
                    offset = p1.z * 20;
                }
                else if (pass == 1)
                {
                    // PASS 2: Road surface
                    color = segment1.colorRoad;
                    offset = segment1.width;
                }
                else if (pass == 2)
                {
                    // PASS 3: Left lane divider
                    color = segment1.colorLine;
                    offset = 15;
                    laneOffset = -segment1.width / 3;
                }
                else if (pass == 3)
                {
                    // PASS 4: Right lane divider
                    color = segment1.colorLine;
                    offset = 15;
                    laneOffset = segment1.width / 3;
                }
                else if (pass == 4)
                {
                    // PASS 5: Left road curb (black and white stripes)
                    const curbPattern = (segmentIndex % 6 < 3) ? WHITE : BLACK;
                    color = curbPattern;
                    offset = 25; // Curb width
                    laneOffset = -segment1.width - 30; // Outside left edge
                }
                else if (pass == 5)
                {
                    // PASS 6: Right road curb (black and white stripes)
                    const curbPattern = (segmentIndex % 6 < 3) ? WHITE : BLACK;
                    color = curbPattern;
                    offset = 25; // Curb width
                    laneOffset = segment1.width + 30; // Outside right edge
                }

                // Create quad vertices
                let point1a, point1b, point2a, point2b;
                
                if (pass <= 1) {
                    // Ground and road surface - full width
                    point1a = vec3(p1.x + offset, p1.y, p1.z);
                    point1b = vec3(p1.x - offset, p1.y, p1.z);
                    point2a = vec3(p2.x + offset, p2.y, p2.z);
                    point2b = vec3(p2.x - offset, p2.y, p2.z);
                } else {
                    // Lane dividers and curbs - positioned correctly
                    point1a = vec3(p1.x + laneOffset + offset, p1.y, p1.z);
                    point1b = vec3(p1.x + laneOffset - offset, p1.y, p1.z);
                    point2a = vec3(p2.x + laneOffset + offset, p2.y, p2.z);
                    point2b = vec3(p2.x + laneOffset - offset, p2.y, p2.z);
                }
                
                const poly = [point1a, point1b, point2a, point2b];
                color.a && glPushPoints(poly, normals, color, 0, 1);
            }
            segment2 = segment1;
        }
    }

    glRender();
    glSetDepthTest();
}



/**
 * Renders trackside scenery including trees, billboards, and decorative elements
 */
function drawScenery()
{
    // Enable depth testing for proper z-ordering, but don't write depth
    glSetDepthTest(1, 0);
    
    // Use polygon offset to prevent z-fighting with road surface
    glPolygonOffset(100);
    
    const cameraTrackSegment = cameraTrackInfo.segment;
    
    // Draw scenery for visible track segments
    for(let i = sceneryDrawDistance; i--; )
    {
        const segmentIndex = cameraTrackSegment + i;
        const trackSegment = track[segmentIndex];
        
        if (!trackSegment)
            continue;

        // === PROCEDURAL BACKGROUND SCENERY ===
        // Use deterministic random based on segment index for consistent placement
        // random.setSeed(segmentIndex);
        // const w = trackSegment.width;
        
        // // Generate 5 random background objects per segment
        // for(let i = 5; i--; )
        // {
        //     const m = random.sign();                    // Random direction multiplier
        //     const s = random.float(300, 600);          // Random size
        //     const o = random.floatSign(w + 300, 5e4);  // Random horizontal offset
        //     const p = trackSegment.pos.add(vec3(o, 0, 0));  // World position
            
        //     // Create tree-like sprite with random green color
        //     pushTrackSprite(p, vec3(s * m, s, s), hsl(random.float(.1, .15), 1, .5), vec3(1, 1));
        // }

        // === PLACED SCENERY OBJECTS ===
        // Draw intentionally placed sprites (checkpoints, billboards, etc.)
        for(const sprite of trackSegment.sprites)
            sprite.draw(trackSegment);
    }

    // Execute all scenery rendering
    glRender();
    
    // Reset depth and polygon offset settings
    glSetDepthTest();
    glPolygonOffset(0);
}

/**
 * Main track drawing function - renders track in two passes
 */
function drawTrack()
{
    drawRoad(1); // First pass: draw flat ground with depth buffer writes for z-culling
    drawRoad();  // Second pass: draw detailed road surface without depth writes for blending
}

/**
 * Helper function to draw a sprite positioned on the track surface
 * @param {vec3} pos - World position
 * @param {vec3} scale - Sprite dimensions
 * @param {Color} color - Sprite color
 * @param {vec2} tilePos - Texture atlas coordinates
 */
function pushTrackSprite(pos, scale, color, tilePos)
{
    const offset = 20; // Height above ground to prevent z-fighting
    
    // Draw shadow on ground
    pushShadow(pos.add(vec3(0, offset)), scale.y, scale.y * .2);
    
    // Draw sprite elevated above ground
    pushSprite(pos.add(vec3(0, offset + scale.y)), scale, color, getGenerativeTile(tilePos));
}

///////////////////////////////////////////////////////////////////////////////

/**
 * Calculates interpolated track properties at any Z position along the track
 * Used for smooth camera movement and collision detection
 */
class TrackSegmentInfo
{
    constructor(z)
    {
        // Find which track segment we're in and how far through it
        const segment = this.segment = z / trackSegmentLength | 0;  // Segment index (integer part)
        const percent = this.percent = z / trackSegmentLength % 1;  // Position within segment (0-1)
        
        // Interpolate between current and next segment if both exist
        if (track[segment] && track[segment + 1])
        {
            // Interpolate world position if available
            if (track[segment].pos && track[segment + 1].pos)
                this.pos = track[segment].pos.lerp(track[segment + 1].pos, percent);
            else
                this.pos = vec3(0, 0, z);  // Fallback if positions not calculated
            
            // Interpolate track properties for smooth transitions
            this.offset = track[segment].offset.lerp(track[segment + 1].offset, percent);
            this.pitch = lerp(percent, track[segment].pitch, track[segment + 1].pitch);
            this.width = lerp(percent, track[segment].width, track[segment + 1].width);
        }
        else
        {
            // Default values if segments don't exist (end of track)
            this.offset = this.pos = vec3(0, 0, z);
            this.pitch = 0;
            this.width = trackWidth;
        }
    }
}

/**
 * Represents a decorative or interactive object placed alongside the track
 */
class TrackSprite
{
    constructor(offset, scale, color, tilePos, collideSize = 60)
    {
        this.offset = offset;        // Position relative to track segment
        this.scale = scale;          // Sprite dimensions
        this.color = color;          // Sprite color/tint
        this.tilePos = tilePos;      // Texture atlas coordinates
        this.collideSize = collideSize;  // Collision radius (0 = no collision)
    }

    /**
     * Renders this sprite at the given track segment
     * @param {TrackSegment} trackSegment - The track segment to draw relative to
     */
    draw(trackSegment)
    {
        // Calculate world position by adding sprite offset to segment position
        const pos = trackSegment.pos.add(this.offset);
        pushTrackSprite(pos, this.scale, this.color, this.tilePos);
    }
}

/**
 * Represents one segment of the race track with geometry, visuals, and placed objects
 */
class TrackSegment
{
    constructor(segmentIndex, offset, width)
    {
        this.offset = offset;    // 3D position offset from straight track
        this.width = width;      // Track width at this segment
        this.pitch = 0;          // Up/down angle (calculated from height difference)
        this.normal = vec3(0, 1); // Surface normal for lighting
        this.sprites = [];       // Decorative objects placed at this segment
        
        // === CALCULATE TRACK GEOMETRY ===
        const previous = track[segmentIndex - 1];
        if (previous)
        {
            // Calculate pitch angle from height difference between segments
            this.pitch = Math.atan2(previous.offset.y - offset.y, trackSegmentLength);
            
            // Calculate surface normal for lighting by cross product
            const v = vec3(0, offset.y - previous.offset.y, trackSegmentLength);
            this.normal = v.cross(vec3(1, 0)).normalize();
        }

        // === DETERMINE SEGMENT VISUAL STYLE ===
        // Check if this segment should have level markers
        let levelMarker = segmentIndex > 25 && segmentIndex < 30;  // Starting area
        if (segmentIndex === 300 || segmentIndex === 800 || segmentIndex === 1500)
            levelMarker = 1;  // Level transition points

        {
            const largeSegmentIndex = segmentIndex / 6 | 0;
            const stripe = largeSegmentIndex % 2 ? .1 : 0;
            
            this.colorGround = hsl(.083, .2, .7 + Math.cos(segmentIndex * 2 / PI) * .05);
            this.colorRoad = BLACK;
            
<<<<<<< HEAD:track.js
            if (checkpointLine)
=======
            if (levelMarker)
>>>>>>> 2536a8a29d5b8bc8f4afbf7f22300ff8e8530a3f:objects/object-logics.js
                this.colorRoad = WHITE;
            
            // Enhanced lane markings for 3-lane system
            this.colorLine = hsl(0, 0, 1, stripe ? 0.8 : 0); // More visible lane lines
        }

        // === PLACE SCENERY OBJECTS ===
        // Helper function to add sprites to this segment
        const addSprite = (...a) => this.sprites.push(new TrackSprite(...a));

        const BARE_AREA_CHANCE = 0.6;     // 60% empty space (lots of open land)
        const BUILDING_CHANCE = 0.05;     // 5% chance of building (very few buildings)
        const HOUSE_CHANCE = 0.15;        // 15% chance of house (scattered houses)
        const TREE_CHANCE = 0.4;          // 40% chance of tree (lots of trees)
        const SIGN_CHANCE = 0.02;         // 2% chance of sign (rare signs)

        if (levelMarker) // Level transition markers
        {
            // Level transition markers
            addSprite(vec3(-width + 100, 0), vec3(800), WHITE, vec3(6, 0), 0);
            addSprite(vec3(width - 100, 0), vec3(800), WHITE, vec3(7, 0), 0);
        }
        else if (segmentIndex == 30) // Starting line banner
        {
            addSprite(vec3(0, -700, 0), vec3(1300), WHITE, vec3(5, 0), 0);
        }
        else
        {
            // OBSTACLE PLACEMENT LOGIC
            this.placeObstacles(segmentIndex, addSprite, width);
            
            // REALISTIC CITY SCENERY GENERATION
            random.setSeed(segmentIndex); // Consistent random for each segment
            
            // Left side of road - only add something if NOT bare area
            if (random.bool(BUILDING_CHANCE)) {
                // Office/Commercial Building - use different building types
                const buildingType = random.int(4); // 0,1,2,3 for different buildings
                const buildingHeight = random.float(1200, 2000);
                const buildingWidth = random.float(600, 1000);
                addSprite(vec3(-(width + 1800), 0, 0), vec3(buildingWidth, buildingHeight), WHITE, vec3(buildingType + 1, 4));
            }
            else if (random.bool(HOUSE_CHANCE)) {
                // Residential House - use house tile
                const houseSize = random.float(400, 700);
                addSprite(vec3(-(width + 1200), 0, random.floatSign(200)), vec3(houseSize), WHITE, vec3(0, 4));
            }
            else if (random.bool(TREE_CHANCE)) {
                // Tree/Park area
                const treeSize = random.float(600, 1000);
                addSprite(vec3(-(width + 1000), 0, random.floatSign(300)), vec3(treeSize), hsl(0.3, 0.7, random.float(0.3, 0.5)), vec3(0, 1));
            }
            
            // Right side of road - only add something if NOT bare area
            if (!random.bool(BARE_AREA_CHANCE)) {
                if (random.bool(BUILDING_CHANCE)) {
                    // Office/Commercial Building - use different building types
                    const buildingType = random.int(4); // 0,1,2,3 for different buildings
                    const buildingHeight = random.float(1200, 2000);
                    const buildingWidth = random.float(600, 1000);
                    addSprite(vec3(width + 1800, 0, 0), vec3(buildingWidth, buildingHeight), WHITE, vec3(buildingType + 1, 4));
                }
                else if (random.bool(HOUSE_CHANCE)) {
                    // Residential House - use house tile
                    const houseSize = random.float(400, 700);
                    addSprite(vec3(width + 1200, 0, random.floatSign(200)), vec3(houseSize), WHITE, vec3(0, 4));
                }
                else if (random.bool(TREE_CHANCE)) {
                    // Tree/Park area
                    const treeSize = random.float(600, 1000);
                    addSprite(vec3(width + 1000, 0, random.floatSign(300)), vec3(treeSize), hsl(0.3, 0.7, random.float(0.3, 0.5)), vec3(0, 1));
                }
            }

<<<<<<< HEAD:track.js

if (segmentIndex % checkpointTrackSegments == 0) // Checkpoint markers
{
    // Keep existing checkpoint code
    addSprite(vec3(-width + 100, 0), vec3(800), WHITE, vec3(6, 0), 0);
    addSprite(vec3(width - 100, 0), vec3(800), WHITE, vec3(7, 0), 0);
}
else if (segmentIndex == 30) // Starting line banner
{
    addSprite(vec3(0, -700, 0), vec3(1300), WHITE, vec3(5, 0), 0);
}
else
{
     // OBSTACLE PLACEMENT LOGIC
         this.placeObstacles(segmentIndex, addSprite, width);
            
    // REALISTIC CITY SCENERY GENERATION
    random.setSeed(segmentIndex); // Consistent random for each segment
    
    // Left side of road - only add something if NOT bare area
if (random.bool(BUILDING_CHANCE)) {
    // Office/Commercial Building - use different building types
    const buildingType = random.int(4); // 0,1,2,3 for different buildings
    const buildingHeight = random.float(1200, 2000);
    const buildingWidth = random.float(600, 1000);
    addSprite(vec3(-(width + 1800), 0, 0), vec3(buildingWidth, buildingHeight), WHITE, vec3(buildingType + 1, 4));
}
else if (random.bool(HOUSE_CHANCE)) {
    // Residential House - use house tile
    const houseSize = random.float(400, 700);
    addSprite(vec3(-(width + 1200), 0, random.floatSign(200)), vec3(houseSize), WHITE, vec3(0, 4));
}
else if (random.bool(TREE_CHANCE)) {
    // Tree/Park area
    const treeSize = random.float(600, 1000);
    addSprite(vec3(-(width + 1000), 0, random.floatSign(300)), vec3(treeSize), hsl(0.3, 0.7, random.float(0.3, 0.5)), vec3(0, 1));
}
    
    // Right side of road - only add something if NOT bare area
if (!random.bool(BARE_AREA_CHANCE)) {
    if (random.bool(BUILDING_CHANCE)) {
        // Office/Commercial Building - use different building types
        const buildingType = random.int(4); // 0,1,2,3 for different buildings
        const buildingHeight = random.float(1200, 2000);
        const buildingWidth = random.float(600, 1000);
        addSprite(vec3(width + 1800, 0, 0), vec3(buildingWidth, buildingHeight), WHITE, vec3(buildingType + 1, 4));
=======
            // Occasional road signs (less frequent)
            if (random.bool(SIGN_CHANCE)) {
                const signSide = random.bool() ? 1 : -1;
                addSprite(vec3((width + 600) * signSide, 0, 0), vec3(400), WHITE, vec3(random.int(8), 2));
            }
        }
>>>>>>> 2536a8a29d5b8bc8f4afbf7f22300ff8e8530a3f:objects/object-logics.js
    }

    /**
     * Places road obstacles randomly
     */
    placeObstacles(segmentIndex, addSprite, width)
    {
        // Don't place obstacles too early in the race
        if (segmentIndex < 100) return;
        
        // Obstacle placement probability (adjust for difficulty)
        const obstacleChance = 0.01; // 1% chance per segment
        
        if (random.bool(obstacleChance))
        {
            // Choose obstacle type
            const obstacleType = random.int(4); // 0-3 for different obstacles
            let obstacleSprite;
            
            // Choose lane (0=left, 1=center, 2=right)
            const lane = random.int(3);
            const laneWidth = width / 3;
            const laneOffset = (lane - 1) * laneWidth; // Convert to world position
            
            // Add some random offset within the lane
            const randomOffset = random.floatSign(laneWidth * 0.3);
            const xPosition = laneOffset + randomOffset;
            
            switch(obstacleType)
            {
                case 0: // Traffic Cone
                    obstacleSprite = new TrackSprite(
                        vec3(xPosition, 0, 0),     // Position
                        vec3(200),                 // Size
                        WHITE,                     // Color tint
                        vec3(1, 3),               // Texture tile (cone texture)
                        120                        // Collision size
                    );
                    obstacleSprite.obstacleType = 'cone';
                    obstacleSprite.speedPenalty = 0.7; // Slow down to 70% speed
                    break;
                    
                case 1: // Pothole
                    obstacleSprite = new TrackSprite(
                        vec3(xPosition, -20, 0),   // Slightly below ground
                        vec3(300, 50, 300),        // Wider, flatter
                        hsl(0, 0, 0.3),           // Dark gray tint
                        vec3(2, 3),               // Texture tile (pothole texture)
                        180                        // Larger collision area
                    );
                    obstacleSprite.obstacleType = 'pothole';
                    obstacleSprite.speedPenalty = 0.5; // Major slowdown
                    obstacleSprite.damageAmount = 10;   // Causes damage
                    break;
                    
                case 2: // Road Barrier
                    obstacleSprite = new TrackSprite(
                        vec3(xPosition, 0, 0),
                        vec3(400, 300, 200),       // Wide barrier
                        WHITE,
                        vec3(3, 3),               // Texture tile (barrier texture)
                        250                        // Large collision
                    );
                    obstacleSprite.obstacleType = 'barrier';
                    obstacleSprite.speedPenalty = 0.3; // Major impact
                    obstacleSprite.damageAmount = 20;
                    break;
                    
                case 3: // Oil Spill
                    obstacleSprite = new TrackSprite(
                        vec3(xPosition, -5, 0),    // Slightly below surface
                        vec3(400, 20, 400),        // Wide, flat spill
                        hsl(0.7, 0.5, 0.2),      // Dark oily color
                        vec3(4, 3),               // Texture tile (oil texture)
                        200                        // Medium collision
                    );
                    obstacleSprite.obstacleType = 'oil';
                    obstacleSprite.speedPenalty = 0.8;  // Slight slowdown
                    obstacleSprite.slippery = true;     // Makes car slide
                    break;
            }
            
            // Add the obstacle to the track
            this.sprites.push(obstacleSprite);
        }
    }

     /**
     * Places road obstacles randomly
     */
    placeObstacles(segmentIndex, addSprite, width)
    {
        // Don't place obstacles too early in the race
        if (segmentIndex < 100) return;
        
        // Obstacle placement probability (adjust for difficulty)
        const obstacleChance = 0.01; // 1% chance per segment
        
        if (random.bool(obstacleChance))
        {
            // Choose obstacle type
            const obstacleType = random.int(4); // 0-3 for different obstacles
            let obstacleSprite;
            
            // Choose lane (0=left, 1=center, 2=right)
            const lane = random.int(3);
            const laneWidth = width / 3;
            const laneOffset = (lane - 1) * laneWidth; // Convert to world position
            
            // Add some random offset within the lane
            const randomOffset = random.floatSign(laneWidth * 0.3);
            const xPosition = laneOffset + randomOffset;
            
            switch(obstacleType)
            {
                case 0: // Traffic Cone
                    obstacleSprite = new TrackSprite(
                        vec3(xPosition, 0, 0),     // Position
                        vec3(200),                 // Size
                        WHITE,                     // Color tint
                        vec3(1, 3),               // Texture tile (cone texture)
                        120                        // Collision size
                    );
                    obstacleSprite.obstacleType = 'cone';
                    obstacleSprite.speedPenalty = 0.7; // Slow down to 70% speed
                    break;
                    
                case 1: // Pothole
                    obstacleSprite = new TrackSprite(
                        vec3(xPosition, -20, 0),   // Slightly below ground
                        vec3(300, 50, 300),        // Wider, flatter
                        hsl(0, 0, 0.3),           // Dark gray tint
                        vec3(2, 3),               // Texture tile (pothole texture)
                        180                        // Larger collision area
                    );
                    obstacleSprite.obstacleType = 'pothole';
                    obstacleSprite.speedPenalty = 0.5; // Major slowdown
                    obstacleSprite.damageAmount = 10;   // Causes damage
                    break;
                    
                case 2: // Road Barrier
                    obstacleSprite = new TrackSprite(
                        vec3(xPosition, 0, 0),
                        vec3(400, 300, 200),       // Wide barrier
                        WHITE,
                        vec3(3, 3),               // Texture tile (barrier texture)
                        250                        // Large collision
                    );
                    obstacleSprite.obstacleType = 'barrier';
                    obstacleSprite.speedPenalty = 0.3; // Major impact
                    obstacleSprite.damageAmount = 20;
                    break;
                    
                case 3: // Oil Spill
                    obstacleSprite = new TrackSprite(
                        vec3(xPosition, -5, 0),    // Slightly below surface
                        vec3(400, 20, 400),        // Wide, flat spill
                        hsl(0.7, 0.5, 0.2),      // Dark oily color
                        vec3(4, 3),               // Texture tile (oil texture)
                        200                        // Medium collision
                    );
                    obstacleSprite.obstacleType = 'oil';
                    obstacleSprite.speedPenalty = 0.8;  // Slight slowdown
                    obstacleSprite.slippery = true;     // Makes car slide
                    break;
            }
            
            // Add the obstacle to the track
            this.sprites.push(obstacleSprite);
        }
    }
}

/**
 * Procedurally generates the entire race track with curves, hills, and scenery
 */
function buildTrack()
{
    /////////////////////////////////////////////////////////////////////////////////////
    // Build the road with procedural generation
    /////////////////////////////////////////////////////////////////////////////////////

    // Initialize road generation parameters
    let roadGenSectionDistanceMax = 0;    // Length of current road section
    let roadGenWidth = trackWidth;         // Current road width
    let roadGenSectionDistance = 0;        // Distance through current section
    let roadGenTaper = 0;                  // Transition length between sections
    let roadGenWaveFrequencyX = 0;         // Horizontal curve frequency
    let roadGenWaveFrequencyY = 0;         // Vertical hill frequency  
    let roadGenWaveScaleX = 0;             // Horizontal curve amplitude
    let roadGenWaveScaleY = 0;             // Vertical hill amplitude
    
    // Set deterministic random seed for consistent track generation
    random.setSeed(5123);
    track = []; 
    
    // Generate each segment of the track
    for(let i = 0; i < trackEnd + 3e3 + drawDistance; ++i)
    {
        // Check if we need to start a new road section with different parameters
        if (roadGenSectionDistance++ > roadGenSectionDistanceMax)
        {
            // Calculate difficulty progression (commented out - currently set to 1)
            const difficulty = 1; // Math.min(1, i*trackSegmentLength/checkpointDistance/checkpointMaxDifficulty);
            
            // Randomize road characteristics for this section
            roadGenWidth = trackWidth; // Fixed width (originally varied with difficulty)
            roadGenWaveFrequencyX = random.float(lerp(difficulty, .01, .03));  // Curve frequency
            roadGenWaveFrequencyY = random.float(lerp(difficulty, .01, .1));   // Hill frequency
            
            // Curve amplitude - disabled after track end
            roadGenWaveScaleX = i > trackEnd ? 0 : random.float(lerp(difficulty, .2, .8));
            roadGenWaveScaleY = random.float(5, lerp(difficulty, 10, 40));     // Hill amplitude
            
            // Set up section transition parameters
            roadGenTaper = random.float(99, 1e3) | 0;        // Transition length
            roadGenSectionDistanceMax = roadGenTaper + random.float(99, 1e3);  // Total section length
            
            // Move back to create smooth transition from previous section
            i -= roadGenTaper;
            roadGenSectionDistance = 0;
        }
        
        // Generate track geometry for this segment
        let x = Math.sin(i * roadGenWaveFrequencyX) * roadGenWaveScaleX;  // Sine wave curves
        
        // ENABLE HILLS - Replace the commented hill code
        let ys = Math.min(2e3, 10/roadGenWaveFrequencyY);  
        let y = ys * Math.sin(i * roadGenWaveFrequencyY);   
        
        let z = i * trackSegmentLength;  
        let o = vec3(x, y, z);           
        let w = i > trackEnd ? 0 : roadGenWidth;  


        let t = track[i];  // Check if segment already exists (for tapering)
        if (t)
        {
            // Smooth transition between old and new section parameters
            const p = clamp(roadGenSectionDistance / roadGenTaper, 0, 1);  // Transition progress
            o = t.offset.lerp(o, p);  // Interpolate position
            w = lerp(p, t.width, w);  // Interpolate width
        }

        // Skip negative indices (during taper backtrack)
        if (i < 0)
            continue;

        // Create the track segment with calculated parameters
        track[i] = new TrackSegment(i, o, w);
    }
}