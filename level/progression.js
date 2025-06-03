// Level progression and difficulty management
class LevelManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.levelMessages = [
            "ROOKIE DRIVER",
            "GETTING BETTER",
            "PROFESSIONAL DRIVER",
            "EXPERT DRIVER",
            "MASTER OF THE ROAD"
        ];
        
        // Level-specific environment settings
        this.levelEnvironments = [
            { skyColor: hsl(0.6, 0.7, 0.7), groundColor: hsl(0.3, 0.6, 0.4) }, // Level 1: Daytime
            { skyColor: hsl(0.6, 0.6, 0.6), groundColor: hsl(0.3, 0.5, 0.4) }, // Level 2: Cloudy
            { skyColor: hsl(0.6, 0.4, 0.5), groundColor: hsl(0.3, 0.4, 0.3) }, // Level 3: Evening
            { skyColor: hsl(0.6, 0.3, 0.3), groundColor: hsl(0.3, 0.3, 0.2) }, // Level 4: Dusk
            { skyColor: hsl(0.6, 0.2, 0.1), groundColor: hsl(0.3, 0.2, 0.1) }  // Level 5: Night
        ];
        
        // Special events that can occur at specific levels
        this.levelEvents = {
            2: () => this.triggerRainEffect(),
            3: () => this.increaseCurves(),
            4: () => this.addNightTraffic(),
            5: () => this.finalLevelChallenge()
        };
        
        // Bonus targets for each level (distance milestones)
        this.bonusTargets = [];
    }
    
    update() {
        // Apply current level environment
        const levelIndex = Math.min(this.gameState.level - 1, this.levelEnvironments.length - 1);
        const environment = this.levelEnvironments[levelIndex];
        
        // Update environment colors (these would be used by the rendering system)
        // This assumes there are global variables for sky and ground colors
        if (environment && !this.gameState.isLevelTransition) {
            // Apply environment settings
            // (This would need to interface with your rendering system)
        }
        
        // Check for level-specific events
        if (this.gameState.isLevelTransition && this.levelEvents[this.gameState.level]) {
            this.levelEvents[this.gameState.level]();
        }
        
        // Update bonus targets
        this.checkBonusTargets();
    }
    
    getLevelMessage() {
        const levelIndex = Math.min(this.gameState.level - 1, this.levelMessages.length - 1);
        return this.levelMessages[levelIndex];
    }
    
    // Level-specific event implementations
    triggerRainEffect() {
        // This would interface with a weather system
        // For now, we'll just log it
        console.log("Rain effect triggered at level 2");
    }
    
    increaseCurves() {
        // This would modify track generation parameters
        console.log("Increasing track curves at level 3");
    }
    
    addNightTraffic() {
        // Add more traffic with lights
        console.log("Adding night traffic at level 4");
    }
    
    finalLevelChallenge() {
        // Final level special challenge
        console.log("Final level challenge activated");
    }
    
    checkBonusTargets() {
        // Check if player has reached any bonus targets
        for (let i = this.bonusTargets.length - 1; i >= 0; i--) {
            const target = this.bonusTargets[i];
            if (this.gameState.distance >= target.distance) {
                // Award bonus
                const bonus = this.gameState.addBonus(target.points, target.message);
                
                // Remove this target
                this.bonusTargets.splice(i, 1);
                
                // Return the bonus info for HUD display
                return bonus;
            }
        }
        return null;
    }
    
    generateBonusTargets() {
        // Clear existing targets
        this.bonusTargets = [];
        
        // Generate new bonus targets for the current level
        const baseDistance = this.gameState.nextLevelDistance - this.gameState.levelDistance;
        
        // Add 3 bonus targets per level
        for (let i = 1; i <= 3; i++) {
            const targetDistance = baseDistance + (i * this.gameState.levelDistance / 4);
            this.bonusTargets.push({
                distance: targetDistance,
                points: 1000 * this.gameState.level * i,
                message: `BONUS ${i}`
            });
        }
    }
}

// Create global level manager instance
const levelManager = new LevelManager(gameState);