'use strict';

// Global variables for HUD management
let HUDButtons = [];
// let radioMusic = -1;
// let radioBoxAnimation = 0;
let playerScore = 0;
let playerDistance = 0;
let currentLevel = 1;
let scoreMultiplier = 1;
// global variables for level transition
let levelTransitionTimer = 0;
let levelTransitionActive = false;
let levelMessages = [
    "ROOKIE DRIVER",
    "INTERMEDIATE DRIVER",
    "EXPERT DRIVER",
    "MAGICAL GARDEN"
];
let bonusMessages = [];
// Add win state and timer
let gameWon = false;
let winTimer = 0;
const WIN_DELAY = 5; // 5 seconds delay before stopping the game
// Initialize HUD elements with modern design

const MINIMAP = {
    x: 30,           // Distance from left edge
    y: null,         // Will be calculated for bottom position
    radius: 80,      // Circle radius instead of width/height
    scale: 0.1       // Scale factor
};


function initHUD()
{
  console.log("Initializing HUD...");
}

// Main HUD rendering function
function drawHUD() {
    // Attract mode title screen
    if (attractMode) {
        welcomeScreen();
        controlMenu();
        return;
    }
    
    // Game countdown display
    if (startCountdownTimer.active() || startCountdown > 0) {
        if (startCountdown < 4) {
            let a = 1 - time % 1;
            let t = startCountdown | 0;
            
            if (startCountdown == 0 && startCountdownTimer.active())
                t = 'GO!';
            
            // Enhanced countdown styling with unique colors
            let colors = [hsl(.3, .9, .7), hsl(.15, .9, .7), hsl(.6, .9, .7), hsl(.0, .9, .7)]; // Green, Orange, Blue, Red
            let c = colors[startCountdown].copy();
            c.a = a;
            
            // Animated background circle that pulses
            let circleSize = .3 + (1 - a) * .2 + Math.sin(time * 6) * .02;
            let circleColor = colors[startCountdown].copy();
            circleColor.a = .2 * a;
            drawHUDRect(vec3(.5, .5), vec3(circleSize, circleSize), circleColor, .01, c);
            
            // Main countdown text with dramatic scaling
            let textSize = .35 + (1 - a) * .15 + Math.sin(time * 8) * .01;
            drawHUDText(t, vec3(.5, .5), textSize, c, .012, BLACK, undefined, 'center', 900, undefined, undefined, 0);
        }
    }

    updateHUDValues();
    
    // Update level transition
    updateLevelTransition();
    
    // Update bonus messages
    updateBonusMessages();
    
    // speed display in top-right
    const mph = playerVehicle.velocity.z | 0;
    const aspect = mainCanvasSize.x / mainCanvasSize.y;

    if (aspect > .75) {
        // Speed background panel - UPDATED SIZE
        drawHUDRect(vec3(.85, .08), vec3(.20, .10), hsl(.0, .8, .2, .8), .003, hsl(.0, .8, .6));
        
        // Speed text with glow effect
        drawHUDText('SPEED', vec3(.85, .055), .025, hsl(.0, .8, .8), .002, BLACK, undefined, 'center', 300);
        drawHUDText(mph + ' KPH', vec3(.85, .095), .045, hsl(.0, .9, .9), .003, hsl(.0, .8, .3), undefined, 'center', 700, 'italic');
    }

    // score, distance, and level:
    if (!attractMode) {
        // Create a unified stats panel in the top-left
        const panelWidth = .45;
        const panelHeight = .22;
        const panelX = .18;
        const panelY = .15;
        
        // Main panel background with gradient-like effect
        drawHUDRect(vec3(panelX, panelY), vec3(panelWidth, panelHeight), 
                    hsl(.6, .4, .15, .85), .004, hsl(.6, .6, .4));
        
        // Panel header
        drawHUDRect(vec3(panelX, panelY - panelHeight * 0.38), 
                    vec3(panelWidth, .04), hsl(.6, .5, .25, .9), 0);
        drawHUDText('DRIVER STATS', vec3(panelX, panelY - panelHeight * 0.38), 
                    .03, hsl(.6, .2, .9), .002, BLACK, undefined, 'center', 700);
        
        // Decorative corner accents
        for(let i = 4; i--;) {
            let cornerX = panelX - panelWidth * 0.45 + (i % 2) * panelWidth * 0.9;
            let cornerY = panelY - panelHeight * 0.45 + Math.floor(i/2) * panelHeight * 0.9;
            let cornerColor = hsl(.6, .6, .5, .6);
            
            // L-shaped corner accents
            drawHUDRect(vec3(cornerX, cornerY), vec3(.02, .002), cornerColor, 0);
            drawHUDRect(vec3(cornerX, cornerY), vec3(.002, .02), cornerColor, 0);
        }
        
        // Score section with icon and value
        const scoreY = panelY - panelHeight * 0.2;
        drawHUDText('⭐', vec3(panelX - panelWidth * 0.35, scoreY), 
                    .035, hsl(.15, .9, .7), 0, undefined, undefined, 'center', 400);
        drawHUDText('SCORE', vec3(panelX - panelWidth * 0.15, scoreY), 
                    .025, hsl(.15, .7, .8), .001, BLACK, undefined, 'left', 500);
        drawHUDText(Math.floor(playerScore).toLocaleString(), vec3(panelX + panelWidth * 0.50, scoreY), 
                    .035, hsl(.15, .9, .9), .002, hsl(.15, .8, .2, .5), undefined, 'right', 700);
        
        // Horizontal separator
        drawHUDRect(vec3(panelX, panelY), 
                    vec3(panelWidth - .04, .001), hsl(.6, .3, .6, .4), 0);
        
        // Distance section with icon and value
        const distanceY = panelY + panelHeight * 0.1;
        drawHUDText('🏁', vec3(panelX - panelWidth * 0.35, distanceY), 
                    .035, hsl(.6, .9, .7), 0, undefined, undefined, 'center', 400);
        drawHUDText('DISTANCE', vec3(panelX - panelWidth * 0.15, distanceY), 
                    .025, hsl(.6, .7, .8), .001, BLACK, undefined, 'left', 500);
        
        // Animate distance counter for a more dynamic feel
        const displayDistance = Math.floor(playerDistance);
        const distanceText = displayDistance.toLocaleString() + 'm';
        drawHUDText(distanceText, vec3(panelX + panelWidth * 0.5, distanceY), 
                    .035, hsl(.6, .9, .9), .002, hsl(.6, .8, .2, .5), undefined, 'right', 700);
        
        // Horizontal separator
        drawHUDRect(vec3(panelX, panelY + panelHeight * 0.2), 
                    vec3(panelWidth - .04, .001), hsl(.6, .3, .6, .4), 0);
        
        // Level section with icon and value
        const levelY = panelY + panelHeight * 0.3;
        drawHUDText('🏆', vec3(panelX - panelWidth * 0.35, levelY), 
                    .035, hsl(.3, .9, .7), 0, undefined, undefined, 'center', 400);
        drawHUDText('LEVEL', vec3(panelX - panelWidth * 0.15, levelY), 
                    .025, hsl(.3, .7, .8), .001, BLACK, undefined, 'left', 500);
        
        // Add a subtle pulse effect to the level number
        const levelPulse = Math.sin(time * 3) * .005;
        const levelSize = .04 + levelPulse;
        drawHUDText(currentLevel.toString(), vec3(panelX + panelWidth * 0.50, levelY), 
                    levelSize, hsl(.3, .9, .9), .002, hsl(.3, .8, .2, .5), undefined, 'right', 800);
        
        // Level progress bar
        const currentLevelStart = Object.values(levelDistances)
            .slice(0, currentLevel - 1)
            .reduce((sum, dist) => sum + dist, 0);
        const currentLevelEnd = currentLevelStart + levelDistances[currentLevel];
        const levelProgress = (playerDistance - currentLevelStart) / levelDistances[currentLevel];
        
        // Progress bar background
        drawHUDRect(vec3(panelX, panelY + panelHeight * 0.4), 
                    vec3(panelWidth - .04, .015), hsl(.3, .2, .2, .6), .001, hsl(.3, .3, .4, .4));
        
        // Progress bar fill with level-specific color
        const levelColors = [
            hsl(.15, .8, .5),  // Level 1: Orange
            hsl(.3, .8, .5),   // Level 2: Green
            hsl(.6, .8, .5),   // Level 3: Blue
            hsl(.8, .8, .5)    // Magic Garden: Purple
        ];
        
        // Calculate alpha with pulse effect
        const alpha = .8 + Math.sin(time * 4) * .2;
        
        drawHUDRect(vec3(panelX - (panelWidth - .04) * (0.5 - levelProgress/2), panelY + panelHeight * 0.4), 
                    vec3((panelWidth - .04) * levelProgress, .015), 
                    hsl(levelColors[currentLevel - 1].h, levelColors[currentLevel - 1].s, levelColors[currentLevel - 1].l, alpha), 0);
        
        // Add distance text below progress bar
        const progressText = `${Math.floor(playerDistance - currentLevelStart)}/${levelDistances[currentLevel]}m`;
        drawHUDText(progressText, vec3(panelX, panelY + panelHeight * 0.45), 
                    .02, hsl(.3, .7, .8), .001, BLACK, undefined, 'center', 500);
    }
    
    drawLevelTransition();
    drawBonusMessages();

    // Add win message overlay if game is won
    if (gameWon) {
        const winColor = hsl(.8, .8, .7);  // Magical purple color
        drawHUDRect(vec3(.5, .5), vec3(.8, .4), hsl(.8, .3, .1, .9), .01, winColor);
        drawHUDText("CONGRATULATIONS!", vec3(.5, .4), .1, winColor, .005, BLACK, undefined, 'center', 900);
        drawHUDText("You've reached the Magical Garden!", vec3(.5, .5), .05, winColor, .003, BLACK, undefined, 'center', 700);
        if (winTimer > 0) {
            drawHUDText(`Game will end in ${Math.ceil(winTimer)} seconds...`, vec3(.5, .6), .04, winColor, .002, BLACK, undefined, 'center', 500);
        }
    }
}
function welcomeScreen()
{
      // Centered container panel
    const containerCenter = vec3(0.5, .5);
    const containerSize = vec3(.7, .7);
    const containerGlow = .15 + Math.sin(time * 2) * .05;

    // Draw container background with glow and border
    drawHUDRect(containerCenter, containerSize, hsl(.6, .2, .12, .92), .008, hsl(.15, .7, .5, .7 + containerGlow));
    // Subtle inner glow
    drawHUDRect(containerCenter, containerSize.scale(.98), hsl(.15, .5, .2, .15 + containerGlow), 0);

    // All elements are now relative to containerCenter
    let bannerY = containerCenter.y - containerSize.y * 0.38 + Math.sin(time * 2) * .02;
    let bannerPulse = .8 + Math.sin(time * 3) * .2;

    // Banner background
    drawHUDRect(vec3(containerCenter.x, bannerY), vec3(containerSize.x * .95, .08), 
                hsl(.15, .6, .2, .7), .003, 
                hsl(.15, .8, .5, bannerPulse * .8));
    // Banner text
    drawHUDText('RTB COMPETITION FUTURE SKILLS', vec3(containerCenter.x, bannerY), 
                .04, hsl(.15, .9, .9), .003, 
                hsl(.15, .6, .3, .8), undefined, 'center', 800, 'italic');
    // Side decorations
    for(let i = 2; i--;) {
        let sideX = containerCenter.x - containerSize.x * 0.45 + i * containerSize.x * 0.9;
        let sideGlow = Math.sin(time * 4 + i * Math.PI) * .3 + .7;
        drawHUDRect(vec3(sideX, bannerY), vec3(.03, .003), 
                    hsl(.15, .8, .6, sideGlow), 0);
    }

    // Main title
    let titleY = containerCenter.y - containerSize.y * 0.13;
    let titleGlow = .7 + Math.sin(time * 3) * .2;
    drawHUDRect(vec3(containerCenter.x, titleY), vec3(containerSize.x * .85, .12), 
                hsl(.3, .4, .2, .4), 0);
    drawHUDText('KIGALI-2025', vec3(containerCenter.x, titleY), 
                .08, hsl(.3, .9, titleGlow), 
                .004, hsl(.3, .6, .2, .6), 
                undefined, 'center', 700, 'italic');
    // Scan lines
    for(let i = 3; i--;) {
        let scanY = titleY - .04 + i * .03 + Math.sin(time * 8 + i) * .01;
        let scanAlpha = Math.sin(time * 6 + i * 2) * .2 + .3;
        drawHUDRect(vec3(containerCenter.x, scanY), vec3(containerSize.x * .75, .002), 
                    hsl(.3, .5, .8, scanAlpha), 0);
    }

    // Subtitle
    let subtitleAlpha = .6 + Math.sin(time * 1.5) * .2;
    let subtitleY = containerCenter.y + containerSize.y * 0.05;
    drawHUDText('DRIVING SIMULATION CHALLENGE', vec3(containerCenter.x, subtitleY), 
                .035, hsl(.3, .6, .8, subtitleAlpha), 
                .002, BLACK, undefined, 'center', 400);

    // "Click to Play"
    let clickY = containerCenter.y + containerSize.y * 0.22;
    let clickPulse = Math.sin(time * 2.5) * .02;
    let clickAlpha = .7 + Math.sin(time * 2) * .3;
    let clickColor = hsl(.1, 1, clickAlpha + clickPulse);
    drawHUDRect(vec3(containerCenter.x, clickY), vec3(containerSize.x * .45, .06), 
                hsl(.1, .6, .2, clickAlpha * .5), .002, 
                hsl(.1, .8, .5, clickAlpha * .8));
    drawHUDText('Click to Play', vec3(containerCenter.x, clickY), 
                .05 + clickPulse, clickColor, 
                .004, BLACK, undefined, 'center', 800, 'italic');

    // Animated background elements (stars/particles) inside container
    for(let i = 12; i--;) {
        let starX = containerCenter.x - containerSize.x * 0.45 + (i * containerSize.x * 0.07) + Math.sin(time + i * 2) * .03;
        let starY = containerCenter.y + containerSize.y * 0.32 + Math.sin(time * .8 + i) * .15;
        let starSize = .006 + Math.sin(time * 5 + i) * .003;
        let starAlpha = Math.sin(time * 3 + i * 1.5) * .4 + .6;
        let starColor = hsl(.15 + i * .05, .8, .7, starAlpha);
        drawHUDRect(vec3(starX, starY), vec3(starSize * 2, starSize * 2), 
                    hsl(.15 + i * .05, .6, .4, starAlpha * .3), 0);
        drawHUDRect(vec3(starX, starY), vec3(starSize, starSize), 
                    starColor, 0);
    }

    // Retro corner decorations (inside container)
    for(let i = 4; i--;) {
        let cornerX = containerCenter.x - containerSize.x * 0.45 + (i % 2) * containerSize.x * 0.9;
        let cornerY = containerCenter.y - containerSize.y * 0.45 + Math.floor(i/2) * containerSize.y * 0.9;
        let cornerPulse = Math.sin(time * 4 + i) * .3 + .7;
        let cornerColor = hsl(.15, .7, .5, cornerPulse * .6);
        drawHUDRect(vec3(cornerX, cornerY), vec3(.025, .003), cornerColor, 0);
        drawHUDRect(vec3(cornerX, cornerY), vec3(.003, .025), cornerColor, 0);
        drawHUDRect(vec3(cornerX, cornerY + .02), vec3(.025, .003), cornerColor, 0);
        drawHUDRect(vec3(cornerX + .022, cornerY), vec3(.003, .025), cornerColor, 0);
    }

}
function controlMenu() {   

     // Controls panel (keeping your existing controls code but repositioned)
        const controls = [
            { icon: '↑', key: 'W', desc: 'ACCELERATE' },
            { icon: '↓', key: 'S', desc: 'BRAKE' },
            { icon: '←', key: 'A', desc: 'TURN LEFT' },
            { icon: '→', key: 'D', desc: 'TURN RIGHT' },
            { icon: '⎋', key: 'ESC', desc: 'MENU' },
            { icon: '🔄', key: 'R', desc: 'RESTART' }
        ];
        
        // Controls panel positioned at bottom right
        const controlsPanelX = .29;
        const controlsPanelY = .43;
        const controlsPanelWidth = .42;
        const controlsPanelHeight = .35;
        
        // Main controls panel with retro styling
        drawHUDRect(vec3(controlsPanelX, controlsPanelY), 
                    vec3(controlsPanelWidth, controlsPanelHeight), 
                    hsl(.6, .3, .1, .8), .003, 
                    hsl(.6, .5, .3, .7 + Math.sin(time * 2) * .2));
        
        // Controls header
        drawHUDRect(vec3(controlsPanelX, controlsPanelY - controlsPanelHeight * 0.42), 
                    vec3(controlsPanelWidth, .04), 
                    hsl(.6, .4, .2, .9), 0);
        drawHUDText('CONTROLS', vec3(controlsPanelX, controlsPanelY - controlsPanelHeight * 0.42), 
                    .028, hsl(.6, .2, .9), .002, BLACK, undefined, 'center', 700);
        
        // Draw each control with retro styling
        for(let i = 0; i < controls.length; i++) {
            const control = controls[i];
            const controlY = controlsPanelY - controlsPanelHeight * 0.25 + (i * .045);
            
            // Control icon
            drawHUDText(control.icon, vec3(controlsPanelX - controlsPanelWidth * 0.35, controlY), 
                        .025, hsl(.15, .8, .8), 0, undefined, undefined, 'center', 400);
            
            // Key binding with glow
            drawHUDRect(vec3(controlsPanelX - controlsPanelWidth * 0.15, controlY), 
                        vec3(.03, .025), hsl(.15, .6, .2, .8), .001, 
                        hsl(.15, .8, .4 + Math.sin(time * 3 + i) * .2));
            drawHUDText(control.key, vec3(controlsPanelX - controlsPanelWidth * 0.15, controlY), 
                        .02, hsl(.15, .9, .9), 0, undefined, undefined, 'center', 600);
            
            // Description
            drawHUDText(control.desc, vec3(controlsPanelX + controlsPanelWidth * 0.15, controlY), 
                        .02, hsl(.6, .7, .8), .001, BLACK, undefined, 'left', 400);
        }
 }



// Adjust UI positioning for different screen aspect ratios
function HUDstickToSides(pos)
{
    pos = pos.copy();
    
    if (pos.x < .5) {
        pos.x = pos.x * mainCanvasSize.y / mainCanvasSize.x;
    } else {
        pos.x = 1 - (1 - pos.x) * mainCanvasSize.y / mainCanvasSize.x;
    }
    return pos;
}

// Draw rectangular UI element with enhanced styling
function drawHUDRect(pos, size, color = WHITE, lineWidth = 0, lineColor = BLACK)
{
    pos = HUDstickToSides(pos);
    
    lineWidth *= mainCanvasSize.y;
    size = size.scale(mainCanvasSize.y);
    pos = pos.multiply(mainCanvasSize).subtract(size.scale(.5));
    
    const context = mainContext;
    context.fillStyle = color;
    context.strokeStyle = lineColor;
    context.lineWidth = lineWidth;
    
    context.fillRect(pos.x, pos.y, size.x, size.y);
    lineWidth && context.strokeRect(pos.x, pos.y, size.x, size.y);
}

// Draw text with extensive customization
function drawHUDText(text, pos, size = .1, color = WHITE, shadowOffset = 0, shadowColor = BLACK, font = 'arial', textAlign = 'center', weight = 400, style = '', width, stickToSides = 1)
{
    if (stickToSides)
        pos = HUDstickToSides(pos);
    
    size *= mainCanvasSize.y;
    if (width)
        width *= mainCanvasSize.y;
    shadowOffset *= mainCanvasSize.y;
    pos = pos.multiply(mainCanvasSize);
    
    const context = mainContext;
    context.font = style + ' ' + weight + ' ' + size + 'px ' + font;
    context.textBaseline = 'middle';
    context.textAlign = textAlign;
    
    // Enhanced shadow effect
    if (shadowOffset) {
        let c = shadowColor.copy();
        c.a = color.a;
        context.fillStyle = c;
        context.fillText(text, pos.x + shadowOffset, pos.y + shadowOffset, width);
    }
    
    context.fillStyle = color;
    context.fillText(text, pos.x, pos.y, width);
}
// function to hud.js
function updateHUDValues() {
    if (attractMode ) return;
    
    // Update distance based on player position (convert to meters) - SLOWED DOWN
    if (playerVehicle) {
        // Slow down distance calculation - divide by 200 instead of 100
        const startingPosition = 2000; 
        playerDistance = Math.floor((playerVehicle.pos.z - startingPosition) / 200); // Changed from 100 to 200
        
        // Ensure distance is never negative
        playerDistance = Math.max(0, playerDistance);
        
        // SLOWER SCORING SYSTEM
        const speed = playerVehicle.velocity.z;
        const minSpeedForScore = 30;  // Minimum speed to earn points
        
        // Only award points if moving at decent speed
        if (speed > minSpeedForScore) {
            // Reduced base score multiplier (much slower scoring)
            let speedMultiplier = Math.pow(speed / 100, 1.2); // Reduced from 1.5 to 1.2
            
            // Reduced speed tier bonuses
            if (speed > 150) speedMultiplier *= 1.3;      // Reduced from 2.0 to 1.3
            else if (speed > 120) speedMultiplier *= 1.2; // Reduced from 1.5 to 1.2
            else if (speed > 80) speedMultiplier *= 1.1;  // Reduced from 1.2 to 1.1
            
            // Level difficulty modifier
            const levelMultiplier = 1 + (currentLevel - 1) * 0.2; // Reduced from 0.3 to 0.2
            
            // Much slower time-based scoring
            const frameScore = speedMultiplier * levelMultiplier * 0.03; // Reduced from 0.1 to 0.03
            
            playerScore += frameScore;
        }
        
        // PENALTY SYSTEM (keep penalties to make it challenging)
        if (speed < minSpeedForScore && speed > 5) {
            playerScore = Math.max(0, playerScore - 0.2); // Reduced penalty from 0.5 to 0.2
        }
        
        if (playerVehicle.offRoad) {
            playerScore = Math.max(0, playerScore - 0.5); // Reduced penalty from 1.0 to 0.5
        }
        
        // Check for level progression
        checkLevelProgression();
    }
    
    // Check for distance milestones
    checkDistanceMilestones();

    // Update win timer if game is won
    if (gameWon && winTimer > 0) {
        winTimer -= timeDelta;
        if (winTimer <= 0) {
            // Stop the game after delay
            attractMode = 1;
        }
    }
}



// Replace the checkLevelProgression function
function checkLevelProgression() {
    const totalDistance = Object.values(levelDistances).reduce((sum, dist) => sum + dist, 0);
    
    // Check for win condition (reaching magical garden)
    if (currentLevel === 3 && playerDistance >= levelDistances[1] + levelDistances[2] + levelDistances[3]) {
        if (!gameWon) {
            gameWon = true;
            currentLevel = 4;  // Set to magical garden level
            startLevelTransition();
            // Show congratulatory message
            addBonus(10000, "CONGRATULATIONS! You've reached the Magical Garden!", vec3(0.5, 0.5));
            // Start win timer
            winTimer = WIN_DELAY;
        }
        return;
    }
    
    // Normal level progression
    if (currentLevel < 3) {  // Only progress through levels 1-3
        const levelStart = Object.values(levelDistances)
            .slice(0, currentLevel - 1)
            .reduce((sum, dist) => sum + dist, 0);
        const levelEnd = levelStart + levelDistances[currentLevel];
        
        if (playerDistance >= levelEnd) {
            levelUp(currentLevel + 1);
        }
    }
}

// function to handle level up
function levelUp(newLevel) {
    // Store previous level
    const oldLevel = currentLevel;
    
    // Update level
    currentLevel = newLevel;
    

    
    // Trigger level transition animation
    startLevelTransition();
}

// function to start level transition
function startLevelTransition() {
    levelTransitionActive = true;
    levelTransitionTimer = 3; // 3 seconds transition
}
//  function to update level transition
function updateLevelTransition() {
    if (levelTransitionActive) {
        levelTransitionTimer -= 1/60; // Assuming 60fps
        
        if (levelTransitionTimer <= 0) {
            levelTransitionActive = false;
        }
    }
}
//  function to draw level transition
function drawLevelTransition() {
    if (!levelTransitionActive) return;
    
    // Calculate alpha for fade in/out
    let alpha;
    if (levelTransitionTimer > 2.5) {
        // Fade in
        alpha = (3 - levelTransitionTimer) * 2;
    } else if (levelTransitionTimer > 0.5) {
        // Hold
        alpha = 1;
    } else {
        // Fade out
        alpha = levelTransitionTimer * 2;
    }

    // Draw level number
    let levelColor = hsl(.15, .8, .6, alpha);
    drawHUDText(`LEVEL ${currentLevel}`, vec3(.5, .4), .1, levelColor, .008, BLACK, undefined, 'center', 900, 'italic');
    
    // Draw level message
    let messageIndex = Math.min(currentLevel - 1, levelMessages.length - 1);
    let messageColor = hsl(.15, .7, .7, alpha);
    drawHUDText(levelMessages[messageIndex], vec3(.5, .5), .05, messageColor, .004, BLACK, undefined, 'center', 700);
}
function addBonus(points, message, position) {
    // points to score
    playerScore += points;
    
    // Create bonus message
    bonusMessages.push({
        message: message,
        points: points,
        pos: position || vec3(.5, .5),
        timeLeft: 2, // 2 seconds display time
        alpha: 1
    });
    
    // Play bonus sound
    sound_click.play(1, 1.5); // Higher pitch for bonus
}
//  function to update bonus messages
function updateBonusMessages() {
    for (let i = bonusMessages.length - 1; i >= 0; i--) {
        const msg = bonusMessages[i];
        msg.timeLeft -= 1/60; // Assuming 60fps
        
        if (msg.timeLeft <= 0) {
            bonusMessages.splice(i, 1);
        } else {
            // Fade out in the last second
            if (msg.timeLeft < 1) {
                msg.alpha = msg.timeLeft;
            }
            
            // Move message upward
            msg.pos.y -= 0.002;
        }
    }
}

//  function to draw bonus messages
// Replace the drawBonusMessages function with this improved version
function drawBonusMessages() {
    for (const msg of bonusMessages) {
        let color = hsl(.15, .9, .7, msg.alpha);
        
        // Improved shadow with better positioning and color
        let shadowColor = hsl(0, 0, 0, msg.alpha * 0.8); // Darker, more opaque shadow
        let shadowOffset = .003; // Consistent shadow offset
        
        // Draw shadow first (behind the text)
        drawHUDText(msg.message, 
                   vec3(msg.pos.x + shadowOffset, msg.pos.y + shadowOffset), 
                   .05, shadowColor, 0, undefined, undefined, 'center', 700);
        
        // Draw main text with better contrast
        drawHUDText(msg.message, msg.pos, .05, color, 0, undefined, undefined, 'center', 700);
        
        // Optional: Add a subtle glow effect for better visibility
        if (msg.alpha > 0.5) {
            let glowColor = hsl(.15, .6, .9, msg.alpha * 0.3);
            drawHUDText(msg.message, msg.pos, .052, glowColor, 0, undefined, undefined, 'center', 700);
        }
    }
}


//function to reset HUD values
function resetHUDValues() {
    playerScore = 0;
    playerDistance = 0;
    currentLevel = 1;
    scoreMultiplier = 1;
    bonusMessages = [];
    levelTransitionActive = false;
}
//  function to get difficulty settings based on level
function getDifficultySettings() {
    return {
        trafficDensity: 0.15 + (currentLevel * 0.1),        // More aggressive increase
        obstacleFrequency: 0.08 + (currentLevel * 0.06),    // More obstacles
        maxSpeed: 140 + (currentLevel * 10),                // Slower max speed increase
        aiAggressiveness: 0.5 + (currentLevel * 0.15),      // More aggressive AI
        scoreRequirement: currentLevel * 5000,              // Score needed for next level
        windResistance: 1 + (currentLevel * 0.15),          // Harder to maintain speed
        fuelConsumption: 1 + (currentLevel * 0.2)           // If fuel system exists
    };
}
// Add a performance tracking system
function updatePerformanceMetrics() {
    if (!playerVehicle.performanceMetrics) {
        playerVehicle.performanceMetrics = {
            averageSpeed: 0,
            topSpeed: 0,
            timeAtHighSpeed: 0,
            totalTime: 0,
            crashes: 0
        };
    }
    
    const metrics = playerVehicle.performanceMetrics;
    const currentSpeed = playerVehicle.velocity.z;
    
    // Update metrics
    metrics.totalTime += 1/60; // Assuming 60fps
    metrics.averageSpeed = (metrics.averageSpeed * 0.99) + (currentSpeed * 0.01);
    metrics.topSpeed = Math.max(metrics.topSpeed, currentSpeed);
    
    if (currentSpeed > 120) {
        metrics.timeAtHighSpeed += 1/60;
    }
    
    // Performance bonuses
    if (metrics.timeAtHighSpeed > 10 && metrics.timeAtHighSpeed % 10 < 1/60) {
        const bonus = Math.floor(metrics.averageSpeed * 50);
        addBonus(bonus, "HIGH SPEED MASTER", vec3(.5, .4));
    }
}

// Modify checkDistanceMilestones for new level distances
function checkDistanceMilestones() {
    // Check for distance milestones every 100m
    if (playerDistance % 100 === 0 && playerDistance > 0) {
        const currentSpeed = playerVehicle.velocity.z;
        
        if (currentSpeed > 50) {
            // Base bonus increases with level
            const baseBonus = 200 * currentLevel;
            
            // Speed bonus for milestones
            const speedBonus = currentSpeed > 120 ? baseBonus * 1.5 : 
                              currentSpeed > 80 ? baseBonus * 1.2 : baseBonus;
            
            // Special milestone message for magic garden
            const message = currentLevel === 4 ? 
                `${playerDistance}m MAGIC GARDEN` : 
                `${playerDistance}m MILESTONE`;
            
            addBonus(Math.floor(speedBonus), message, vec3(.5, .4));
        } else {
            addBonus(0, `${playerDistance}m (TOO SLOW)`, vec3(.5, .4));
        }
    }
}

// Calculate bottom position
function getMiniMapY(canvas) {
    return canvas.height - MINIMAP.radius - 85; // 30px from bottom
}


// Draw a car on the mini-map
function drawCarOnMiniMap(ctx, car, color, isPlayer) {
    // Convert world coordinates to mini-map coordinates
    let mapX = MINIMAP.x + (car.x * MINIMAP.scale) + MINIMAP.width / 2;
    let mapY = MINIMAP.y + (car.y * MINIMAP.scale) + MINIMAP.height / 2;
    
    // Keep within mini-map bounds
    mapX = Math.max(MINIMAP.x, Math.min(mapX, MINIMAP.x + MINIMAP.width));
    mapY = Math.max(MINIMAP.y, Math.min(mapY, MINIMAP.y + MINIMAP.height));
    
    // Draw car dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(mapX, mapY, isPlayer ? 4 : 3, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add direction indicator for player
    if (isPlayer) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mapX, mapY);
        ctx.lineTo(
            mapX + Math.cos(car.angle) * 8,
            mapY + Math.sin(car.angle) * 8
        );
        ctx.stroke();
    }
}




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

    // Draw circular background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, MINIMAP.radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw circular border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, MINIMAP.radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw the track line using projected coordinates
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 2; // Thicker line for visibility
    ctx.beginPath();

    if (track && track.length > 0) {
        let p = vec3(); // Projected position
        let direction = vec3(0, -0.5); // Initial direction for projection
        let velocity = 0; // Accumulated curvature effect

        // Iterate through segments, starting from a bit before the player
        const startSegmentIndex = Math.max(0, (playerCar.pos.z / trackSegmentLength | 0) - 50);
        const endSegmentIndex = Math.min(track.length, startSegmentIndex + 200); // Draw a fixed number of segments

        // Move to the starting point
        let firstSegment = track[startSegmentIndex];
        velocity += firstSegment.offset.x;
        p = p.add(direction.rotateZ(velocity * 0.005).scale(MINIMAP.scale * 20)); // Scale the projection
        ctx.moveTo(centerX + p.x, centerY + p.y);

        // Draw lines for subsequent segments
        for (let i = startSegmentIndex + 1; i < endSegmentIndex; i++) {
            const segment = track[i];
            velocity += segment.offset.x;
            p = p.add(direction.rotateZ(velocity * 0.005).scale(MINIMAP.scale * 20)); // Scale the projection
            ctx.lineTo(centerX + p.x, centerY + p.y);
        }
    }

    ctx.stroke();

    // Draw player car (red dot)
    // Need to calculate player car's projected position similarly to the track
    let playerProjectedPos = vec3();
    let playerDirection = vec3(0, -0.5);
    let playerVelocity = 0;
    const playerSegmentIndex = (playerCar.pos.z / trackSegmentLength | 0);

    // Accumulate velocity up to player's segment (simplified)
    for(let i = 0; i <= playerSegmentIndex; i++) {
        if (track[i]) {
           playerVelocity += track[i].offset.x;
        }
    }
     // Use a fixed number of segments before the player to calculate the starting point for player projection
    const playerProjStartSegment = Math.max(0, playerSegmentIndex - 50);
    let pCar = vec3();
    let vCar = 0;

    for(let i = playerProjStartSegment; i <= playerSegmentIndex; i++){
        if (track[i]){
            vCar += track[i].offset.x;
            pCar = pCar.add(playerDirection.rotateZ(vCar * 0.005).scale(MINIMAP.scale * 20));
        }
    }

    // Adjust player position on the projected track line
    // This is a simplified approach; a more accurate method might involve finding the closest point on the drawn track line
    const playerMapX = centerX + pCar.x + (playerCar.pos.x * MINIMAP.scale * 0.5); // Add lateral position scaled
    const playerMapY = centerY + pCar.y;


    drawCarOnCircularMiniMap(ctx, playerMapX, playerMapY, {
        x: 0, // Car's lateral position is handled by playerMapX
        y: 0, // Car's forward position is handled by playerMapY
        angle: playerCar.turn // Still use car's angle for direction indicator
    }, 'red', true);

    // Draw other cars (blue dots) - This will also need adjustment based on the new track projection
    if (otherCars) {
        otherCars.forEach(car => {
             // Similar projection for AI cars
            let aiProjectedPos = vec3();
            let aiDirection = vec3(0, -0.5);
            let aiVelocity = 0;
            const aiSegmentIndex = (car.pos.z / trackSegmentLength | 0);

             // Use a fixed number of segments before the AI car to calculate the starting point
            const aiProjStartSegment = Math.max(0, aiSegmentIndex - 50);
            let pAI = vec3();
            let vAI = 0;

            for(let i = aiProjStartSegment; i <= aiSegmentIndex; i++){
                 if (track[i]){
                    vAI += track[i].offset.x;
                    pAI = pAI.add(aiDirection.rotateZ(vAI * 0.005).scale(MINIMAP.scale * 20));
                 }
            }

            const aiMapX = centerX + pAI.x + (car.pos.x * MINIMAP.scale * 0.5); // Add lateral position scaled
            const aiMapY = centerY + pAI.y;

            if (!car.isPlayer) {
                drawCarOnCircularMiniMap(ctx, aiMapX, aiMapY, {
                    x: 0, // Lateral position handled by aiMapX
                    y: 0, // Forward position handled by aiMapY
                    angle: car.turn // Still use car's angle for direction indicator
                }, 'blue', false);
            }
        });
    }
}

// Draw car on circular mini-map
function drawCarOnCircularMiniMap(ctx, centerX, centerY, car, color, isPlayer) {
    // Convert world coordinates to mini-map coordinates
    // The input 'car' object now contains already projected map coordinates (x, y)
    let mapX = centerX + car.x;
    let mapY = centerY + car.y;

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