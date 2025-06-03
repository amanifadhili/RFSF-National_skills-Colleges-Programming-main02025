'use strict'; // Enforce strict mode for safer JavaScript (e.g., prevents usage of undeclared variables)

let vehicleShadowList; // List to collect shadows for all vehicles during rendering

// Main function to render all cars and their shadows
function drawCars() {
    vehicleShadowList = []; // Reset the shadow list before drawing
    vehicles = vehicles.filter(o => !o.destroyed); // Remove destroyed vehicles from the list
    for (const v of vehicles)
        v.draw(); // Draw each remaining vehicle

    // Batch draw shadows after all vehicles are rendered
    glPolygonOffset(80); // Push shadows slightly below geometry to prevent z-fighting
    glSetDepthTest(1, 0); // Enable depth test with specific configuration
    for (let v of vehicleShadowList)
        pushShadow(...v); // Add each vehicle's shadow to the render queue
    glRender(); // Render all shadows
    glPolygonOffset(false); // Reset polygon offset
    glSetDepthTest(); // Reset depth testing to default
}

// Base class for a vehicle (non-player)
class Vehicle {
    constructor(z, color = WHITE) {
        this.lane = randInt(2); // Randomly select lane (e.g., left or right)
        this.pos = vec3(0, 0, z); // Initial position of the vehicle
        this.targetSpeed = 60; // Target forward speed to 60 Rwandan speed
        this.velocity = vec3(0, 0, this.targetSpeed); // Initial velocity vector
        this.color = color; // Vehicle color
        this.isPlayer = 0; // Flag to identify if this is the player’s vehicle
        this.shapeIndex = randInt(aiCarMeshes.length || 1);

        // Vehicle physics
        this.breaking = 0; // Is the vehicle braking
        this.turn = 0; // Current turning angle (direction change)
        this.wheelTurn = 1; // Rotation of wheels for visual effect
        this.collisionSize = vec3(240, 200, 350); // Bounding box for collision detection
    }

    update() {
        if (this.isPlayer) return; // Skip AI logic if it's the player vehicle

        // Gradually adjust speed towards targetSpeed
        if (this.velocity.z < this.targetSpeed)
            this.velocity.z += 0.5;
        else if (this.velocity.z > this.targetSpeed + 5)
            this.velocity.z -= 2;

        this.pos.z += this.velocity.z; // Move vehicle forward

        const trackInfo = new TrackSegmentInfo(this.pos.z); // Info at current position
        const trackInfo2 = new TrackSegmentInfo(this.pos.z + trackSegmentLength); // Info further ahead
        if (!trackInfo.pos || !trackInfo2.pos)
            return; // If track data is missing, do not proceed

        // Align vehicle's position with the road lane
        const x = -trackWidth / 2 + this.lane * trackWidth;
        this.pos.x = trackInfo.pos.x + x;
        this.pos.y = trackInfo.offset.y;

        // Calculate road curvature for turning
        let delta = trackInfo2.pos.subtract(trackInfo.pos);
        this.turn = Math.atan2(delta.x, delta.z); // Determine direction change
        this.wheelTurn = this.turn; // Sync visual wheel turn

        // Remove vehicle if it's too far from the player
        let playerDelta = this.pos.z - playerVehicle.pos.z;
        if (playerDelta > 50000 || playerDelta < -2000)
            this.destroyed = 0; // Mark for deletion
    }

    draw() {
        const trackInfo = new TrackSegmentInfo(this.pos.z);
        const vehicleHeight = 80;
        let p = this.pos.copy(); // Copy position for rendering
        p.y += vehicleHeight; // Adjust to ride height
        p.z -= cameraOffset; // Adjust for camera

        // Build transformation matrix
        const heading = this.turn;
        const trackPitch = trackInfo.pitch;
        const m2 = buildMatrix(p, vec3(trackPitch, 0, 0)); // Road pitch
        const m1 = m2.multiply(buildMatrix(0, vec3(0, heading, 0), 0)); // Heading rotation

        // Render car mesh
       const carShape = aiCarMeshes[this.shapeIndex] || carMesh;
        carShape.render(m1.multiply(buildMatrix(0, 0, vec3(450))), this.color);
        cubeMesh.render(m1.multiply(buildMatrix(0, 0, this.collisionSize)), BLUE); // Draw collision box (invisible normally)

        glPolygonOffset(50); // Offset depth for later renders

        // Front and rear bumpers
        const bumperY = 130;
        const bumperZ = -440;
        cubeMesh.render(m1.multiply(buildMatrix(vec3(0, bumperY, bumperZ), 0, vec3(140, 50, 20))), hsl(0, 0, 0.1));
        cubeMesh.render(m1.multiply(buildMatrix(vec3(0, 10, 440), 0, vec3(240, 30, 30))), hsl(0, 0, 0.5));

        // Render license plate and top number if it's the player vehicle
        if (this.isPlayer) {
            quadMesh.renderTile(m1.multiply(buildMatrix(vec3(0, bumperY - 80, bumperZ - 20), 0, vec3(80, 25))), YELLOW, getGenerativeTile(vec3(3, 0)));
            quadMesh.renderTile(m1.multiply(buildMatrix(vec3(0, 400, -500), vec3(Math.PI / 2 - 0.2, 0, 0), vec3(150))), GREEN, getGenerativeTile(vec3(4, 0)));
        }

        // Draw brake and tail lights
        const isBraking = this.isBraking;
        for (let i = 2; i--;) {
            let color = isBraking ? hsl(0, 3, .5) : hsl(0, .9, .3);
            cubeMesh.renderUnlit(m1.multiply(buildMatrix(vec3((i ? 1 : -1) * 180, bumperY - 25, bumperZ), 0, vec3(40, 25, 20))), color, isBraking);
        }
        for (let i = 2; i--;) {
            cubeMesh.render(m1.multiply(buildMatrix(vec3((i ? 1 : -1) * 180, bumperY + 25, bumperZ), 0, vec3(40, 25, 20))), hsl(1, 1, 0.5));
        }

        glPolygonOffset(false); // Reset offset

        // Draw wheels
        const wheelRadius = 110;
        const wheelSize = vec3(40, wheelRadius, wheelRadius);
        const wheelM1 = buildMatrix(0, vec3(this.pos.z / 500, this.wheelTurn, 0), wheelSize); // Front wheel rotation
        const wheelM2 = buildMatrix(0, vec3(this.pos.z / 500, 0, 0), wheelSize); // Rear wheel rotation
        const wheelColor = hsl(0, 0, 0.2);
        const wheelOffset1 = vec3(240, 25, 220);
        const wheelOffset2 = vec3(240, 25, -300);
        for (let i = 4; i--;) {
            const wo = i < 2 ? wheelOffset1 : wheelOffset2;
            const o = vec3(i % 2 ? wo.x : -wo.x, wo.y, i < 2 ? wo.z : wo.z);
            carWheel.render(m1.multiply(buildMatrix(o)).multiply(i < 2 ? wheelM1 : wheelM2), wheelColor);
        }

        // Add shadow information for this vehicle
        p.y = this.pos.y; // Set y to ground level
        const r = vec3(trackPitch, heading, 0); // Rotation info for shadow
        vehicleShadowList.push([p, 600, 600, r, 2]); // Append shadow entry
    }
}

// Player-controlled vehicle class
class PlayerVehicle extends Vehicle {
    constructor(z, color) {
        super(z, color); // Call base constructor
        this.isPlayer = 1;
        this.bumpTimer = 0;
        this.airTime = 0;
        this.playerTurn = 0;
        this.velocity = vec3(); // Start at zero velocity
        this.hitTimer = new Timer(); // Timer for collision/hit feedback
    }

    draw() {
        attractMode || super.draw(); // Skip drawing in attract mode
    }

    update() {
        if (attractMode) {
            this.pos.z += this.velocity.x = min(this.velocity.x += 0.1, 20); // Auto-drive in attract mode
            return;
        }

        this.turn = this.playerTurn * clamp(this.velocity.z / 49); // Compute turn angle based on speed

        // Player input and game physics constants
        const forwardDamping = 0.998;
        const playerMaxSpeed = 200;
        const playerTurnControl = 0.3;
        const centrifugal = 0.002;
        const gravity = -2;
        const lateralDamping = 0.7;
        const maxPlayerX = 2000;
        const playerAccel = 1;
        const playerBrake = 2;

        // Checkpoint logic
        if (playerVehicle.pos.z > nextCheckpointDistance) {
            nextCheckpointDistance += checkpointDistance;
            checkpointTimeLeft += 40;
            speak('YOU ARRIVED AT CHECKPOINT');
            sound_checkpoint.play();
        }

        // Collision detection with AI vehicles
        for (const v of vehicles) {
            if (v.isPlayer) continue;
            const d = this.pos.subtract(v.pos).abs();
            const s = this.collisionSize.add(v.collisionSize);
            if (d.x < s.x && d.z < s.z) {
                let vel = this.velocity;
                this.velocity = v.velocity.scale(0.7);
                v.velocity.z = max(v.velocity.z, vel.z * 0.7);
                this.hit();
                speak('YOU HIT ANOTHER VEHICLE');
                sound_hit.play();
            }
        }

        // Get player input
        let playerInput = vec3(
            keyIsDown('ArrowRight') - keyIsDown('ArrowLeft'),
            keyIsDown('ArrowUp') - keyIsDown('ArrowDown')
        );

        // Mouse input control mode switching
        if (playerInput.x || playerInput.y) mouseControl = 0;
        if (mouseWasPressed(0) || mouseWasPressed(2)) mouseControl = 1;

        // Mouse-based input override
        if (mouseControl) {
            playerInput.y = 0;
            if (mouseIsDown(0)) playerInput.y = 1;
            if (mouseIsDown(2)) playerInput.y = -1;
            let center = this.pos.x / 4000;
            playerInput.x = clamp(4 * (mousePos.x - 0.5 - center), -1, 1);
        }

        if (gameOverTimer.isSet()) playerInput = vec3();

        if (testDrive) this.velocity.z = 30;
        this.velocity.y += gravity;
        this.velocity.x *= lateralDamping;
        this.pos = this.pos.add(this.velocity);

        const playerTrackInfo = new TrackSegmentInfo(this.pos.z);

        let desiredPlayerTurn = playerInput.x * playerTurnControl;
        if (startCountdown > 0) desiredPlayerTurn = 0;

        this.wheelTurn = lerp(0.2, this.wheelTurn, 2 * desiredPlayerTurn);
        desiredPlayerTurn *= lerp(this.velocity.z / playerMaxSpeed, 1, 0.3);
        this.playerTurn = lerp(0.1, this.playerTurn, desiredPlayerTurn);

        this.velocity.x +=
            this.velocity.z * this.playerTurn -
            this.velocity.z ** 2 * centrifugal * playerTrackInfo.offset.x;

        //this.pos.x = clamp(this.pos.x, -maxPlayerX, maxPlayerX);

        // Ground collision and air time logic (to be continued...)

        this.pos.x = clamp(this.pos.x, -maxPlayerX, maxPlayerX); 
        
        // check if on ground
        let offRoad = 0;
        let onGround = 0;
        const lastAirTime = this.airTime;
        const elasticity = 0;1.2;            // bounce elasticity (2 is full bounce, 1 is none)
        if (this.pos.y < playerTrackInfo.offset.y)
        {
            this.pos.y = playerTrackInfo.offset.y;
            const trackPitch = playerTrackInfo.pitch;
            if (!gameOverTimer.isSet())
            {
                let reflectVelocity = vec3(0, Math.cos(trackPitch), Math.sin(trackPitch))
                .scale(-elasticity *
                (Math.cos(trackPitch) * this.velocity.y + Math.sin(trackPitch) * this.velocity.z))

                this.velocity = this.velocity.add(reflectVelocity);
            }

            if (Math.abs(this.pos.x) > playerTrackInfo.width - this.collisionSize.x)
            {
                offRoad = 1;
                this.velocity.z *= .98;
                this.bumpTimer += this.velocity.z*rand(.8,1.2);
                if (this.bumpTimer > 200)
                {
                    this.velocity.y += min(50,this.velocity.z)*.1*rand(1,2);
                    this.bumpTimer = 0;
                    sound_bump.play();
                    //zzfx();
                }
            }
            
            this.airTime = 0;
            onGround = 1;
            this.velocity.z = Math.max(0, forwardDamping*this.velocity.z);
            if (this.velocity.z < 10)
                this.velocity.z *= .95;
        }
        else
            this.airTime += timeDelta;
        
        //if (!this.airTime && lastAirTime > .3)
        //    PlaySound(6); // land

        this.isBraking = playerInput.y<0;
        
        if (onGround)
        {
            if (playerInput.y>0)
                this.velocity.z += playerInput.y*lerp(this.velocity.z/playerMaxSpeed, playerAccel, 0);
            else if (this.isBraking)
                this.velocity.z += playerInput.y*playerBrake;
        }
        this.velocity.z = max(0, this.velocity.z);

        if (startCountdown > 0)
            this.velocity.z=0
        if (gameOverTimer.isSet())
            this.velocity = this.velocity.scale(.95);
   
        {
            // check for collisions
            const cameraOffset = playerVehicle.pos.z - cameraPlayerOffset.z;
            const cameraTrackInfo = new TrackSegmentInfo(cameraOffset);
            const cameraTrackSegment = cameraTrackInfo.segment;
            const collisionCheckDistance = 40;
            for(let i = collisionCheckDistance; i--; )
            {
                const segmentIndex = cameraTrackSegment+i;
                const trackSegment = track[segmentIndex];    
                if (!trackSegment)
                    continue;

                // collidable sprites
                for(const sprite of trackSegment.sprites)
                {
                    if (!sprite.collideSize)
                        continue;

                    const pos = trackSegment.offset.add(sprite.offset);
                    const z = pos.z - this.pos.z;
                    if (z > this.collisionSize.z || z < -this.collisionSize.z)
                        continue;
                        
                    const dx = abs(this.pos.x - pos.x);
                    const cs = this.collisionSize.x + abs(sprite.collideSize);
                    if (dx > cs)
                        continue;

                    // collision
                    //this.playerTurn = -.2*sign(this.pos.x)
                    this.velocity.x = -100*sign(this.pos.x);
                    this.velocity = this.velocity.scale(.9);
                    this.hit();
                    break;
                }
            }
        }
    }

    hit(){
        if (!this.hitTimer.active())
        {
            sound_hit.play();
            this.hitTimer.set(.5);
        }
    }
}