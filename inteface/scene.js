'use strict';

function drawScene(){
   drawSky();
    drawTrack();
   drawCars();
    drawScenery();
}

function drawSky()
{
    glEnableFog = 0; // disable fog

    // Set sky color based on weather
    let skyColor, horizonColor;
    if (currentWeather === 'rain') {
        skyColor = hsl(200, 0.3, 0.3); // Dark blue-gray for rain
        horizonColor = hsl(200, 0.2, 0.4); // Slightly lighter at horizon
    } else {
        skyColor = hsl(200, 0.5, 0.5); // Normal blue sky
        horizonColor = hsl(0.57, 1, 0.5); // Normal horizon color
    }

    {
        // horizon and background
        let s = 1e4;
        pushGradient(vec3(0,s,1e4), vec3(5e4,s), WHITE, horizonColor);
    }

    // Draw clouds with weather-based modifications
    random.setSeed(13);
    for(let i=99;i--;)
    {
        let s = random.float(900,2000);
        let cloudColor;
        
        if (currentWeather === 'rain') {
            // Darker, more ominous clouds for rain
            cloudColor = hsl(0.15, 0.3, 0.4, 0.7);
        } else {
            // Normal white clouds for sunny weather
            cloudColor = hsl(0.15, 1, 0.95, 0.5);
        }
        
        pushSprite(vec3(worldHeading*-3e4 + random.floatSign(1e5),random.float(2000,9000),1e4), 
                  vec3(s*3,s,s), cloudColor, getGenerativeTile(vec3(1,0)));
    }

    // Draw rain particles if weather is rain
    if (currentWeather === 'rain') {
        for(let i = rainParticles.length; i--;) {
            let p = rainParticles[i];
            pushSprite(vec3(p.x, p.y, p.z), vec3(2, 20, 1), 
                      hsl(200, 0.5, 0.8, 0.6), getGenerativeTile(vec3(1,0)));
        }
    }

    glRender();
    glEnableFog = 1; 
}

