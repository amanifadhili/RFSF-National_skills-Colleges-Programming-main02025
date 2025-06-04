// Enable strict mode for better error detection and performance
'use strict';


// UI and display settings
showMap = 0;        // Toggle for showing minimap (0 = hidden, 1 = visible)

// Audio and accessibility settings  
speakEnable = 1;    // Enable text-to-speech announcements (0 = disabled, 1 = enabled)
debugInfo = 0;      // Show debug information overlay (0 = hidden, 1 = visible)
soundVolume = .3;   // Master volume level (0.0 to 1.0)


// Engine metadata
const engineVersion = '0.1.0';              // Current version of the game engine
const engineVersionDate = '2023-10-01';     // Release date of current version
const engineName = 'RTB-competition';       // Name identifier for the racing game engine


// hill-specific settings
const hillIntensity = 1.5;      // How steep hills can be (1.0 = normal, 2.0 = very steep)
const hillFrequency = 0.02;     // How often hills occur (0.01 = rare, 0.05 = frequent)

// Game mode settings
const testDrive = 0;        // Enable test drive mode (0 = normal game, 1 = test mode)
const enableTexture = 1;    // Enable texture rendering (0 = disabled, 1 = enabled)
const enableLighting = 1;   // Enable lighting effects (0 = disabled, 1 = enabled)
const pixelate = 0;         // Enable pixel art style (0 = smooth, 1 = pixelated)
const canvasFixedSize = 1;  // Use fixed canvas size (0 = responsive, 1 = fixed)

// Performance settings
const frameRate = 60;       // Target frames per second
const timeDelta = 1/60;     // Time step for physics calculations (1/frameRate)

// ====================================================================
// TRACK AND WORLD CONFIGURATION
// ====================================================================

// Track dimensions and layout
const trackWidth = 1000;            // Width of the racing track in game units
const trackEnd = 1e4;               // Total number of track segments (10,000)
const trackSegmentLength = 100;     // Length of each track segment in game units
const drawDistance = 1e3;           // Number of segments to render ahead (1,000)
const sceneryDrawDistance = 500;    // Distance to render background scenery

// Camera positioning
const cameraPlayerOffset = vec3(0,700,1050);  // Camera offset from player (x, y, z)

// Checkpoint system configuration
const checkpointTrackSegments = 3e3;  // Segments between checkpoints (3,000)
const checkpointDistance = checkpointTrackSegments * trackSegmentLength;  // Distance between checkpoints
const checkpointMaxDifficulty = 9;    // Maximum difficulty level (after 9 checkpoints)
const startCheckpointTime = 60;       // Initial time given to reach first checkpoint (seconds)

// RUNTIME GAME STATE VARIABLES

// Game mode control
let quickStart = 0;     // Skip intro sequence (0 = normal start, 1 = quick start)
let attractMode = 1;    // Attract mode (demo) active (0 = gameplay, 1 = attract mode)

// Display configuration
let mainCanvasSize = pixelate ? vec3(1440, 900) : vec3(1280, 720);  // Canvas resolution
let mainCanvas;         // Main rendering canvas element
let mainContext;        // 2D rendering context for main canvas

// Time and frame management
let time;               // Current game time in seconds
let frame;              // Current frame number
let frameTimeLastMS;    // Previous frame timestamp in milliseconds
let averageFPS;         // Running average of frames per second
let frameTimeBufferMS;  // Time buffer for frame rate smoothing

// Game state timers and counters
let attractVehicleSpawnTimer;  // Timer for spawning vehicles in attract mode
let paused;                    // Game pause state
let checkpointTimeLeft;        // Time remaining to reach next checkpoint
let startCountdown;            // Countdown timer at race start (3, 2, 1, GO!)
let startCountdownTimer;       // Timer object for countdown
let gameOverTimer;             // Timer for game over screen
let nextCheckpointDistance;    // Distance to next checkpoint

// WORLD AND CAMERA VARIABLES

let cameraPos;          // Camera position in 3D space (vec3)
let cameraRot;          // Camera rotation angles (vec3)
let cameraOffset;       // Current camera offset from player
let cameraTrackInfo;    // Information about camera position relative to track

let worldHeading;       // World rotation/heading angle
let mouseControl;       // Mouse control state

// Game objects
let track;              // Track geometry and data
let vehicles;           // Array of all vehicles in the game
let playerVehicle;      // Reference to the player's vehicle

// MAIN GAME INITIALIZATION FUNCTION

function gameInit()
{
    // Override attract mode if quick start is enabled
    if (quickStart)
        attractMode = 0;

    // Initialize subsystems in dependency order
    debug && debugInit();       // Initialize debug system if debug mode is active
    glInit();                   // Initialize WebGL rendering system
    
    // CSS styling for the game interface
    const styleBody = 'background-color:#111;margin:0';  // Dark background, no margins
    const styleCanvas = 'position:absolute;' +           // Absolute positioning
        'top:50%;left:50%;transform:translate(-50%,-50%);' + // Center canvas on screen
        (pixelate?' image-rendering: pixelated':'');      // Pixelated rendering if enabled

    // Apply styles and create main canvas
    document.body.style = styleBody;
    document.body.appendChild(mainCanvas = document.createElement('canvas'));
    mainContext = mainCanvas.getContext('2d');           // Get 2D rendering context
    mainContext.imageSmoothingEnabled = !pixelate;       // Disable smoothing for pixel art
    glContext.imageSmoothingEnabled = !pixelate;         // Disable smoothing for WebGL context
    glCanvas.style.cssText = mainCanvas.style.cssText = styleCanvas;  // Apply CSS to both canvases

    // Initialize game subsystems
    drawInit();         // Initialize drawing/rendering system
    inputInit();        // Initialize input handling (keyboard, mouse, gamepad)
    initSounds();       // Initialize audio system and load sounds
    initGenerative();   // Initialize procedural generation system
    initHUD();          // Initialize heads-up display
    buildTrack();       // Generate the racing track
    gameStart();        // Start the game
    gameUpdate();       // Begin the main game loop
}

// ====================================================================
// GAME START/RESTART FUNCTION
// ====================================================================

function gameStart()
{
    // Reset all game state variables to initial values
    attractVehicleSpawnTimer = time = frame = frameTimeLastMS = averageFPS = frameTimeBufferMS = 
        worldHeading = cameraOffset = checkpointTimeLeft = 0;
    
    // Set up race start sequence
    startCountdown = quickStart ? 0 : 4;       
    checkpointTimeLeft = startCheckpointTime;   
    nextCheckpointDistance = checkpointDistance; 
    
    // Initialize timer objects
    startCountdownTimer = new Timer;
    gameOverTimer = new Timer;
    
    // Reset camera position and rotation
    cameraPos = vec3();  // Initialize to zero vector
    cameraRot = vec3();  // Initialize to zero vector
    
    // Initialize vehicle array and create player vehicle
    vehicles = [];
    playerVehicle = new PlayerVehicle(2e3, hsl(0.3, 0.8, 0.5));  // Create player at position 2000, red color
    vehicles.push(playerVehicle);  // Add player to vehicles array

    // Spawn AI vehicles at intervals along the track
    const aiColors = [
    hsl(0, .8, .5),    // Red
    hsl(.15, .9, .6),  // Orange
    hsl(.3, .7, .5),   // Green
    hsl(.6, .8, .4),   // Blue
    hsl(.8, .6, .4),   // Purple
    hsl(.1, .9, .7),   // Yellow
    hsl(.45, .5, .3),  // Brown
    hsl(0, 0, .3)      // Dark Gray
];
   for(let i = 50; i--;){ // Create 50 AI vehicles
    vehicles.push(new Vehicle(randInt(10e3, 20e3)*i+3e3, aiColors[randInt(aiColors.length)])); // Random 6,000-12,000 units
 // ADD THIS CODE HERE - Reset HUD values when game starts
    if (typeof resetHUDValues === 'function') {
        resetHUDValues();
    }
}}

// ====================================================================
// INTERNAL GAME LOGIC UPDATE FUNCTION
// ====================================================================

function gameUpdateInternal()
{
    if (attractMode)
    {
        // ATTRACT MODE LOGIC (Demo/Title Screen)
        
        // Spawn vehicles periodically for visual interest
        if (vehicles.length < 10 && attractVehicleSpawnTimer-- < 0)
        {
            // Create new vehicle behind player with random color
            vehicles.push(new Vehicle(playerVehicle.pos.z-1e3, hsl(rand(),.8,.5)));
            attractVehicleSpawnTimer = randInt(100,300);  // Random spawn interval
        }
        
        // Check for player input to start game
        if (mouseWasPressed(0))  // Left mouse button clicked
        {
            attractMode = 0;      // Exit attract mode
            sound_start.play();   // Play start sound
            gameStart();          // Restart game
        }
    }
    else
    {
        // ACTIVE GAMEPLAY LOGIC
        
        // Handle race start countdown
        if (startCountdown > 0 && !startCountdownTimer.active())
        {
            --startCountdown;                           // Decrement countdown
            speak(startCountdown || 'PLEASE GO!' );     // Announce countdown or "GO!"
            startCountdownTimer.set(1);                 // Set timer for 1 second
        }
        
        // Handle escape key to return to attract mode
        if (keyWasPressed('Escape'))
        {
            attractMode = 1;      // Enter attract mode
            sound_start.play();   // Play transition sound
            gameStart();          // Restart in attract mode
        }

        // Handle game over screen interactions
        if (gameOverTimer > 1 && mouseWasPressed(0) || gameOverTimer > 9)
        {
            attractMode = 1;      // Return to attract mode
            gameStart();          // Restart game
        }

        // Update checkpoint timer (only during active gameplay)
        if (checkpointTimeLeft > 0 && startCountdown == 0)
        {
            checkpointTimeLeft -= timeDelta;  // Decrease time remaining
            if (checkpointTimeLeft <= 0)      // Time expired
            {
                speak('Challenge failed. press R to restart!');   // Announce game over
                gameOverTimer.set();          // Start game over timer
                checkpointTimeLeft = 0;       // Clamp to zero
            }
        }
        // ADD THIS CODE HERE - Update HUD values and apply difficulty settings
        if (typeof updateHUDValues === 'function') {
            updateHUDValues();
        }
        
        // Get difficulty settings based on level
        if (typeof getDifficultySettings === 'function') {
            const difficulty = getDifficultySettings();

             // Apply difficulty to game systems
            // For example, adjust traffic density for AI vehicle spawning
            if (vehicles.length < 10 + (difficulty.trafficDensity * 10) && 
                Math.random() < difficulty.trafficDensity * 0.01) {
                // Spawn a new AI vehicle ahead of player
                vehicles.push(new Vehicle(playerVehicle.pos.z + randInt(500, 2000), 
                                         hsl(rand(),.8,.5)));
            }
    }
    }
    // Global restart key (works in any mode)
    if (keyWasPressed('KeyR'))
    {
        attractMode = 0;      // Start in gameplay mode
        sound_start.play();   // Play start sound
        gameStart();          // Restart game
    }
    
    // Update all vehicles in the game
    for(const v of vehicles)
        v.update();  // Update vehicle physics, AI, and rendering
}

// ====================================================================
// MAIN GAME UPDATE LOOP
// ====================================================================

function gameUpdate(frameTimeMS=0)  // frameTimeMS provided by requestAnimationFrame
{
    // CANVAS SIZE AND RESOLUTION MANAGEMENT
    
    if (canvasFixedSize)
    {
        // Use predetermined fixed canvas size
        mainCanvas.width  = mainCanvasSize.x;
        mainCanvas.height = mainCanvasSize.y;
    }
    else
    {
        // Responsive canvas sizing based on window size
        mainCanvasSize = vec3(innerWidth, innerHeight);
        if (pixelate)
        {
            const s = 2;                                    // Scale factor for pixelation
            mainCanvasSize.x = mainCanvasSize.x / s | 0;    // Reduce resolution for pixel art
            mainCanvasSize.y = mainCanvasSize.y / s | 0;    // Bitwise OR with 0 for integer conversion
        }

        mainCanvas.width  = mainCanvasSize.x;
        mainCanvas.height = mainCanvasSize.y;
    }
        
    // ASPECT RATIO CORRECTION
    // Maintain proper aspect ratio by adding letterboxing if necessary
    const aspect = innerWidth / innerHeight;               // Current window aspect ratio
    const fixedAspect = mainCanvas.width / mainCanvas.height;  // Canvas aspect ratio
    mainCanvas.style.width  = glCanvas.style.width  = aspect < fixedAspect ? '100%' : '';
    mainCanvas.style.height = glCanvas.style.height = aspect < fixedAspect ? '' : '100%';

    // FRAME TIMING AND RATE MANAGEMENT
    
    // Calculate time since last frame
    let frameTimeDeltaMS = frameTimeMS - frameTimeLastMS;
    frameTimeLastMS = frameTimeMS;
    
    // Debug speed controls (only in debug mode)
    const debugSpeedUp   = debug && keyIsDown('Equal'); // + key speeds up time
    const debugSpeedDown = debug && keyIsDown('Minus'); // - key slows down time
    if (debug) // Apply speed modification for debugging
        frameTimeDeltaMS *= debugSpeedUp ? 5 : debugSpeedDown ? .2 : 1;
    
    // Calculate running average FPS for display
    averageFPS = lerp(.05, averageFPS, 1e3/(frameTimeDeltaMS||1));
    
    // Accumulate frame time, but clamp to prevent spiral of death
    frameTimeBufferMS += paused ? 0 : frameTimeDeltaMS;
    frameTimeBufferMS = min(frameTimeBufferMS, 50); // Max 50ms to prevent catch-up spiral

    // FRAME RATE SMOOTHING
    // Apply time delta smoothing to improve visual smoothness
    let deltaSmooth = 0;
    if (frameTimeBufferMS < 0 && frameTimeBufferMS > -9)
    {
        // Force update if time is close (handles high refresh rate monitors)
        deltaSmooth = frameTimeBufferMS;
        frameTimeBufferMS = 0;
    }
    
    // FIXED TIMESTEP GAME LOGIC
    // Update game logic at fixed intervals regardless of display framerate
    inputUpdate();  // Update input state before game logic
    for (;frameTimeBufferMS >= 0; frameTimeBufferMS -= 1e3 / frameRate)
    {
        // Increment frame counter and calculate current game time
        time = frame++ / frameRate;  // Convert frame count to seconds
        gameUpdateInternal();        // Run one frame of game logic
    }

    // Restore smoothing time for next frame
    frameTimeBufferMS += deltaSmooth;

    // RENDERING PIPELINE
    trackPreRender();   // Prepare track geometry for rendering
    glPreRender();      // Set up WebGL state for 3D rendering
    drawScene();        // Render the 3D game world
    drawHUD();          // Render user interface elements
    drawDebug();        // Render debug information (if enabled)
    inputUpdatePost();  // Clean up input state after frame
    
    // Schedule next frame
    requestAnimationFrame(gameUpdate);  // Request next animation frame from browser
}

// ====================================================================
// START THE GAME
// ====================================================================

gameInit();  // Initialize and start the game when script loads