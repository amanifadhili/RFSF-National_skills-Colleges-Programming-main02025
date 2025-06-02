'use strict';
/**
 * Key Components:

A Heads-Up Display (HUD) is a user interface that presents information directly in the user's line of sight without requiring them to look away from their primary focus area. 

HUD Initialization (initHUD): Sets up radio control buttons with a main "RADIO" label and 4 selectable options (tracks 1-3 and OFF)
Main HUD Rendering (drawHUD): Handles different game states:

Attract Mode: Animated title screen with pulsing text effects
Countdown: 3-2-1-GO countdown with color-coded numbers
Game Over: Pulsing "GAME OVER" text
Active Game: Timer display, speed indicator, and music info


HUD Button Class: Interactive UI elements with click detection and visual feedback
Utility Functions:

HUDstickToSides: Adjusts UI positioning for different screen aspect ratios
drawHUDRect: Draws rectangular UI elements
drawHUDText: Advanced text rendering with shadows, styling, and positioning
 * 
 */

// Global variables for HUD management
let HUDButtons = [];        // Array to store all HUD button objects
let radioMusic = -1;        // Currently selected radio track (-1 = off, 0-3 = track number)

// HUD = Heads Up Display - initialize all HUD elements
function initHUD()
{
    // Create main RADIO label button (non-interactive display)
    // Parameters: text, position(x,y), size(width,height), onClick, color, backgroundColor
    HUDButtons.push(new HUDButton('RADIO', vec3(.63,.95), vec3(.15,.08), 0, YELLOW, 0));
    
    // Create 4 radio station buttons (tracks 1,2,3 and OFF)
    for(let i = 4; i--;) { // Loop from 3 to 0 (reverse order)
        let c = hsl(.1, 1, .5);  // Orange/brown color for button
        
        // Create button text: "1", "2", "3", or "OFF" for the last one
        let buttonText = i == 3 ? 'OFF' : i + 1;
        
        // Position buttons horizontally: .73, .80, .87, .94 (spaced .07 apart)
        let buttonPos = vec3(.73 + i * .07, .95);
        
        // Create the button object
        let b = new HUDButton(buttonText, buttonPos, vec3(.06), undefined, c);
        
        // Set music track: -1 for OFF, or track number 0-2
        b.musicTrack = i == 3 ? -1 : i;
        
        // Define click behavior for each button
        b.onClick = o => {
            sound_click.play();              // Play click sound effect
            playMusicTrack(i);              // Start playing the selected track
            radioMusic = b.musicTrack;       // Update global radio state
        }
        
        HUDButtons.push(b);  // Add button to global array
    }
}

// Main HUD rendering function - called every frame
function drawHUD() {
    // Handle attract mode (title screen before game starts)
    if (attractMode) {
        // Animated "Click to Play" text
        let t = 'Click to Play';
        let s = 'KIGALI-2025';  // Year display
        
        // Create pulsing alpha effect using sine wave
        let a = 1 - Math.abs(Math.sin(time * 2));
        a = .5 + a * .5;  // Scale alpha between 0.5 and 1.0
        
        // Draw year text (static green)
        drawHUDText(s, vec3(.50, .60), .06, rgb(0, 1, 0), .005, undefined, undefined, undefined, 900, undefined, undefined, 0);
        
        // Draw "Click to Play" with pulsing orange color
        drawHUDText(t, vec3(.5, .95), .06, hsl(.1, 1, a), .005, undefined, undefined, undefined, 900, undefined, undefined, 0);
        
        // Draw animated title logo
        for(let j = 2; j--;) {  // Draw two lines of title text
            // Title text content
            let text = j ? 'RTB&RP SKILLS C0MP3T1T10N' : 'FUTURE SK11LL5';
            
            let pos = vec3(.47, .25 - j * .15);  // Position for each line
            let size = .09;      // Base font size
            let weight = 900;    // Font weight (bold)
            
            // Convert to canvas coordinates
            pos = pos.multiply(mainCanvasSize);
            size = size * mainCanvasSize.y;
            let style = 'italic';
            let font = 'arial';
            
            // Set up canvas context for text rendering
            const context = mainContext;
            context.strokeStyle = BLACK;
            context.lineWidth = size * .1;
            context.textBaseline = 'middle';
            context.textAlign = 'center';
            context.lineJoin = 'round';
            
            let totalWidth = 0;  // Track total text width for centering
            
            // Two-pass rendering: first pass calculates width, second pass draws
            for(let k = 2; k--;) {
                for(let i = 0; i < text.length; i++) {
                
                    /*
                    const p = 22;
                    const size2 = 33;  // Vary character size
                    */
                  
                    // Create wave effect - each character oscillates based on time and position
                    const p = Math.sin(i - time * 1 - j * 1);
                    const size2 = size + p * 0.003 * mainCanvasSize.y;  // Vary character size by 3 % change

                    /*
                    const p = 1;
                    const size2 = 36
                    */
                     
                    
                    context.font = style + ' ' + weight + ' ' + size2 + 'px ' + font;
                    const c = text[i];  // Current character
                    const w = context.measureText(c).width;  // Character width
                    
                    // First pass: accumulate total width
                    if (k) {
                        totalWidth += w;
                        continue;
                    }
                    
                    // Second pass: render characters
                    const x = pos.x + w/2 - totalWidth/2;  // Center the text
                    
                    // Draw character with shadow effect (2 layers)
                    for(let f = 2; f--;) {
                        const o = f * .01 * mainCanvasSize.y;  // Shadow offset
                        // Color: bright orange for main text, black for shadow
                        context.fillStyle = hsl(.15 + p/9, 1, !f ? .75 + p * .25 : 0);
                        context.fillText(c, x + o, pos.y + o);
                    }
                    pos.x += w;  // Move to next character position
                }
            }
        }
        return;  // Exit early - don't draw game HUD in attract mode
    }
    
    // Handle game start countdown display
    if (startCountdownTimer.active() || startCountdown > 0) {
        if (startCountdown < 4) {
            // Countdown animation effect
            let a = 1 - time % 1;  // Fade out over 1 second
            let t = startCountdown | 0;  // Convert to integer (3, 2, 1)
            
            // Special case for go signal
            if (startCountdown == 0 && startCountdownTimer.active())
                t = 'GOOO!';
            
            // Different colors for each countdown number
            let colors = [GREEN, YELLOW, BLUE, RED];
            let c = colors[startCountdown].copy();
            c.a = a;  // Apply fade effect
            
            // Draw countdown text with growing size effect
            drawHUDText(t, vec3(.5, .2), .3 - a * .1, c, .005, undefined, undefined, undefined, 500, undefined, undefined, 0);
        }
    }
    else {
        // Game is running - show timer or game over screen
        if (gameOverTimer.isSet()) {
            // Game over screen with pulsing text
            const c = WHITE;
            const s1 = .04 * (1 - Math.abs(Math.sin(time * 2)));         // Pulse effect for "GAME"
            const s2 = .04 * (1 - Math.abs(Math.sin(time * 2 + PI/2)));  // Offset pulse for "OVER!"
            
            drawHUDText('GAME', vec3(.5, .1), .1 + s1, c, .005, undefined, undefined, undefined, 900, 'italic', .5, 0);
            drawHUDText('OVER!', vec3(.5, .2), .1 + s2, c, .005, undefined, undefined, undefined, 900, 'italic', .5, 0);
        }
        else {
            // Show checkpoint timer with color-coded urgency
            const c = checkpointTimeLeft < 3 ? RED :           // Critical (red)
                     checkpointTimeLeft < 10 ? YELLOW :        // Warning (yellow)  
                     WHITE;                                    // Normal (white)
            const t = checkpointTimeLeft | 0;  // Convert to integer seconds
            
            drawHUDText(t, vec3(.5, .1), .15, c, .005, undefined, undefined, undefined, 900, undefined, undefined, 0);
        }
    }
    
    // Speed display (KPH - Kilometers Per Hour)
    const mph = playerVehicle.velocity.z | 0;  // Get speed as integer
    const aspect = mainCanvasSize.x / mainCanvasSize.y;  // Screen aspect ratio
    const mphPos = vec3(.01, .95);  // Position in top-left corner
    
    // Only show speed on wide screens (aspect ratio > 0.75)
    if (aspect > .75)
        drawHUDText(mph + ' KPH', mphPos, .08, RED, .005, WHITE, undefined, 'left', 200, 'italic');
    
    // Music track display with musical note and pulsing effect
    if (radioMusic >= 0) {  // Only show if a track is playing
        let size = .034 + .002 * Math.sin(time * 4);  // Pulsing size effect
        // Musical note symbol + track name
        drawHUDText('𝅘𝅥𝅮 ' + musicTrackNames[radioMusic], vec3(.83, .89), size, WHITE, .003, BLACK, undefined, undefined, undefined, 'italic');
    }
    
    // Draw all HUD buttons (radio controls)
    for(const b of HUDButtons)
        b.draw();
}

// HUD Button class - creates interactive UI elements
class HUDButton
{
    constructor(text, pos, size, onClick, color = WHITE, backgroundColor = hsl(.6, 1, .2))
    {
        this.text = text;                    // Button label text
        this.pos = pos;                      // Position (normalized 0-1 coordinates)
        this.size = size;                    // Size (normalized coordinates)
        this.onClick = onClick;              // Click handler function
        this.color = color;                  // Text color
        this.backgroundColor = backgroundColor; // Button background color
    }
    
    draw()
    {
        // Prepare rendering variables
        let pos = this.pos.copy();
        let backgroundColor = this.backgroundColor;
        let color = this.color;
        let outlineColor = WHITE;
        
        // Highlight active radio button
        if (this.musicTrack == radioMusic) {
            // Active button gets special styling
            backgroundColor = hsl(radioMusic < 0 ? 0 : .1, 1, .5);  // Orange for tracks, red for OFF
            color = WHITE;           // White text on colored background
            outlineColor = BLACK;    // Black outline for contrast
        }
        
        // Draw button background rectangle (if backgroundColor is set)
        backgroundColor && drawHUDRect(pos, this.size, backgroundColor, .005, outlineColor);
        
        // Adjust text position slightly down for better centering
        pos.y += this.size.y * .05;
        
        // Draw button text with size constraints
        drawHUDText(this.text, pos, this.size.y * .8, color, .005, undefined, undefined, undefined, 900, undefined, this.size.x * .75);
        
        // Handle mouse interaction
        {
            pos = HUDstickToSides(pos);  // Adjust position for screen aspect ratio
            
            const size = this.size.scale(mainCanvasSize.y);    // Convert to pixel coordinates
            const p1 = pos.multiply(mainCanvasSize);           // Button position in pixels
            const p2 = mousePos.multiply(mainCanvasSize);      // Mouse position in pixels
            
            // Check for click collision and execute onClick handler
            if (this.onClick && mouseWasPressed(0))
                if (isOverlapping(p1, size, p2))
                    this.onClick();
        }
    }
}

// Utility function to handle different screen aspect ratios
// Keeps UI elements properly positioned on wide/narrow screens
function HUDstickToSides(pos)
{
    pos = pos.copy();
    
    // Adjust horizontal positioning based on screen aspect ratio
    if (pos.x < .5) {
        // Left side elements: scale based on aspect ratio
        pos.x = pos.x * mainCanvasSize.y / mainCanvasSize.x;
    } else {
        // Right side elements: mirror the left side scaling
        pos.x = 1 - (1 - pos.x) * mainCanvasSize.y / mainCanvasSize.x;
    }
    return pos;
}

///////////////////////////////////////////////////////////////////////////////
// HUD Drawing Utility Functions
///////////////////////////////////////////////////////////////////////////////

// Draw a rectangular UI element (buttons, panels, etc.)
function drawHUDRect(pos, size, color = WHITE, lineWidth = 0, lineColor = BLACK)
{
    pos = HUDstickToSides(pos);  // Adjust for screen aspect ratio
    
    // Convert normalized coordinates to pixel coordinates
    lineWidth *= mainCanvasSize.y;
    size = size.scale(mainCanvasSize.y);
    pos = pos.multiply(mainCanvasSize).subtract(size.scale(.5));  // Center the rectangle
    
    // Set up canvas drawing context
    const context = mainContext;
    context.fillStyle = color;
    context.strokeStyle = lineColor;
    context.lineWidth = lineWidth;
    
    // Draw filled rectangle
    context.fillRect(pos.x, pos.y, size.x, size.y);
    
    // Draw outline if lineWidth is specified
    lineWidth && context.strokeRect(pos.x, pos.y, size.x, size.y);
}

// Draw text on the HUD with extensive customization options
function drawHUDText(text, pos, size = .1, color = WHITE, shadowOffset = 0, shadowColor = BLACK, font = 'arial', textAlign = 'center', weight = 400, style = '', width, stickToSides = 1)
{
    // Adjust position for screen aspect ratio (unless disabled)
    if (stickToSides)
        pos = HUDstickToSides(pos);
    
    // Convert normalized coordinates to pixel coordinates
    size *= mainCanvasSize.y;           // Font size in pixels
    if (width)
        width *= mainCanvasSize.y;      // Text width constraint in pixels
    shadowOffset *= mainCanvasSize.y;   // Shadow offset in pixels
    pos = pos.multiply(mainCanvasSize); // Position in pixels
    
    // Set up canvas text rendering context
    const context = mainContext;
    context.font = style + ' ' + weight + ' ' + size + 'px ' + font;
    context.textBaseline = 'middle';  // Vertically center text
    context.textAlign = textAlign;    // Horizontal alignment
    
    // Draw shadow text first (if shadow is enabled)
    if (shadowOffset) {
        let c = shadowColor.copy();
        c.a = color.a;  // Match shadow alpha to main text alpha
        context.fillStyle = c;
        context.fillText(text, pos.x + shadowOffset, pos.y + shadowOffset, width);
    }
    
    // Draw main text on top of shadow
    context.fillStyle = color;
    context.fillText(text, pos.x, pos.y, width);
}