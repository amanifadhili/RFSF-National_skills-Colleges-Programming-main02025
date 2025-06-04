'use strict';

// GLOBAL VARIABLES AND CONSTANTS

// Canvas and context for generating procedural textures
let generativeCanvas, generativeContext;

// Size of each individual tile in the texture atlas (256x256 pixels)
const generativeTileSize = 256;

// Total canvas size: 8x8 grid of tiles = 2048x2048 pixels
const generativeCanvasSize = vec3(generativeTileSize*8, generativeTileSize*8, 1);

// Vector representing individual tile dimensions
const generativeTileSizeVec3 = vec3(generativeTileSize, generativeTileSize, 0);

// =============================================================================
// INITIALIZATION FUNCTION
// =============================================================================

/**
 * Initializes the generative texture system
 * Creates canvas, generates all textures, and sets up WebGL texture
 */
function initGenerative()
{
    // Create HTML5 canvas element for texture generation
    generativeCanvas = document.createElement('canvas');
    generativeContext = generativeCanvas.getContext('2d');
    
    // Set canvas dimensions to hold 8x8 grid of 256x256 tiles
    generativeCanvas.width = generativeCanvasSize.x;
    generativeCanvas.height = generativeCanvasSize.y;
    
    // Generate all procedural textures onto the canvas
    generateTetures(); // Note: typo in original function name
    
    // Create WebGL texture from the generated canvas
    glActiveTexture = glCreateTexture(generativeCanvas);
    
    // Bind the texture for use in WebGL rendering
    glContext.bindTexture(gl_TEXTURE_2D, glActiveTexture);
}

// =============================================================================
// MAIN TEXTURE GENERATION FUNCTION
// =============================================================================

/**
 * Generates all procedural textures and draws them to specific tile positions
 * Uses a deterministic random seed for consistent generation
 */
function generateTetures()
{
    const context = generativeContext;
    
    // Set deterministic seed for consistent random generation
    random.setSeed(13);

    // =============================================================================
    // PARTICLE CLASS DEFINITION
    // =============================================================================
    
    /**
     * Particle class for creating animated/trail effects
     * Used for generating organic shapes like grass, trees, and particle effects
     */
    class Particle
    {
        /**
         * @param {number} x - Starting X position (0-1 normalized)
         * @param {number} y - Starting Y position (0-1 normalized)
         * @param {number} vx - X velocity
         * @param {number} vy - Y velocity
         * @param {number} accel - Acceleration factor (affects trajectory curve)
         * @param {number} sizeStart - Starting size of particle trail
         * @param {number} sizeEnd - Ending size of particle trail
         * @param {string} c - Color (defaults to BLACK)
         */
        constructor(x, y, vx, vy, accel, sizeStart=.1, sizeEnd=0, c=BLACK)
        {
            this.x = x;           // Starting position X
            this.y = y;           // Starting position Y
            this.vx = vx;         // Velocity X component
            this.vy = vy;         // Velocity Y component
            this.accel = accel;   // Acceleration (creates curved paths)
            this.sizeStart = sizeStart; // Initial particle size
            this.sizeEnd = sizeEnd;     // Final particle size
            this.color = c;       // Base color
            this.style = 0;       // Style flag (0=linear, 1=sine wave interpolation)
            this.colorRandom = 0; // Amount of color randomization
            this.iterations = 50; // Number of segments to draw (higher = smoother)
        }
       
        /**
         * Draws the particle trail by rendering multiple segments
         * Creates smooth trails with size and color interpolation
         */
        draw()
        {
            // Draw particle trail in segments for smooth appearance
            for(let i=this.iterations|0; i-->0;)
            {
                // Apply color variation if specified
                if (this.color)
                    color(random.mutateColor(this.color, this.colorRandom))
                
                // Calculate interpolation factor (0 to 1)
                const p = i/this.iterations;
                
                // Calculate position with physics: x = x0 + vt, y = y0 + vt + 0.5*a*t²
                const x1 = this.x + this.vx * p;
                const y1 = this.y + this.vy * p + this.accel * p * p;
                
                // Calculate size interpolation
                let s;
                if (this.style)
                    // Sine wave interpolation (creates organic, leafy effects)
                    s = Math.sin(p*PI)*(this.sizeStart-this.sizeEnd) + this.sizeEnd;
                else
                    // Linear interpolation
                    s = lerp(p, this.sizeStart, this.sizeEnd);
                
                // Draw rectangle segment at calculated position and size
                rect(x1, y1, s, s);
            }
        }
    };

    // =============================================================================
    // TEXTURE GENERATION - BASIC SHAPES AND ELEMENTS
    // =============================================================================
    
    {
        // ROW 0: Basic geometric shapes and UI elements
        
        // Tile (0,0): Solid black circle
        color(hsl(0,0,0)); // Set fill color to black
        setupContext(0,0); // Position context at tile (0,0)
        circle(.5,.5,.45); // Draw circle at center with radius 0.45
        
        // Tile (1,0): Radial gradient circle (for lighting effects)
        setupContext(1,0);
        radialGradient(.5,.5,0,.45,hsl(0,0,1),hsl(0,0,1,0)); // White to transparent
        circle(.5,.5,.45);
        // Add concentric circles for additional depth
        for(let i=40;i--;)
            color(hsl(0,0,1,i/300)), // Decreasing opacity
            circle(.5,.5,.5-i/80); // Decreasing radius
        
        // Tile (2,0): Square with fade effect
        setupContext(2,0);
        for(let i=40,a;i--;)
        {
            color(rgb(RED)), // White with varying alpha
            //color(hsl(0,0,1,a=i/40)), // White with varying alpha
            rect(.5,.5,.5-a/3,.9-a/3); // Rectangle with decreasing size
        }
        
        // Tile (3,0): License plate
        setupContext(3,0);
        drawLicensePlate();
        
        // Tile (4,0): Year text "2025"
        setupContext(4,0);
        text('2025',.5,.5,1,.9,.03,'impact'); // Large bold text
        
        // Tile (5,0): Start sign
        setupContext(5,0);
        drawStartSign();
        
        // Tile (6,0): Regular checkpoint sign
        setupContext(6,0);
        // drawCheckpointSign();
        
        // Tile (7,0): Checkpoint sign variant
        setupContext(7,0);
        drawCheckpointSign(1);
        
        // Tile (4,2): Newgrounds logo sign
        setupContext(4,2);
        drawNewgroundsSign();

        // ROW 1: Vegetation and natural elements
        
        // Tile (1,1): Grass texture
        setupContext(1,1);
        drawGrass();
        
        // Tile (0,1): Avocado tree
        setupContext(0,1);
        drawAvocadoTree();

        // ROW 2: Various signage
        setupContext(0,2);
        // drawRTBSign(); // RFSF Skills 2025 sign
        
        setupContext(1,2);
        // drawMarketingSign(); // Programming Competition sign
         
        setupContext(2,2);
        drawGenericSign('CODING CHALLENGE',.3,BLACK,WHITE);
        
        setupContext(3,2);
        drawLittleJSSign(); // "WELCOME RWANDA" sign
        
        setupContext(4,2);
        drawCompSign(); // National Skills Competition sign

         setupContext(5,2);
        drawGenericSign('RFSF ACADEMY',.4,BLACK,WHITE);
        
         setupContext(6,2);
        drawDwitterSign('www.rfsf.rw',.3,BLACK,WHITE,'courier new');
        
        setupContext(7,2);
        drawTeaPlantSign(); 
        
        // Note: This overwrites the tea plant sign with stop sign
        setupContext(7,2);
        drawStopSign();

        // ROW 3: Additional elements
        setupContext(0,3);
        drawZZFXSign(); // RFSF Programming branding
        // ROW 4: Urban Buildings and Houses
        setupContext(0,4);
        drawSimpleHouse();

        setupContext(1,4);
        drawApartmentBuilding();

        setupContext(2,4);
        drawOfficeBuilding();

        setupContext(3,4);
        drawShop();

        setupContext(4,4);
        drawSkyscraper();

        setupContext(5,4);
        drawWarehouse();



       // Add obstacle textures 
    setupContext(1,3);
    drawTrafficCone();
    
    setupContext(2,3);
    drawPothole();
    
    setupContext(3,3);
    drawBarrier();
    
    setupContext(4,3);
    drawOilSpill();
    }

    // =============================================================================
    // ALPHA CHANNEL POST-PROCESSING
    // =============================================================================
    
    {
        // Convert semi-transparent pixels to fully opaque or transparent
        // This creates hard edges suitable for pixel art or retro graphics
        const w = generativeCanvas.width, h = generativeCanvas.height;
        
        // Get image data starting from second row (skip first row)
        const imageData = context.getImageData(0, generativeTileSize, w, h);
        const data = imageData.data;
        
        // Process alpha channel: < 128 becomes 0, >= 128 becomes 255
        for (let i=3; i<data.length; i+=4)
            data[i] = data[i] < 128 ? 0 : 255;
        
        // Put processed data back to canvas
        context.putImageData(imageData, 0, generativeTileSize);
    }

    // =============================================================================
    // UTILITY AND HELPER FUNCTIONS
    // =============================================================================

    /**
     * Sets up 2D context for drawing in a specific tile
     * Transforms coordinate system from 0-1 to tile pixel coordinates
     * @param {number} x - Tile X coordinate (0-7)
     * @param {number} y - Tile Y coordinate (0-7)
     */
    function setupContext(x,y)
    {
        const w = generativeTileSize;
        context.restore(); // Restore previous transform state
        context.save();    // Save current state
        
        // Set transform: scale to tile size and translate to tile position
        context.setTransform(w,0,0,w,w*x,w*y);
        
        // Clip drawing to tile boundaries to prevent overflow
        context.beginPath();
        context.rect(0,0,1,1);
        context.clip();
    }

    // Drawing primitive shortcuts (normalized 0-1 coordinates)
    function particle(...a) { return new Particle(...a); }
    function circle(x,y,r) { ellipse(x,y,r,r); }
    
    /**
     * Draws filled rectangle centered at position
     * @param {number} x - Center X (default 0.5)
     * @param {number} y - Center Y (default 0.5) 
     * @param {number} w - Width (default 1.0)
     * @param {number} h - Height (default 1.0)
     */
    function rect(x=.5,y=.5,w=1,h=1) { 
        context.fillRect(x-w/2,y-h/2,w,h); 
    }
    
    /**
     * Draws rectangle outline
     * @param {number} l - Line width (default 0.05)
     */
    function rectOutline(x=.5,y=.5,w=1,h=1,l=.05)
    { 
        context.lineWidth=l; 
        context.strokeRect(x-w/2,y-h/2,w,h); 
    }
    
    // Color setting functions
    function color(c=WHITE) { context.fillStyle = c; }
    function lineColor(c=WHITE) { context.strokeStyle = c; }

    /**
     * Creates radial gradient fill
     * @param {number} x,y - Center point
     * @param {number} r1 - Inner radius
     * @param {number} r2 - Outer radius
     * @param {string} color1 - Inner color
     * @param {string} color2 - Outer color
     */
    function radialGradient(x,y,r1,r2,color1,color2=WHITE)
    {
        const g = context.createRadialGradient(x,y,r1,x,y,r2);
        g.addColorStop(0,color1);
        g.addColorStop(1,color2);
        color(g);
    }

    /**
     * Creates linear gradient fill
     */
    function linearGradient(x1,y1,x2,y2,color1,color2=WHITE)
    {
        const g = context.createLinearGradient(x1,y1,x2,y2);
        g.addColorStop(0,color1);
        g.addColorStop(1,color2);
        color(g);
    }

    /**
     * Draws filled ellipse
     * @param {number} a - Rotation angle in radians
     */
    function ellipse(x=.5,y=.5,w=.5,h=.5,a=0)
    {
        context.beginPath();
        context.ellipse(x,y,max(0,w),max(0,h),a,0,9); // 9 > 2π for full circle
        context.fill();
    }

    /**
     * Draws line between two points
     * @param {number} w - Line width
     */
    function line(x1,y1,x2,y2,w=.1)
    {
        context.lineWidth = w;
        context.beginPath();
        context.lineTo(x1,y1);
        context.lineTo(x2,y2);
        context.stroke();
    }

    /**
     * Draws regular polygon
     * @param {number} sides - Number of sides
     * @param {number} x,y - Center position
     * @param {number} r - Radius
     * @param {number} ao - Angular offset
     */
    function polygon(sides=3, x=.5, y=.5, r=.5, ao=0)
    {
        context.beginPath();
        for(let i=sides; i--;)
        {
            const a = i/sides*PI*2;
            context.lineTo(x+r*Math.sin(a+ao), y-r*Math.cos(a+ao));
        }
        context.fill();
    }

    /**
     * Draws text with comprehensive styling options
     * @param {string} s - Text string
     * @param {number} lineWidth - Stroke width (0 = no stroke)
     * @param {string} textAlign - Text alignment
     * @param {number} weight - Font weight
     * @param {string} style - Font style (italic, etc.)
     */
    function text(s, x=.5, y=.5, size=1, width=.95, lineWidth=0, font='arial', textAlign='center', weight=400, style='')
    {
        context.lineWidth = lineWidth;
        context.font = style + ' ' + weight + ' ' + size + 'px '+font;
        context.textBaseline = 'middle';
        context.textAlign = textAlign;
        context.lineJoin = 'round';
        
        // Draw filled text
        context.fillText(s, x, y, width);
        
        // Draw stroked text if line width specified
        lineWidth && context.strokeText(s, x, y, width);
    }

    // =============================================================================
    // VEGETATION DRAWING FUNCTIONS
    // =============================================================================

    /**
     * Draws palm tree with trunk and radiating fronds
     * Uses particle system for organic appearance
     */
    function drawPalmTree()//unused by now
    {
        // Draw trunk using particle trail
        let p = particle(.3,.29,.3,.5,.5,.02,.06);
        p.color = hsl(.1,.5,.1); // Green-brown trunk color
        p.colorRandom = .1;      // Slight color variation
        p.draw();

        // Draw 12 palm fronds radiating from top
        for(let j=12;j--;)
        {
            let v = .3, a = j/12*PI*2 // Velocity and angle for each frond
            let vx = Math.sin(a) * v, vy = Math.cos(a) * v;
            
            // Create frond particle with upward bias
            let p = particle(.3,.23,vx,vy-.1,.2,.05,.005);
            p.style = 55; // Use sine wave style for organic leaf shape
            p.color = hsl(.3,.6,random.float(.3,.5)); // Varied green tones
            p.colorRandom = .1;
            p.draw();
        }
    }

    /**
     * Draws a maple tree with yellow or red foliage
     * @param {number} x - Center X position (0-1 normalized)
     * @param {number} y - Center Y position (0-1 normalized)
     * @param {boolean} isRed - Whether to use red foliage (true) or yellow (false)
     */
    function drawMapleTree(x = 0.5, y = 0.5, isRed = false) {
        // Draw trunk
        let p = particle(x, y + 0.3, 0, 0, 0.7, 0.02, 0.1);
        p.color = hsl(0.08, 0.6, 0.25); // Dark brown trunk
        p.colorRandom = 0.05;
        p.draw();
        
        // Draw main branches
        for(let j = 5; j--;) {
            let angle = j/5 * PI * 1.5 + random.float(-0.2, 0.2);
            let length = random.float(0.2, 0.3);
            let xPos = x + Math.cos(angle) * 0.1;
            let yPos = y + 0.2 + Math.sin(angle) * 0.1;
            
            let p = particle(xPos, yPos, 
                            Math.cos(angle) * length, 
                            Math.sin(angle) * length, 
                            0.2, 0.04, 0.01);
            p.color = hsl(0.09, 0.5, 0.3); // Medium brown branches
            p.colorRandom = 0.05;
            p.draw();
        }
        
        // Draw foliage (leaves)
        for(let j = 100; j--;) {
            let angle = random.float(0, PI * 2);
            let distance = random.float(0, 0.25);
            let xPos = x + Math.cos(angle) * distance;
            let yPos = y + Math.sin(angle) * distance;
            
            let vx = Math.cos(angle) * random.float(0.05, 0.2);
            let vy = Math.sin(angle) * random.float(0.05, 0.2);
            
            let leafSize = random.float(0.15, 0.25);
            let p = particle(xPos, yPos, vx, vy, leafSize, 0.03, 0.005);
            
            // Use red or yellow foliage based on parameter
            if (isRed) {
                p.color = hsl(random.float(0.95, 1.05), 0.8, random.float(0.4, 0.6)); // Red tones
            } else {
                p.color = hsl(random.float(0.1, 0.15), 0.8, random.float(0.5, 0.7)); // Yellow tones
            }
            p.colorRandom = 0.1;
            p.style = 12; // Leafy appearance style
            p.draw();
        }
    }

    /**
     * Draws simple tree with vertical trunk and random branches
     */
    function drawTree() {
        // Randomly choose between red and yellow maple trees
        const isRed = random.bool(0.5);
        drawMapleTree(0.5, 0.5, isRed);
    }

    /**
     * Draws avocado tree with thick trunk, branches, dense foliage and fruit
     * Positioned at x=0.7 to complement palm tree at x=0.3
     */
    function drawAvocadoTree() {
        const treeX = 0.7; // Position tree on right side
        
        // Draw thick, short trunk (characteristic of avocado trees)
        let p = particle(treeX, .4, 0, 0, .7, .02, .1);
        p.color = hsl(.08, .6, .25); // Dark brown trunk
        p.colorRandom = .05;
        p.draw();
        
        // Draw 5 main branches extending from trunk
        for(let j = 5; j--;) {
            let angle = j/5 * PI * 1.5 + random.float(-.2, .2); // Spread branches with variation
            let length = random.float(.2, .3);
            let xPos = treeX + Math.cos(angle) * .1;
            let yPos = .3 + Math.sin(angle) * .1;
            
            // Create branch particle
            let p = particle(xPos, yPos, 
                             Math.cos(angle) * length, 
                             Math.sin(angle) * length, 
                             .2, .04, .01);
            p.color = hsl(.09, .5, .3); // Medium brown branches
            p.colorRandom = .05;
            p.draw();
        }
        
        // Draw dense, rounded canopy (100 leaf clusters)
        for(let j = 100; j--;) {
            // Create circular distribution for full canopy
            let angle = random.float(0, PI * 2);
            let distance = random.float(0, .25); // Random distance from center
            let xPos = treeX + Math.cos(angle) * distance;
            let yPos = .25 + Math.sin(angle) * distance;
            
            // Random outward velocity for fuller appearance
            let vx = Math.cos(angle) * random.float(.05, .2);
            let vy = Math.sin(angle) * random.float(.05, .2);
            
            let leafSize = random.float(.15, .25);
            let p = particle(xPos, yPos, vx, vy, leafSize, .03, .005);
            
            // Dark green leaves characteristic of avocado trees
            p.color = hsl(random.float(.25, .35), .7, random.float(.2, .4));
            p.colorRandom = .1;
            p.style = 12; // Leafy appearance style
            p.draw();
        }
        
        // Draw 26 avocados hanging from branches
        for(let j = 26; j--;) {
            let angle = random.float(0, PI * 2);
            let distance = random.float(.1, .3);
            let xPos = treeX + Math.cos(angle) * distance;
            let yPos = .3 + Math.sin(angle) * distance;
            
            // Hanging fruit with slight downward movement
            let p = particle(xPos, yPos, 0, random.float(.01, .03), .1, .01, .01);
            p.color = hsl(.25, .8, .3); // Avocado green
            p.colorRandom = .05;
            p.style = 0; // Round fruit shape
            p.draw();
        }
    }

    /**
     * Draws grass using 100 individual grass blade particles
     * Creates natural, windswept appearance
     */
    function drawGrass() {
        for (let i = 300; i--;) {
            // Random horizontal position with clustering near left
            let x = 0.21 + random.floatSign(0.1);
            
            // Create grass blade particle with upward growth and wind effect
            let p = particle(x, 1, // Start from bottom
                           random.floatSign(1.25),        // Random horizontal sway
                           random.floatSign(-3.6, -1),    // Strong upward growth
                           1.5, 0.02);                    // Gravity effect, thin blades
            
            // Varied green colors for natural appearance
            p.color = hsl(.3,.6,random.float(.3,.5));
            p.iterations = 200; // High detail for smooth grass blades
            p.draw();
        }
    }
    
    // =============================================================================
    // SIGN DRAWING FUNCTIONS
    // =============================================================================
    
    /**
     * Draws standard sign background with posts and border
     * @param {number} w,h - Sign dimensions
     * @param {string} c - Background color
     * @param {string} outlineColor - Border color
     * @param {number} outline - Border thickness
     * @param {string} legColor - Post color
     * @param {number} legSeparation - Distance between posts
     */
    function drawSignBackground(w=1,h=.9,c=WHITE,outlineColor=hsl(0,0,.1),outline=.05,legColor=c, legSeparation=.2)
    {
        // Draw two support posts
        color(legColor);
        rect((.5-legSeparation)*w,.5,.1,1); // Left post
        rect((.5+legSeparation)*w,.5,.1,1); // Right post
        
        // Draw sign background
        color(c);
        rect(w/2,h/2,w,h);
        
        // Draw border/outline
        color(outlineColor);
        rect(w/2,h/2,w-outline,h-outline);
    }

    /**
     * Draws "RTB SKILLS 2025" sign with red accent
     */
    function drawRTBSign()
    {
        drawSignBackground();
        color(); // Default color (likely black)
        text('RFSF',.25,.27,.5,.35,0,'courier new',undefined,600);
        text('SKILLS',.5,.66,.5,.9,0,'courier new',undefined,600);
        color(hsl(.6,.8, .5)); // Blue color for year
        text('2025',.67,.27,.5,.5,0,'courier new',undefined,600);
    }

    /**
     * Draws animated marketing sign with rainbow text effect
     * Creates dynamic color cycling through "INYAMANZA MILK ZONE"
     */
    function drawMarketingSign()
    {
        drawSignBackground();
        
        // Draw 300 layers with varying colors for rainbow effect
        for(let i=300;i--;)
        {
            let p = 1-i/300;     // Progress from 0 to 1
            let b = Math.abs(3-4*p); // Bounce factor for text animation
            let l = i ? 0 : .02; // Line width (outline on final layer only)
            
            color(hsl(p*2,1,.5)); // Cycle through rainbow colors
            lineColor();
            
            // Draw animated text with vertical bounce
            text('PROGRAMMING',.5,.5-b*.15,.02+p*.25,.85,l,undefined,undefined,800);
            text('COMPETITION',  .5,.5+b*.12,.02+p*.25,.85,l,undefined,undefined,800);
        }
    }

    /**
     * Draws sign with custom text and decorative bars
     * @param {string} t - Text to display
     * @param {number} size - Text size
     * @param {string} c - Background color
     * @param {string} color2 - Text/border color
     * @param {string} font - Font family
     */
    function drawDwitterSign(t,size=.5,c=WHITE,color2=BLACK,font)
    {
        let signSize = size+.33
        drawSignBackground(1,signSize,c,color2);
        color(c);
        text(t,.5,.2,size,.9,0,font,undefined,600);
        
        // Draw decorative horizontal bars
        const w = .03;
        for(let i=9;i--;)
            rect(.25+i*w*2,.44,w,w*4);
    }

    /**
     * Draws octagonal stop sign with red background and white text
     */
    function drawStopSign() {
        // Draw support structure
        drawSignBackground(1, 0.9, hsl(0, 0, 0.2), WHITE);

        // Define stop sign colors
        let redColor = hsl(0, 1, 0.5);  // Bright red
        let whiteColor = WHITE;

        // Set colors for octagon
        color(redColor);
        lineColor(redColor);

        // Draw octagonal shape (8-sided polygon)
        let centerX = 0.5;
        let centerY = 0.5;
        let radius = 0.3;
        polygon(8, centerX, centerY, radius, PI / 8); // Rotated for upright orientation

        // Add "STOP" text in white
        color(whiteColor);
        text('STOP', centerX, centerY, 0.2, 1, 0);
    }

    /**
     * Draws tea plantation themed sign with triangle logo
     */
   function drawTeaPlantSign()
    {
        drawSignBackground(1,.9,hsl(0,0,.2),WHITE); // Dark background
        let c = hsl(.15, .8, .6); // Tech blue color scheme
        color(c);
        lineColor(c);
        
        let y = .37;
        circle(.5,y,.32); // Background circle
        text('TECH SCHOOL',.5,.8,.15,.9,0,undefined,undefined,600);
        
        // Draw gear/cog logo (represents technology)
        color(WHITE);
        polygon(8, .5,y, .25); // Octagon for gear shape
        circle(.5,y,.1); // Center hole
        
        // Add decorative line element
        let r = .3;
        let ox = r*Math.cos(PI/3);
        let oy = r*Math.sin(PI/3);
        let x = .46;
        y += .15;
        line(x,y,x+ox,y-oy,.07);
    }

    /**
     * Draws Newgrounds website branding sign
     */
   function drawNewgroundsSign()
    {
        let size=.2,c=WHITE,color2=hsl(.57, .1, .14); // Dark blue-green background
        let signSize = size+.1
        drawSignBackground(1,signSize,c,color2,.05,WHITE,0);
        color(c);
        
        const y = (signSize+.05)/2;
        const o = hsl(.08, 1, .61); // Orange accent color
        
        // "CODE" in orange with outline
        color(o);
        lineColor(o)
        text('CODE',.25,y,size,.3,.02,'Verdana');
        
        // "FUTURE" in white with outline
        color();
        lineColor()
        text('FUTURE',.65,y,size,.5,.02);
    }

    /**
     * Generic sign template for custom text
     * @param {string} t - Text content
     * @param {number} size - Text size
     * @param {string} c - Background color
     * @param {string} color2 - Text color
     * @param {string} font - Font family
     */
    function drawGenericSign(t,size=.5,c=WHITE,color2=BLACK,font)
    {
        let signSize = size+.1
        drawSignBackground(1,signSize,c,color2);
        color(c);
        text(t,.5,(signSize+.05)/2,size,.9,0,font,undefined,600);
    }

    /**
     * Draws ZZFX audio library branding with 3D effect
     * @param {string} t - Text to display (defaults to "ZZFX")
     */
    function drawZZFXSign(t='RFSF PROGRAMMING')
    {
        drawSignBackground(1,.6,BLACK,hsl(0,0,.2)); // Dark background
        
        // Create 3D layered text effect
        color(hsl(.6,1,.5)); // Cyan base layer
        let x = .47, y = .38, o = .03; // Position and offset
        text(t,x,y,.45,.8,0,undefined,undefined,900);
        
        color(YELLOW); // Yellow middle layer
        text(t,x+o,y-o,.45,.8,0,undefined,undefined,900);
        
        color(hsl(.96,1,.5)); // Pink top layer with white outline
        lineColor(WHITE)
        text(t,x+2*o,y-2*o,.45,.8,.01,undefined,undefined,900);
    }

    /**
     * Draws competition/event announcement sign
     */
   function drawCompSign()
    {
        drawSignBackground(1,.6,RED,hsl(.2,.9,.3),.05,BLACK,.5); // Orange border, black posts
        color(BLACK);
        text('NATIONAL SKILLS',.5,.24,.28,.85,0,undefined,undefined,800);
        text('COMPETITION',.5,.46,.2,1,0,undefined,undefined,800);
    }

    /**
     * Draws colorful "VISIT RWANDA" sign with per-letter coloring
     */
     function drawLittleJSSign()
    {
        drawSignBackground(1, .7, BLACK, WHITE, .05, WHITE, 0); // Black background, white border and posts
        color();
        ljsText('WELCOME', 0.05, .25);    // First line
        ljsText('RWANDA', 0.1, .5, 0);  // Second line with Rwandan flag colors

        /**
         * Helper function to draw text with cycling Rwandan flag colors per letter
         * @param {string} t - Text to draw
         * @param {number} x,y - Starting position
         * @param {number} o - Color offset for variety
         */
        function ljsText(t, x, y, o = 0)
        {
            const rwandaColors = ['rgb(9, 242, 98)', 'rgb(244, 237, 11)', 'rgb(84, 191, 230)']; // Green, Yellow, Blue

            for (let i = 0; i < t.length; i++)
            {
                let weight = 400, fontSize = .18, font = 'arial';
                context.font = weight + ' ' + fontSize + 'px ' + font;
                let w = context.measureText(t[i]).width;

                // Cycle through Rwandan flag colors
                let colorIndex = (i + o) % rwandaColors.length;
                color(rwandaColors[colorIndex]);

                text(t[i], x + w / 2, y, fontSize, 1, .03, font, undefined, weight);
                text(t[i], x + w / 2, y, fontSize, 1, 0, font, undefined, weight);
                x += w;
            }
        }
    }

    function drawStartSign()
    {
        // Draw two vertical support poles
        const poleColor = hsl(0, 0, 0.7); // Light gray poles
        color(poleColor);
        rect(0.15, 0.5, 0.04, 1);    // Left pole
        rect(0.85, 0.5, 0.04, 1);    // Right pole
        
        // Add pole caps/tops
        color(hsl(0, 0, 0.8)); // Slightly lighter gray
        circle(0.15, 0.1, 0.03);     // Left pole cap
        circle(0.85, 0.1, 0.03);     // Right pole cap
        
        // Draw banner background (white center section)
        color(WHITE);
        rect(0.5, 0.3, 0.6, 0.2);    // Main banner rectangle
        
        // Draw banner border
        color(BLACK);
        rectOutline(0.5, 0.3, 0.6, 0.2, 0.01);
        
        // Draw checkered pattern on left side
        drawCheckeredPattern(0.2, 0.3, 0.15, 0.2);
        
        // Draw checkered pattern on right side  
        drawCheckeredPattern(0.8, 0.3, 0.15, 0.2);
        
        // Draw "START" text in the center
        color(BLACK);
        text('START', 0.5, 0.3, 0.12, 0.25, 0, 'arial', 'center', 800);
        
        // Add banner suspension lines/ropes
        color(hsl(0, 0, 0.3)); // Dark gray ropes
        line(0.15, 0.15, 0.275, 0.22, 0.008);  // Left rope to banner
        line(0.85, 0.15, 0.725, 0.22, 0.008);  // Right rope to banner
        
        /**
         * Helper function to draw checkered racing flag pattern
         * @param {number} centerX - Center X position of checkered area
         * @param {number} centerY - Center Y position of checkered area  
         * @param {number} width - Width of checkered area
         * @param {number} height - Height of checkered area
         */
        function drawCheckeredPattern(centerX, centerY, width, height)
        {
            const squareSize = 0.025; // Size of individual checker squares
            const startX = centerX - width/2;
            const startY = centerY - height/2;
            const cols = Math.ceil(width / squareSize);
            const rows = Math.ceil(height / squareSize);
            
            for(let row = 0; row < rows; row++)
            {
                for(let col = 0; col < cols; col++)
                {
                    // Alternate between black and white squares
                    const isBlack = (row + col) % 2 === 0;
                    color(isBlack ? BLACK : WHITE);
                    
                    const squareX = startX + col * squareSize + squareSize/2;
                    const squareY = startY + row * squareSize + squareSize/2;
                    
                    // Only draw squares that are within the defined area
                    if(squareX >= startX && squareX <= startX + width &&
                       squareY >= startY && squareY <= startY + height)
                    {
                        rect(squareX, squareY, squareSize, squareSize);
                    }
                }
            }
        }
    }

    function drawCheckpointSign(side=0)
    {
        color(hsl(0,0,.2));
        rect(side,.5,.2,1);
        color(RED);
        rect(.5,0,1,.5);
        color(hsl(.3,.7,.5));
        text('CHECK POINT',.5,.16,.27,.95,.01,undefined,undefined,600);
    }
    
    function drawLicensePlate(t='RTB/RP-2025')
    {
        color(YELLOW)
        rect();
        color(BLACK);
        lineColor(BLACK);
        text(t,.5,.6,1,.9,0,'monospace',undefined,60);
    
    }

    function drawSimpleHouse() {
        color(hsl(0.1, 0.6, 0.7)); // Beige house
        rect(0.5, 0.7, 0.8, 0.5); // Main house body
        color(hsl(0.0, 0.8, 0.4)); // Red roof
        polygon(3, 0.5, 0.35, 0.5, 0); // Triangle roof
        color(hsl(0.08, 0.8, 0.3)); // Brown door
        rect(0.4, 0.8, 0.1, 0.2);
        color(hsl(0.6, 0.8, 0.8)); // Blue windows
        rect(0.3, 0.6, 0.08, 0.08);
        rect(0.7, 0.6, 0.08, 0.08);
    }

    function drawApartmentBuilding() {
        color(hsl(0.0, 0.0, 0.6)); // Gray building
        rect(0.5, 0.5, 0.9, 1.0);
        color(hsl(0.15, 0.9, 0.9)); // Yellow windows
        for(let row = 0; row < 4; row++) {
            for(let col = 0; col < 3; col++) {
                if(random.bool(0.7)) {
                    rect(0.25 + col * 0.25, 0.2 + row * 0.2, 0.08, 0.08);
                }
            }
        }
        color(hsl(0.0, 0.0, 0.2)); // Dark entrance
        rect(0.5, 0.9, 0.2, 0.2);
    }

    function drawOfficeBuilding() {
        color(hsl(0.6, 0.2, 0.4)); // Blue-gray office
        rect(0.5, 0.4, 0.8, 0.8);
        color(hsl(0.6, 0.8, 0.8)); // Light blue glass
        for(let row = 0; row < 3; row++) {
            for(let col = 0; col < 4; col++) {
                rect(0.2 + col * 0.15, 0.2 + row * 0.2, 0.1, 0.15);
            }
        }
        color(WHITE);
        rect(0.5, 0.1, 0.6, 0.1);
        color(BLACK);
        text('OFFICE', 0.5, 0.1, 0.08, 0.5, 0);
    }

    function drawShop() {
        color(hsl(0.8, 0.6, 0.6)); // Purple shop
        rect(0.5, 0.6, 0.9, 0.7);
        color(hsl(0.0, 0.0, 0.9)); // White shop window
        rect(0.5, 0.7, 0.6, 0.3);
        color(hsl(0.1, 0.9, 0.5)); // Orange sign
        rect(0.5, 0.4, 0.8, 0.15);
        color(WHITE);
        text('SHOP', 0.5, 0.4, 0.1, 0.7, 0);
        color(hsl(0.08, 0.8, 0.3)); // Brown door
        rect(0.3, 0.85, 0.15, 0.25);
    }

    function drawSkyscraper() {
        color(hsl(0.0, 0.0, 0.3)); // Dark gray skyscraper
        rect(0.5, 0.3, 0.6, 0.6);
        color(hsl(0.15, 0.9, 0.7)); // Yellow windows
        for(let row = 0; row < 8; row++) {
            for(let col = 0; col < 2; col++) {
                if(random.bool(0.8)) {
                    rect(0.35 + col * 0.3, 0.1 + row * 0.08, 0.06, 0.06);
                }
            }
        }
        color(RED);
        rect(0.5, 0.05, 0.02, 0.1);
    }

    function drawWarehouse() {
        color(hsl(0.0, 0.0, 0.5)); // Gray warehouse
        rect(0.5, 0.6, 0.95, 0.8);
        color(hsl(0.08, 0.6, 0.4)); // Brown doors
        rect(0.3, 0.8, 0.25, 0.4);
        rect(0.7, 0.8, 0.25, 0.4);
        color(hsl(0.6, 0.3, 0.7)); // Gray-blue windows
        rect(0.2, 0.4, 0.08, 0.08);
        rect(0.8, 0.4, 0.08, 0.08);
        color(hsl(0.0, 0.0, 0.4)); // Dark loading area
        rect(0.5, 0.9, 0.4, 0.2);
    }

/**
     * Draws traffic cone obstacle
     */
    function drawTrafficCone()
    {
        // Cone base (black)
        color(BLACK);
        rect(0.5, 0.8, 0.6, 0.2);
        
        // Cone body (orange)
        color(hsl(0.08, 1, 0.5)); // Orange
        polygon(3, 0.5, 0.5, 0.35, 0); // Triangle for cone shape
        
        // White reflective stripes
        color(WHITE);
        rect(0.5, 0.4, 0.5, 0.05);
        rect(0.5, 0.6, 0.4, 0.05);
        
        // Cone tip
        color(hsl(0.08, 1, 0.6)); // Lighter orange
        circle(0.5, 0.2, 0.08);
    }
    
    /**
     * Draws pothole obstacle
     */
function drawPothole()
{
    // Bright warning border (high contrast)
    color(YELLOW);
    circle(0.5, 0.5, 0.45);
    
    // Secondary warning ring
    color(hsl(0.08, 1, 0.5)); // Bright orange
    circle(0.5, 0.5, 0.42);
    
    // Pothole outer rim (light gray)
    color(hsl(0, 0, 0.7)); // Very light gray
    circle(0.5, 0.5, 0.38);
    
    // Pothole inner (medium gray for contrast)
    color(hsl(0, 0, 0.3)); 
    circle(0.5, 0.5, 0.3);
    
    // Pothole center (darkest)
    color(hsl(0, 0, 0.1));
    circle(0.5, 0.5, 0.2);
    
    // Bright reflective water puddle effect
    color(hsl(0.55, 0.8, 0.8, 0.7)); // Bright cyan water
    circle(0.45, 0.45, 0.15);
    
    // Enhanced warning markers (larger and brighter)
    color(RED);
    for(let i = 8; i--;) {
        let angle = i/8 * PI * 2;
        let x = 0.5 + Math.cos(angle) * 0.5;
        let y = 0.5 + Math.sin(angle) * 0.5;
        rect(x, y, 0.12, 0.04); // Large red warning strips
    }
    
    // Flashing effect simulation (alternating bright spots)
    color(WHITE);
    for(let i = 4; i--;) {
        let angle = i/4 * PI * 2 + 0.4;
        let x = 0.5 + Math.cos(angle) * 0.35;
        let y = 0.5 + Math.sin(angle) * 0.35;
        circle(x, y, 0.06); // Bright white highlights
    }
}
    /**
     * Draws road barrier
     */
    function drawBarrier()
    {
        // Barrier base (concrete gray)
        color(hsl(0, 0, 0.7));
        rect(0.5, 0.7, 0.8, 0.4);
        
        // Red and white stripes
        for(let i = 4; i--;) {
            color(i % 2 ? RED : WHITE);
            rect(0.2 + i * 0.15, 0.5, 0.12, 0.6);
        }
        
        // Barrier posts
        color(hsl(0, 0, 0.5));
        rect(0.2, 0.5, 0.08, 0.8);
        rect(0.8, 0.5, 0.08, 0.8);
    }
    
    /**
     * Draws oil spill hazard
     */
    function drawOilSpill()
    {
        // Oil spill (dark, irregular shape)
        color(hsl(0.7, 0.3, 0.1)); // Dark purple-black
        
        // Create irregular oil spill shape
        for(let i = 12; i--;) {
            let angle = i/12 * PI * 2;
            let radius = 0.2 + Math.sin(i) * 0.1;
            let x = 0.5 + Math.cos(angle) * radius;
            let y = 0.5 + Math.sin(angle) * radius;
            circle(x, y, 0.08 + Math.sin(i*2) * 0.03);
        }
        
        // Oil shine effect
        color(hsl(0.7, 0.5, 0.3, 0.5)); // Semi-transparent shine
        circle(0.5, 0.5, 0.15);
    }
}