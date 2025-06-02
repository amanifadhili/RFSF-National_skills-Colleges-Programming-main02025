# 🚗 RFSF National Skills Colleges Programming  
### 3D Driving Simulator for help in competition preparation 

---

## 📖 Overview

The **RFSF National Skills Colleges Programming** project is a **browser-based 3D driving** simulator developed using **Vanilla JavaScript, WebGL, and HTML**. It serves as an interactive and visually engaging learning platform for students from **RP Colleges** participating in the **RFSF Skills Competition in programming**.

This simulator features realistic vehicle dynamics and a fully interactive 3D environment rendered in real-time through **WebGL**. It is specifically designed for use in national skills competitions, emphasizing performance, creativity, and technical skill.

All **visual and audio assets including cars, trees, grass, signposts, and sound effects** are **procedurally generated** entirely through **code**. No **external image or sound files** are used, ensuring a fully code driven experience.

---

## ✨ Features

- ✅ **Real-Time 3D Graphics with WebGL**: High-performance, interactive 3D environment in your browser.
- 🚘 **Realistic Vehicle Physics**: Basic car mechanics implemented in JavaScript.
- 🎮 **User Controls**: Keyboard-driven vehicle control (WASD/Arrow keys).
- 📊 **Interactive HUD**: Display of in-game metrics and feedback to the user.
- 🔊 **Integrated Audio**: Sound effects triggered by vehicle actions.
- 🔄 **Modular Architecture**: Separated concerns (input, rendering, game logic, etc.) for easier learning and development.
- 🧪 **Debug Utilities**: Helpful debugging tools for developers.
- 📦 **No Installation Required**: Just clone and open in a browser—no server setup needed.

---

## 📁 Project Structure

RFSF-National_skills-Colleges-Programming/

- index.html           # Entry point HTML file
- audio.js             # Handles sound/audio playback
- debug-utils.js       # Developer tools for debugging
- draw.js              # Drawing helper methods
- game.js              # Game loop and logic controller
- generative.js        # Procedural track and scene generation
- hud.js               # Head-Up Display management
- input.js             # User input (keyboard, etc.)
- render.js            # WebGL rendering logic
- scene.js             # Scene definition and asset management
- sounds.js            # Audio asset definitions
- track.js             # Track generation and behavior
- utilities.js         # Reusable utility functions
- vehicle.js           # Vehicle control and physics logic
- webgl.js             # WebGL initialization and shader handling

---

## 🚀 Getting Started

### 1. Prerequisites
- A modern web browser (Chrome, Firefox, Edge, etc.) with **WebGL support**.
- No installation or server required.


## Usage
### 🔧 Controls
#### Key	Action
- W / ↑	: Accelerate
- S / ↓	: Brake 
- A / ←	: Turn Left
- D / →	: Turn Rightr
- R	: Reset Vehicle Position

## 🧾 Visual
- HUD Display: Shows speed, direction, and status.
- Crash/Reset Feedback: Hitting the edge resets your car.
- Debug Data: May show metrics like velocity and angle during development.

---
# 🧠 Project Explanation
This is for introducing students to:
3D Graphics: WebGL pipelines, shaders, and transformations
Physics & Math: Basic vehicle motion, velocity, friction
Input Systems: Keyboard interaction for gameplay
Browser Programming: How to create real-time apps in JavaScript
Code Architecture: How large applications can be modularized