// Environment and Weather System
class EnvironmentManager {
    constructor() {
        this.currentEnvironment = 0;
        // Increase the distance significantly since game units move fast
        this.environmentDistance = 30000; // Much larger distance for environment changes
        this.transitionDistance = 5000;   // Smooth transition distance
        this.lastEnvironmentCheck = 0;    // Track last environment change position
        
        // Define all possible environments
        this.environments = [
            {
                name: "sunny_day",
                skyColor: rgb(0.5, 0.8, 1.0),      // Light blue sky
                fogColor: rgb(0.7, 0.9, 1.0),      // Light blue fog
                groundColor: rgb(0.2, 0.6, 0.2),   // Green grass
                brightness: 1.0,
                fogDensity: 0.3
            },
            {
                name: "rainy",
                skyColor: rgb(0.3, 0.3, 0.4),      // Dark gray sky
                fogColor: rgb(0.4, 0.4, 0.5),      // Gray fog
                groundColor: rgb(0.1, 0.3, 0.1),   // Dark green
                brightness: 0.6,
                fogDensity: 0.8,
                hasRain: true
            },
            // {
            //     name: "night",
            //     skyColor: rgb(0.05, 0.05, 0.2),    // Very dark blue
            //     fogColor: rgb(0.1, 0.1, 0.3),      // Dark fog
            //     groundColor: rgb(0.1, 0.1, 0.1),   // Almost black
            //     brightness: 0.3,
            //     fogDensity: 0.9
            // },
            {
                name: "forest",
                skyColor: rgb(0.3, 0.6, 0.3),      // Green tinted sky
                fogColor: rgb(0.4, 0.7, 0.4),      // Green fog
                groundColor: rgb(0.15, 0.4, 0.15), // Forest green
                brightness: 0.7,
                fogDensity: 0.6
            },
            {
                name: "mountain",
                skyColor: rgb(0.6, 0.7, 0.9),      // Mountain blue
                fogColor: rgb(0.8, 0.8, 0.9),      // Light mountain fog
                groundColor: rgb(0.4, 0.3, 0.2),   // Rocky brown
                brightness: 0.9,
                fogDensity: 0.4
            },
            {
                name: "desert",
                skyColor: rgb(1.0, 0.8, 0.6),      // Sandy yellow sky
                fogColor: rgb(0.9, 0.7, 0.5),      // Sandy fog
                groundColor: rgb(0.8, 0.6, 0.3),   // Sand color
                brightness: 1.2,
                fogDensity: 0.2
            }
        ];
        
        this.currentEnvData = this.environments[0]; // Start with sunny day
        this.rainParticles = []; // For rain effect
        this.environmentChangeTimer = 0; // Add timer to prevent rapid changes
    }
    
    // Update environment based on player position
    update(playerZ) {
        // Only check for environment changes every 60 frames (1 second)
        this.environmentChangeTimer++;
        if (this.environmentChangeTimer < 60) {
            // Still update rain even if not checking environment
            if (this.currentEnvData.hasRain) {
                this.updateRain();
            }
            return;
        }
        this.environmentChangeTimer = 0;
        
        // Calculate which environment we should be in
        const environmentIndex = Math.floor(playerZ / this.environmentDistance) % this.environments.length;
        
        // Only change if we're in a different environment AND enough distance has passed
        if (environmentIndex !== this.currentEnvironment) {
            const distanceSinceLastChange = playerZ - this.lastEnvironmentCheck;
            
            // Make sure we've traveled at least the minimum distance
            if (distanceSinceLastChange >= this.environmentDistance * 0.8) { // 80% of distance to prevent flickering
                this.currentEnvironment = environmentIndex;
                this.currentEnvData = this.environments[environmentIndex];
                this.lastEnvironmentCheck = playerZ;
                
                console.log(`Environment changed to: ${this.currentEnvData.name} at position ${(playerZ/1000).toFixed(1)}k`);
            }
        }
        
        // Update rain particles if it's raining
        if (this.currentEnvData.hasRain) {
            this.updateRain();
        } else {
            // Gradually clear rain particles when not raining
            if (this.rainParticles.length > 0) {
                this.rainParticles.splice(0, Math.min(10, this.rainParticles.length));
            }
        }
    }
    
    // Create rain effect
    updateRain() {
        // Add new rain particles (less frequently)
        if (this.rainParticles.length < 50 && Math.random() < 0.3) {
            for (let i = 0; i < 2; i++) {
                this.rainParticles.push({
                    x: (Math.random() - 0.5) * 4000,
                    y: Math.random() * 1000 + 500,
                    z: playerVehicle.pos.z + Math.random() * 2000,
                    speed: Math.random() * 15 + 8
                });
            }
        }
        
        // Update existing rain particles
        for (let i = this.rainParticles.length - 1; i >= 0; i--) {
            const particle = this.rainParticles[i];
            particle.y -= particle.speed;
            
            // Remove particles that hit the ground or are too far behind
            if (particle.y < 0 || particle.z < playerVehicle.pos.z - 3000) {
                this.rainParticles.splice(i, 1);
            }
        }
    }
    
    // Get current environment colors
    getCurrentEnvironment() {
        return this.currentEnvData;
    }
    
    // Get progress to next environment (0-1)
    getEnvironmentProgress(playerZ) {
        const progress = (playerZ % this.environmentDistance) / this.environmentDistance;
        return progress;
    }
    
    // Manual environment change for testing
    forceNextEnvironment() {
        this.currentEnvironment = (this.currentEnvironment + 1) % this.environments.length;
        this.currentEnvData = this.environments[this.currentEnvironment];
        this.lastEnvironmentCheck = playerVehicle ? playerVehicle.pos.z : 0;
        console.log(`FORCED: Environment changed to: ${this.currentEnvData.name}`);
    }
}

// Create global environment manager
let environmentManager = new EnvironmentManager();
