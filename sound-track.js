'use strict'; // Enforce strict mode to avoid common JavaScript pitfalls

// Active background music track instance
let activeMusic;

// Array of raw music data used to create music tracks
let musicTracks;

// Human-readable names for each music track
let musicTrackNames;

// Stores preloaded music instances for performance
let cachedMusic = [];

// Determines if music should be preloaded (false if debugging)
let preloadMusic = !debug;

/**
 * Initializes sound/music by loading and optionally preloading tracks.
 */
function initSounds() {
    // Define music data arrays (can be replaced with other songs or sound patterns)
    musicTracks = [BobMarleyGroove, BobMarleyGroove, BobMarleyGroove];

    // Corresponding names for music selection UI or logs
    musicTrackNames = ['Tuzarwubaka', 'Twaza', 'BobMarleyGroove'];

    // Preload music if the flag is set
    if (preloadMusic) {
        for (let i = musicTracks.length; i--;) {
            cachedMusic[i] = new Music(musicTracks[i]);
        }
    }
}

// ----------------------------------------------
// 🔊 Sound Effects (can be replaced or adjusted)
// Each `new Sound([...])` creates a sound effect with specific parameters
// You can modify the array to change tone, duration, pitch, etc.

// Sound played when something is hit or impacted
let sound_hit = new Sound([1.6, .3, 599, .03, .04, .23, , 3.1, , , , , , 1.7, , .2, , .7, .06, .2, -2328]);

// Sound played when clicking a button or UI element
let sound_click = new Sound([1.1, , 22, .01, , .04, 3, 2.3, -42, , , , .01, , , .02, .64, , .08, 352]);

// Sound played when bumping or colliding softly
let sound_bump = new Sound([3.7, .2, 387, .01, .01, .01, , .8, -59, -75, -99, .08, .03, .1, , , .04, .57, .01, .35, 369]);

// Sound played at the start of a game or event
let sound_start = new Sound([.3, , 403, .07, .33, .02, 2, 0, -79, -6, -328, .05, .06, , .3, , , .71, .14, , 267]);

// Sound played when a checkpoint is reached (can be different from start sound)
let sound_checkpoint = new Sound([.3, , 403, .07, .33, .02, 2, 0, -79, -6, -328, .05, .06, , .3, , , .71, .14, , 267]);

// ----------------------------------------------------------
// 🎶 Music Management

/**
 * Plays the selected music track by index.
 * Stops the currently playing music before switching.
 * @param {number} track - Index of the track to play.
 */
function playMusicTrack(track) {
    // Stop current music if playing
    if (activeMusic) activeMusic.stop();

    // Return if the requested track doesn't exist
    if (!musicTracks[track]) return;

    // Cache the music instance if not already done
    if (!cachedMusic[track])
        cachedMusic[track] = new Music(musicTracks[track]);

    // Play the selected track with a volume fade-in
    activeMusic = cachedMusic[track];
    activeMusic.playMusic(0.3); // Adjust volume as needed
}




const BobMarleyGroove = ([[[0.6,0,1e4,,,,,,,,,,.02,6.5,-.1],[1.2,0,84,,,,,.6,,,,.4,,6.3,1,.01],[,0,60,,.1,,2],[2,0,360,,,.12,2,2,,,,,,9,,.1],[.75,0,586,,,.25,6],[2,0,360,,,.375,2,3.5]],
[[[1,-1,24,24,26,28,28,26,24,22,21,21,22,24,24,22,22,24,24,26,28,28,26,24,22,21,21,22,24,22,21,21],
[3,1,22,,,,,,,,,,,,,,,,,,,,,,,,,,,,24,,,,24,,,,,,,,,,,,,,,,,,,,,,,,22,,22,,22,,,,],
[5,-1,21,,,,,,,,,,,,,,,,,,,,,,,,,,,,24,,,,23,,,,,,,,,,,,,,,,,,,,,,,,24,,23,,21,,,,],
[,1,21,,,,,,,,,,,,,,,,,,,,,,,,,,,,24,,,,23,,,,,,,,,,,,,,,,,,,,,,,,24,,23,,21,,,,]]],
[0]]);
