//Handles debugging-related utilities and rendering.
// Enforce strict mode for better error checking and cleaner JavaScript
'use strict';

// ================================
// Global Debug Variables
// ================================
let debug = 1;                        // General debug flag
let downloadLink;                    // Anchor element for file download
let debugMesh, debugTile;            // Used to preview 3D debug meshes and tiles
let debugTakeScreenshot;             // Flag to trigger a screenshot
let showMap = 0;                     // Toggle map preview display
let debugGenerativeCanvas = 0;       // Toggle generative canvas debug view
let debugInfo = 1;                   // Toggle on-screen debug information

// ================================
// Global Error Handler
// ================================
onerror = (event, source, lineno, colno, error) => {
    document.body.innerHTML = `<pre style="color:red;font-size:20px;">
${event}\n${source}\nLn ${lineno}, Col ${colno}</pre>`;
};

// ================================
// Debug Utilities
// ================================

/**
 * Assertion utility - wraps console.assert
 */
function ASSERT(condition, message) {
    message ? console.assert(condition, message) : console.assert(condition);
}

/**
 * Logs any number of arguments to the console.
 */
function LOG(...args) {
    console.log(...args);
}

/**
 * Initializes debug environment: prepares hidden download link.
 */
function debugInit() {
    downloadLink = document.createElement('a');
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
}

/**
 * Saves a canvas as an image file.
 */
function debugSaveCanvas(canvas, filename = engineName, type = 'image/png') {
    debugSaveDataURL(canvas.toDataURL(type), filename);
}

/**
 * Saves plain text as a downloadable file.
 */
function debugSaveText(text, filename = engineName, type = 'text/plain') {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    debugSaveDataURL(url, filename);
}

/**
 * Initiates download of data via a data URL.
 */
function debugSaveDataURL(dataURL, filename) {
    downloadLink.download = filename;
    downloadLink.href = dataURL;
    downloadLink.click();
}
