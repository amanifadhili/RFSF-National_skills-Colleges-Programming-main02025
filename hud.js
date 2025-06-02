'use strict';

// Global variables for HUD management
let HUDButtons = [];
let radioMusic = -1;
let radioBoxAnimation = 0;

// Initialize HUD elements with modern design
function initHUD()
{
    // Create sleek radio panel header
    HUDButtons.push(new HUDButton('♫ RADIO', vec3(.15,.06), vec3(.18,.05), 0, hsl(.55, .8, .9), hsl(.55, .6, .2, .9)));
    
    // Create radio station buttons in horizontal layout
    for(let i = 4; i--;) {
        let buttonText = i == 3 ? 'OFF' : `FM ${i + 1}`;
        
        // Horizontal layout with better spacing
        let buttonPos = vec3(.06 + i * .045, .13);
        
        let b = new HUDButton(buttonText, buttonPos, vec3(.04, .035), undefined, WHITE, hsl(.15, .8, .4));
        b.musicTrack = i == 3 ? -1 : i;
        
        b.onClick = o => {
            sound_click.play();
            playMusicTrack(i);
            radioMusic = b.musicTrack;
            radioBoxAnimation = time; // Trigger animation
        }
        
        HUDButtons.push(b);
    }
}

// Main HUD rendering function
function drawHUD() {
    // Attract mode title screen
    if (attractMode) {
        let t = 'Click to Play';
        let s = 'KIGALI-2025';
        let a = 1 - Math.abs(Math.sin(time * 2));
        a = .5 + a * .5;
        // Enhanced year display with subtle effect (reduced shadow/glow)
        let yearGlow = .7 + Math.sin(time * 3) * .1;
        drawHUDText(
            s,
            vec3(.50, .60),
            .08,
            hsl(.3, .9, yearGlow),
            .002, // Reduced shadow offset for minimal glow
            hsl(.3, .6, .2, .5), // Lower alpha for softer shadow
            undefined,
            'center',
            700,
            'italic',
            undefined,
            0
        );
// Enhanced "Click to Play" with multiple effects
let clickPulse = Math.sin(time * 2.5) * .02;
let clickColor = hsl(.1, 1, a + clickPulse);
drawHUDText(t, vec3(.5, .95), .07 + clickPulse, clickColor, .008, BLACK, undefined, 'center', 800, 'italic', undefined, 0);
// Animated background elements for attract mode
for(let i = 8; i--;) {
    let starX = .1 + (i * .1) + Math.sin(time + i * 2) * .05;
    let starY = .8 + Math.sin(time * .5 + i) * .1;
    let starSize = .008 + Math.sin(time * 4 + i) * .004;
    let starAlpha = Math.sin(time * 3 + i * 1.5) * .3 + .5;
    let starColor = hsl(.15, .8, .7, starAlpha);
    drawHUDRect(vec3(starX, starY), vec3(starSize, starSize), starColor, 0);
}       
// Animated title logo
      // Professional animated title logo
for(let j = 2; j--;) {
    let text = j ? 'RTB&RP SKILLS COMPETITION' : 'FUTURE SKILLS';
    let pos = vec3(.5, .3 - j * .12);
    let size = .07;
    let weight = 700;
    
    // Subtle background glow for readability
    let glowColor = hsl(.15, .4, .2, .3);
    drawHUDRect(pos, vec3(.9, .08), glowColor, 0);
    
    pos = pos.multiply(mainCanvasSize);
    size = size * mainCanvasSize.y;
    let style = '';
    let font = 'arial';
    
    const context = mainContext;
    context.strokeStyle = BLACK;
    context.lineWidth = size * .08;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.lineJoin = 'round';
    
    let totalWidth = 0;
    
    // Calculate total width first
    context.font = style + ' ' + weight + ' ' + size + 'px ' + font;
    totalWidth = context.measureText(text).width;
    
    // Draw text with professional styling
    let startX = pos.x - totalWidth / 2;
    
    for(let i = 0; i < text.length; i++) {
        const c = text[i];
        const w = context.measureText(c).width;
        
        // Professional color scheme - gold/orange gradient
        let charColor = hsl(.12, .8, .7);
        
        // Draw character shadow
        context.fillStyle = hsl(.12, .6, .2, .8);
        context.fillText(c, startX + w/2 + size * .02, pos.y + size * .02);
        
        // Draw main character
        context.fillStyle = charColor;
        context.fillText(c, startX + w/2, pos.y);
        
        startX += w;
    }
    
    // Professional side accents - minimal and clean
    let accentColor = hsl(.12, .6, .5, .6);
    let accentY = .3 - j * .12;
    drawHUDRect(vec3(.15, accentY), vec3(.02, .003), accentColor, 0);
    drawHUDRect(vec3(.85, accentY), vec3(.02, .003), accentColor, 0);
}

// Professional subtitle with clean animation
let subtitleAlpha = .6 + Math.sin(time * 1.5) * .2;
let subtitleColor = hsl(.12, .6, .8, subtitleAlpha);
drawHUDText('DRIVING SIMULATION CHALLENGE', vec3(.5, .45), .035, subtitleColor, .002, BLACK, undefined, 'center', 400, undefined, undefined, 0);

// Clean corner decorations
for(let i = 4; i--;) {
    let cornerX = .12 + (i % 2) * .76;
    let cornerY = .15 + Math.floor(i/2) * .35;
    let cornerColor = hsl(.12, .5, .4, .4);
    
    // Simple corner lines
    drawHUDRect(vec3(cornerX, cornerY), vec3(.03, .002), cornerColor, 0);
    drawHUDRect(vec3(cornerX, cornerY), vec3(.002, .03), cornerColor, 0);
}

        return;
    }
    
// Game countdown display with enhanced modern design
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
        
        // Secondary ring for depth
        let ring2Size = circleSize * 1.3;
        let ring2Color = colors[startCountdown].copy();
        ring2Color.a = .1 * a;
        drawHUDRect(vec3(.5, .5), vec3(ring2Size, ring2Size), 0, .006, ring2Color);
        
        // Main countdown text with dramatic scaling
        let textSize = .35 + (1 - a) * .15 + Math.sin(time * 8) * .01;
        drawHUDText(t, vec3(.5, .5), textSize, c, .012, BLACK, undefined, 'center', 900, undefined, undefined, 0);
        
        // Animated corner energy bursts
        for(let i = 4; i--;) {
            let cornerX = .15 + (i % 2) * .7;
            let cornerY = .25 + Math.floor(i/2) * .5;
            let burstPulse = Math.sin(time * 10 + i * 1.5) * .5 + .5;
            let burstSize = .04 + burstPulse * .03;
            let burstColor = colors[startCountdown].copy();
            burstColor.a = burstPulse * .8 * a;
            drawHUDRect(vec3(cornerX, cornerY), vec3(burstSize, burstSize), burstColor, 0);
            
            // Secondary burst effect
            let burst2Size = burstSize * .6;
            let burst2Color = WHITE.copy();
            burst2Color.a = burstPulse * .4 * a;
            drawHUDRect(vec3(cornerX, cornerY), vec3(burst2Size, burst2Size), burst2Color, 0);
        }
        
        // Rotating orbital elements
        let orbitRadius = .25;
        for(let j = 6; j--;) {
            let angle = (j / 6) * Math.PI * 2 + time * 4;
            let orbitX = .5 + Math.cos(angle) * orbitRadius;
            let orbitY = .5 + Math.sin(angle) * orbitRadius;
            let orbitPulse = Math.sin(time * 6 + j) * .3 + .7;
            let orbitColor = colors[startCountdown].copy();
            orbitColor.a = orbitPulse * .6 * a;
            let orbitSize = .02 + orbitPulse * .015;
            drawHUDRect(vec3(orbitX, orbitY), vec3(orbitSize, orbitSize), orbitColor, 0);
        }
        
        // Screen edge flash effect
        if (a > .7) {
            let flashIntensity = (a - .7) * 3.33; // 0 to 1 range
            let flashColor = colors[startCountdown].copy();
            flashColor.a = flashIntensity * .15;
            
            // Top and bottom bars
            drawHUDRect(vec3(.5, .05), vec3(1, .1), flashColor, 0);
            drawHUDRect(vec3(.5, .95), vec3(1, .1), flashColor, 0);
            
            // Left and right bars
            drawHUDRect(vec3(.05, .5), vec3(.1, 1), flashColor, 0);
            drawHUDRect(vec3(.95, .5), vec3(.1, 1), flashColor, 0);
        }
    }
}
else {
    // Game timer display (existing code continues...)
 if (gameOverTimer.isSet()) {
    // Enhanced Game Over screen with dramatic effects
    const baseColor = hsl(.0, .8, .8); // Red-tinted white
    const pulseSpeed = 3;
    const s1 = .06 * (1 - Math.abs(Math.sin(time * pulseSpeed)));
    const s2 = .06 * (1 - Math.abs(Math.sin(time * pulseSpeed + PI/2)));
    
    // Screen darkening overlay with pulsing effect
    let overlayAlpha = .4 + Math.sin(time * 2) * .1;
    let overlayColor = BLACK.copy();
    overlayColor.a = overlayAlpha;
    drawHUDRect(vec3(.5, .5), vec3(1.2, 1.2), overlayColor, 0);
    
    // Animated background elements - falling debris effect
    for(let i = 8; i--;) {
        let debrisX = .2 + (i * .1) + Math.sin(time + i) * .05;
        let debrisY = ((time * .3 + i * .5) % 1.5) - .25; // Falling effect
        let debrisSize = .02 + Math.sin(time * 4 + i) * .01;
        let debrisColor = hsl(.0, .6, .3 + Math.sin(time * 2 + i) * .2, .6);
        drawHUDRect(vec3(debrisX, debrisY), vec3(debrisSize, debrisSize), debrisColor, 0);
    }
    
    // Main background panel with glitch effect
    let panelGlitch = Math.sin(time * 15) * .02;
    let panelColor = hsl(.0, .7, .15, .8);
    let panelBorder = hsl(.0, .9, .6);
    drawHUDRect(vec3(.5 + panelGlitch, .15), vec3(.6, .25), panelColor, .008, panelBorder);
    
    // Animated corner warning indicators
    for(let i = 4; i--;) {
        let cornerX = .15 + (i % 2) * .7;
        let cornerY = .05 + Math.floor(i/2) * .2;
        let warningPulse = Math.sin(time * 8 + i * 2) * .5 + .5;
        let warningColor = hsl(.0, .9, .7, warningPulse * .8);
        let warningSize = .03 + warningPulse * .02;
        drawHUDRect(vec3(cornerX, cornerY), vec3(warningSize, warningSize), warningColor, 0);
        
        // Warning triangle effect (simulated with smaller squares)
        for(let j = 3; j--;) {
            let triX = cornerX + (j - 1) * .015;
            let triY = cornerY - .02 + j * .01;
            let triColor = WHITE.copy();
            triColor.a = warningPulse * .6;
            drawHUDRect(vec3(triX, triY), vec3(.008, .008), triColor, 0);
        }
    }
    
    // Enhanced "GAME" text with glitch and glow
    let gameGlitch = Math.random() > .9 ? Math.random() * .01 - .005 : 0;
    let gameColor = baseColor.copy();
    gameColor.a = .9 + Math.sin(time * 4) * .1;
    
    // Multiple text layers for glow effect
    for(let layer = 3; layer--;) {
        let offset = layer * .003;
        let layerColor = layer === 0 ? gameColor : hsl(.0, .8, .4, .3);
        drawHUDText('GAME', vec3(.5 + gameGlitch + offset, .1 + offset), .15 + s1, layerColor, .008, BLACK, undefined, 'center', 900, 'italic', .5, 0);
    }
    
    // "OVER!" text with shake effect
    let overShake = Math.sin(time * 12) * .005;
    let overColor = hsl(.0, .9, .9);
    overColor.a = .9 + Math.sin(time * 6) * .1;
    
    // Multiple text layers for dramatic effect
    for(let layer = 3; layer--;) {
        let offset = layer * .004;
        let layerColor = layer === 0 ? overColor : hsl(.0, .7, .3, .4);
        drawHUDText('OVER!', vec3(.5 + overShake + offset, .2 + offset), .18 + s2, layerColor, .01, BLACK, undefined, 'center', 900, 'italic', .5, 0);
    }
    
        // Animated scan lines effect
    for(let i = 5; i--;) {
        let scanY = .05 + i * .05 + (time * .2) % .3;
        let scanAlpha = Math.sin(scanY * 20 + time * 10) * .3 + .3;
        let scanColor = hsl(.0, .5, .8, scanAlpha * .2);
        drawHUDRect(vec3(.5, scanY), vec3(.8, .005), scanColor, 0);
    }
    
    // Pulsing restart hint
    let hintAlpha = Math.sin(time * 2) * .3 + .7;
    let hintColor = WHITE.copy();
    hintColor.a = hintAlpha;
    drawHUDText('Press R to Restart', vec3(.5, .35), .04, hintColor, .003, BLACK, undefined, 'center', 400, 'italic');
}

  else {
    // Enhanced checkpoint timer with modern UI
    const timeLeft = checkpointTimeLeft | 0;
    const isUrgent = checkpointTimeLeft < 3;
    const isWarning = checkpointTimeLeft < 10;
    
    // Dynamic colors based on urgency
    const bgColor = isUrgent ? hsl(.0, .8, .2, .9) : 
                   isWarning ? hsl(.15, .8, .2, .9) : 
                   hsl(.6, .6, .2, .8);
    const textColor = isUrgent ? hsl(.0, .9, .9) : 
                     isWarning ? hsl(.15, .9, .8) : 
                     hsl(.6, .8, .9);
    const borderColor = isUrgent ? hsl(.0, .9, .6) : 
                       isWarning ? hsl(.15, .9, .6) : 
                       hsl(.6, .8, .6);
    
    // Pulsing effect for urgency
    let pulseIntensity = isUrgent ? Math.sin(time * 8) * .3 + .7 : 
                        isWarning ? Math.sin(time * 4) * .2 + .8 : 1;
    
    // Main timer panel with dynamic sizing
    let panelSize = vec3(.25, .12);
    if (isUrgent) panelSize = panelSize.scale(1 + Math.sin(time * 6) * .1);
    
    drawHUDRect(vec3(.5, .12), panelSize, bgColor, .006, borderColor);
    
    // Progress bar showing time remaining (visual indicator)
    let maxTime = startCheckpointTime; // Use initial checkpoint time as max
    let progress = Math.max(0, checkpointTimeLeft / maxTime);
    let progressWidth = .20 * progress;
    let progressColor = isUrgent ? hsl(.0, .8, .5) : 
                       isWarning ? hsl(.15, .8, .5) : 
                       hsl(.3, .8, .5);
    
    drawHUDRect(vec3(.5, .16), vec3(progressWidth, .02), progressColor, 0);
    drawHUDRect(vec3(.5, .16), vec3(.20, .02), 0, .002, hsl(.0, .0, .8, .5));
    
    // Timer label
    drawHUDText('CHECKPOINT', vec3(.5, .08), .03, textColor, .002, BLACK, undefined, 'center', 600);
    
    // Main time display with enhanced styling
    let timeSize = .08 + (isUrgent ? Math.sin(time * 10) * .01 : 0);
    drawHUDText(timeLeft + 's', vec3(.5, .12), timeSize, textColor, .004, BLACK, undefined, 'center', 900, undefined, undefined, 0);
    
    // Animated warning indicators for urgent state
    if (isUrgent) {
        for(let i = 6; i--;) {
            let angle = (i / 6) * Math.PI * 2 + time * 5;
            let warningX = .5 + Math.cos(angle) * .15;
            let warningY = .12 + Math.sin(angle) * .08;
            let warningPulse = Math.sin(time * 8 + i) * .5 + .5;
            let warningColor = hsl(.0, .9, .7, warningPulse * .8);
            drawHUDRect(vec3(warningX, warningY), vec3(.015, .015), warningColor, 0);
        }
        
        // Screen edge warning flash
        let flashAlpha = Math.sin(time * 12) * .2 + .1;
        let flashColor = hsl(.0, .8, .5, flashAlpha);
        drawHUDRect(vec3(.5, .02), vec3(1, .03), flashColor, 0);
        drawHUDRect(vec3(.5, .98), vec3(1, .03), flashColor, 0);
    }
    
    // Side warning indicators for warning state
    if (isWarning && !isUrgent) {
        for(let i = 2; i--;) {
            let sideX = .35 + i * .3;
            let sidePulse = Math.sin(time * 6 + i * 3) * .3 + .7;
            let sideColor = hsl(.15, .8, .6, sidePulse * .6);
            drawHUDRect(vec3(sideX, .12), vec3(.02, .06), sideColor, 0);
        }
    }
    
    // Subtle corner accents for normal state
    if (!isWarning) {
        for(let i = 4; i--;) {
            let cornerX = .38 + (i % 2) * .24;
            let cornerY = .06 + Math.floor(i/2) * .12;
            let accentColor = hsl(.6, .6, .5, .4);
            drawHUDRect(vec3(cornerX, cornerY), vec3(.008, .008), accentColor, 0);
        }
    }
}

}

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
    
    // Draw modern radio control panel
    if (!attractMode && !gameOverTimer.isSet()) {
        drawRadioPanel();
    }
    
    // Draw all HUD buttons
    for(const b of HUDButtons)
        b.draw();
}

// Draw modern radio control panel with animations
function drawRadioPanel() {
    // Animated glow effect
    let glowIntensity = .3 + .2 * Math.sin(time * 3);
    let animPulse = radioBoxAnimation > 0 ? Math.max(0, 1 - (time - radioBoxAnimation) * 2) : 0;
    
    // Main panel background with gradient effect
    drawHUDRect(vec3(.15, .095), vec3(.22, .12), hsl(.55, .6, .15, .9), .004, hsl(.55, .8, .4 + glowIntensity * .3));
    
    // Inner panel for buttons
    drawHUDRect(vec3(.15, .13), vec3(.20, .05), hsl(.55, .4, .1, .8), .002, hsl(.55, .6, .3));
    
    // Animated corner accents
    for(let i = 4; i--;) {
        let corner = vec3(.05 + (i % 2) * .20, .04 + Math.floor(i/2) * .11);
        let accentColor = hsl(.55 + i * .1, .8, .6 + animPulse * .4, .6);
        drawHUDRect(corner, vec3(.01, .01), accentColor, 0);
    }
    
    // Status indicator
    if (radioMusic >= 0) {
        let statusColor = hsl(.3, .8, .7 + .3 * Math.sin(time * 4));
        drawHUDRect(vec3(.25, .06), vec3(.008, .008), statusColor, 0);
        
        // Now playing text with scroll effect
        let trackName = musicTrackNames[radioMusic];
        let scrollOffset = (time * .05) % 1;
        drawHUDText(`♪ ${trackName}`, vec3(.15, .175), .025, hsl(.55, .8, .9), .002, BLACK, undefined, 'center', 300, 'italic');
    }
    
    // Signal strength bars animation
    for(let i = 5; i--;) {
        let barHeight = (.02 + i * .008) * (1 + .3 * Math.sin(time * 2 + i));
        let barColor = hsl(.3, .8, .4 + i * .1);
        let barPos = vec3(.26 + i * .008, .12);
        drawHUDRect(barPos, vec3(.005, barHeight), barColor, 0);
    }
}

// Enhanced HUD Button class with modern styling
class HUDButton
{
    constructor(text, pos, size, onClick, color = WHITE, backgroundColor = hsl(.6, 1, .2))
    {
        this.text = text;
        this.pos = pos;
        this.size = size;
        this.onClick = onClick;
        this.color = color;
        this.backgroundColor = backgroundColor;
        this.hoverTime = 0;
    }
    
    draw()
    {
        let pos = this.pos.copy();
        let backgroundColor = this.backgroundColor;
        let color = this.color;
        let outlineColor = WHITE;
        
        // Enhanced active button styling
        if (this.musicTrack == radioMusic) {
            backgroundColor = hsl(.3, .9, .5 + .2 * Math.sin(time * 4));
            color = WHITE;
            outlineColor = hsl(.3, .8, .8);
            
            // Active button glow effect
            drawHUDRect(pos, this.size.scale(1.2), hsl(.3, .6, .3, .3), 0);
        }
        
        // Button with rounded corners effect (simulated)
        backgroundColor && drawHUDRect(pos, this.size, backgroundColor, .003, outlineColor);
        
        // Button text with better positioning
        pos.y += this.size.y * .02;
        drawHUDText(this.text, pos, this.size.y * .7, color, .002, BLACK, undefined, 'center', 600, undefined, this.size.x * .9);
        
        // Handle mouse interaction with hover effects
        {
            pos = HUDstickToSides(pos);
            
            const size = this.size.scale(mainCanvasSize.y);
            const p1 = pos.multiply(mainCanvasSize);
            const p2 = mousePos.multiply(mainCanvasSize);
            
            // Check for hover
            if (isOverlapping(p1, size, p2)) {
                this.hoverTime = time;
                // Hover glow effect
                drawHUDRect(this.pos, this.size.scale(1.1), hsl(.15, .4, .4, .2), 0);
            }
            
            if (this.onClick && mouseWasPressed(0))
                if (isOverlapping(p1, size, p2))
                    this.onClick();
        }
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
