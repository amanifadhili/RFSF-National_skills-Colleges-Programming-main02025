// Core game state management
class GameState {
    constructor() {
        // Game progression variables
        this.score = 0;
        this.distance = 0;
        this.level = 1;
        this.levelDistance = 500; // Distance for level progression (500m)
        this.nextLevelDistance = this.levelDistance;
        
        // Difficulty settings that scale with level
        this.trafficDensity = 0.2; // Base value, will increase with level
        this.obstacleFrequency = 0.1; // Base value, will increase with level
        this.maxSpeed = 150 + (this.level * 10); // Increases with level
        
        // Game state flags
        this.isGameOver = false;
        this.isPaused = false;
        this.isLevelTransition = false;
        this.transitionTimer = 0;
        
        // Scoring multipliers
        this.speedMultiplier = 1;
        this.comboMultiplier = 1;
        this.comboTimer = 0;
    }
    
    update() {
        if (this.isPaused || this.isGameOver) return;
        
        // Update distance based on player vehicle position
        if (playerVehicle) {
            // Convert game units to meters for display
            this.distance = Math.floor(playerVehicle.pos.z / 100);
            
            // Check for level progression
            if (this.distance >= this.nextLevelDistance) {
                this.levelUp();
            }
        }
        
        // Update score based on speed and distance
        if (playerVehicle && playerVehicle.velocity) {
            const speed = playerVehicle.velocity.z;
            this.speedMultiplier = clamp(speed / 100, 0.5, 2);
            this.score += this.speedMultiplier * this.comboMultiplier;
        }
        
        // Handle combo timer decay
        if (this.comboTimer > 0) {
            this.comboTimer -= 1/60; // Assuming 60fps
            if (this.comboTimer <= 0) {
                this.comboMultiplier = 1;
            }
        }
        
        // Handle level transition animation
        if (this.isLevelTransition) {
            this.transitionTimer -= 1/60;
            if (this.transitionTimer <= 0) {
                this.isLevelTransition = false;
            }
        }
    }
    
    levelUp() {
        this.level++;
        this.nextLevelDistance += this.levelDistance;
        
        // Increase difficulty
        this.trafficDensity = Math.min(0.2 + (this.level * 0.05), 0.6);
        this.obstacleFrequency = Math.min(0.1 + (this.level * 0.03), 0.5);
        this.maxSpeed = 150 + (this.level * 10);
        
        // Trigger level transition
        this.isLevelTransition = true;
        this.transitionTimer = 3; // 3 seconds transition
        
        // Play level up sound
        if (sound_checkpoint) {
            sound_checkpoint.play(1, 1.2); // Slightly higher pitch for level up
        }
        
        speak(`LEVEL ${this.level} REACHED`);
    }
    
    addBonus(points, message) {
        this.score += points;
        this.comboMultiplier += 0.1;
        this.comboTimer = 3; // Reset combo timer to 3 seconds
        
        // Return the message for HUD display
        return {
            message: message,
            points: points
        };
    }
    
    reset() {
        this.score = 0;
        this.distance = 0;
        this.level = 1;
        this.nextLevelDistance = this.levelDistance;
        this.isGameOver = false;
        this.isPaused = false;
        this.isLevelTransition = false;
        this.comboMultiplier = 1;
        this.comboTimer = 0;
    }
    
    getDifficultySettings() {
        return {
            trafficDensity: this.trafficDensity,
            obstacleFrequency: this.obstacleFrequency,
            maxSpeed: this.maxSpeed
        };
    }
}

// Create global game state instance
const gameState = new GameState();