// Add this function to show current environment (add to your HUD rendering)
function drawEnvironmentInfo() {
    if (playerVehicle && environmentManager) {
        const env = environmentManager.currentEnvData;
        const progress = environmentManager.getEnvironmentProgress(playerVehicle.pos.z);
        const nextDistance = Math.ceil((playerVehicle.pos.z / 300) + 1) * 300;
        const distanceToNext = nextDistance - playerVehicle.pos.z;
        
        // Draw current environment name
        drawHUDText(`Environment: ${env.name}`, vec3(0.02, 0.15), 0.03, WHITE);
        
        // Draw distance to next environment
        drawHUDText(`Next change in: ${distanceToNext.toFixed(0)}m`, vec3(0.02, 0.18), 0.025, WHITE);
        
        // Draw progress bar
        const barWidth = 0.2;
        const barHeight = 0.02;
        const barX = 0.02;
        const barY = 0.21;
        
        // Background bar
        drawHUDRect(vec3(barX, barY), vec3(barWidth, barHeight), rgb(0.3, 0.3, 0.3));
        
        // Progress bar
        drawHUDRect(vec3(barX, barY), vec3(barWidth * progress, barHeight), rgb(0.2, 0.8, 0.2));
    }
}