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
    
    // Gradually rotate world heading based on track curves and player speed
    // Creates subtle banking effect when going around turns
    worldHeading += .00005 * cameraTrackInfo.offset.x * playerVehicle.velocity.z;

    // Set camera height - much higher in attract mode for overview effect
    if (attractMode)
        cameraPos.y = cameraTrackInfo.offset.y + 1e3; // 1000 units high for attract mode
    else
        cameraPos.y = cameraTrackInfo.offset.y + cameraPlayerOffset.y; // Follow track height

    // Tilt camera based on track pitch (up/down slopes) for immersion
    cameraRot.x = cameraTrackInfo.pitch / 2;
    
    // Smooth camera horizontal movement - follows 70% of player's lateral position
    cameraPos.x = playerVehicle.pos.x * .7;

    // === LIGHTING AND ATMOSPHERE SETUP ===
    // Dynamic lighting that rotates with world heading for consistent shadows
    lightDirection = vec3(0, 4, -1).rotateY(worldHeading).normalize()
    
    // Set lighting colors for the scene
    lightColor = hsl(0, 1, 1);        // Pure white light
    ambientColor = hsl(.7, .1, .2);   // Dim bluish ambient light
    fogColor = hsl(.6, 1, .7);        // Cyan fog color

    // === TRACK GEOMETRY PROJECTION ===
    // Calculate world positions for track segments (iterate in reverse for proper Z-order)
    const cameraTrackSegment = cameraTrackInfo.segment;           // Current camera segment index
    const cameraTrackSegmentPercent = cameraTrackInfo.percent;   // Position within segment (0-1)
    const turnScale = 2;  // Multiplier for how sharp turns appear
    
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
        track[j].pos = track[j].offset.copy();  // Start with track's base offset
        
        // Apply accumulated horizontal curvature
        // This creates the "projection" effect where turns appear curved
        track[j].pos.x = x += v += turnScale * s * track[j].pos.x;
        
        // Adjust Z position relative to camera for proper depth
        track[j].pos.z -= cameraOffset;
    }
}

/**
 * Renders the road surface with multiple passes for ground, road, and lane markings
 * @param {number} zwrite - Whether to write to depth buffer (1) or not (0)
 */
function drawRoad(zwrite = 0)
{
    // Configure depth testing based on pass type
    glSetDepthTest(zwrite, zwrite);
    
    // Draw road segments from far to near for proper alpha blending
    const cameraTrackSegment = cameraTrackInfo.segment;
    let segment2; // Previous segment for creating quads
    
    for(let i = drawDistance; i--; )
    {
        const segmentIndex = cameraTrackSegment + i;
        const segment1 = track[segmentIndex];
        
        // Skip if segment doesn't exist or we don't have a pair yet
        if (!segment1 || !segment2)
        {
            segment2 = segment1;
            continue;
        }

        const p1 = segment1.pos;  // Current segment position
        const p2 = segment2.pos;  // Previous segment position
        
        // Level-of-detail: reduce road resolution for distant segments
        // Closer segments (i near 0) draw every segment, distant ones skip segments
        if (i % (lerp(i / drawDistance, 1, 6) | 0) == 0)
        {
            // Set up surface normals for lighting (same for all vertices in segment)
            const normals = [segment1.normal, segment1.normal, segment2.normal, segment2.normal];
            
            // Multi-pass rendering: ground, road surface, then lane markings
            for(let pass = 0; pass < (zwrite ? 1 : 3); ++pass)
            {
                let color, offset;
                
                if (pass == 0)
                {
                    // PASS 1: Ground/grass extending beyond road
                    color = hsl(0.25, 0.5, 0.3);  // Brown ground color
                    offset = p1.z * 20;        // Wide offset fills screen horizontally
                }
                else if (pass == 1)
                {
                    // PASS 2: Road surface
                    color = segment1.colorRoad;  // Road color (varies by segment)
                    offset = segment1.width;     // Road width
                }
                else if (pass == 2)
                {
                    // PASS 3: Lane markings/stripes
                    color = segment1.colorLine;  // Stripe color
                    offset = 20;                 // Narrow stripe width
                }

                // Create quad vertices for this road section
                const point1a = vec3(p1.x + offset, p1.y, p1.z);  // Right edge, current segment
                const point1b = vec3(p1.x - offset, p1.y, p1.z);  // Left edge, current segment
                const point2a = vec3(p2.x + offset, p2.y, p2.z);  // Right edge, previous segment
                const point2b = vec3(p2.x - offset, p2.y, p2.z);  // Left edge, previous segment
                
                const poly = [point1a, point1b, point2a, point2b];  // Quad vertices
                
                // Add polygon to render queue if it has alpha (visible)
                color.a && glPushPoints(poly, normals, color, 0, 1);
            }
            segment2 = segment1;  // Update previous segment for next iteration
        }
    }

    // Execute all queued polygon rendering
    glRender();
    
    // Reset depth testing to default state
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
        // Check if this segment should have checkpoint/starting line markings
        let checkpointLine = segmentIndex > 25 && segmentIndex < 30;  // Starting area
        if (segmentIndex % checkpointTrackSegments < 5)
            checkpointLine = 1;  // Regular checkpoint intervals

        {
            // Calculate colors based on segment position
            const largeSegmentIndex = segmentIndex / 6 | 0;  // Group segments for pattern
            const stripe = largeSegmentIndex % 2 ? .1 : 0;   // Alternating stripe pattern
            
            // Ground color with subtle variation
            this.colorGround = hsl(.083, .2, .7 + Math.cos(segmentIndex * 2 / PI) * .05);
            
            // Road surface color - black for all segments
            this.colorRoad = BLACK;
            
            if (checkpointLine)
                this.colorRoad = WHITE; // White for starting/checkpoint lines
            
            // Lane stripe visibility - only visible on stripe segments
            this.colorLine = hsl(0, 0, 1, stripe ? 1 : 0);
        }

        // === PLACE SCENERY OBJECTS ===
        // Helper function to add sprites to this segment
        const addSprite = (...a) => this.sprites.push(new TrackSprite(...a));
        
        if (segmentIndex % checkpointTrackSegments == 0) // Checkpoint markers
        {
            // Left checkpoint post
            addSprite(vec3(-width + 100, 0), vec3(800), WHITE, vec3(6, 0), 0);
            // Right checkpoint post  
            addSprite(vec3(width - 100, 0), vec3(800), WHITE, vec3(7, 0), 0);
        }
        if (segmentIndex == 30) // Starting line banner
            addSprite(vec3(0, -700, 0), vec3(1300), WHITE, vec3(5, 0), 0);
        else
        {
            // Regular trackside scenery
            let s = random.float(1200, 2000);        // Random size (favors taller trees)
            let sideTree = random.bool(.8);   // Place tree more frequently (80% chance)
            let m = segmentIndex % 2 ? 1 : -1;      // Alternate sides
            let m2 = sideTree ? m : random.sign();  // Direction for placement
            let o = (width + (sideTree ? 2000 : random.float(2e5))) * m2;  // Distance from track (increased for side trees)
            let offset = vec3(o, 0, 0);

            if (random.bool(.01))  // 1% chance for billboard
            {
                // Billboard placement
                offset = vec3((width + 1200) * random.sign(), 0, 0)  // Increased distance from track
                addSprite(offset, vec3(800), hsl(0, 0, random.float(.9, 1)), vec3(random.int(8), 2));  // Doubled size from 400 to 800
            }
            else
            {
                // Use maple trees with random red/yellow foliage
                const isRed = random.bool(0.5);
                addSprite(offset, vec3(s * m, s, s), isRed ? hsl(0.95, 0.8, 0.5) : hsl(0.1, 0.8, 0.6), vec3(0, 1));
            }
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
        let x = 0;  // Horizontal offset (curves disabled)
        let ys = 0;  // No hills currently
        let y = ys;  // Vertical offset

        // Calculate horizontal and vertical offsets based on sine waves
        /*
        let x = Math.sin(i*roadGenWaveFrequencyX) * roadGenWaveScaleX;  // Commented: sine wave curves
        let ys = min(2e3,10/roadGenWaveFrequencyY);  // Commented: hill calculation
        let y = ys * Math.sin(i*roadGenWaveFrequencyY);  // Commented: sine wave hills
        */
        let z = i * trackSegmentLength;  // Z position along track
        let o = vec3(x, y, z);           // 3D offset for this segment
        let w = i > trackEnd ? roadGenWidth : roadGenWidth;  // Width (0 after track end)
        
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