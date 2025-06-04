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
let sound_hit = new Sound([1.2, .2, 800, .02, .03, .18, , 2.8, , , , , , 1.4, , .15, , .6, .05, .15, -1800]);

// Gentler, more pleasant click sound
let sound_click = new Sound([0.8, , 35, .008, , .03, 2, 2.1, -30, , , , .008, , , .015, .5, , .06, 280]);

// Softer bump sound with higher pitch
let sound_bump = new Sound([2.5, .15, 450, .008, .008, .008, , .6, -40, -60, -80, .06, .02, .08, , , .03, .45, .008, .25, 280]);

// More pleasant start sound with chime-like quality
let sound_start = new Sound([.4, , 520, .05, .25, .015, 1, 0, -60, -4, -250, .04, .05, , .25, , , .65, .12, , 350]);

// Harmonious checkpoint sound
let sound_checkpoint = new Sound([.4, , 520, .05, .25, .015, 1, 0, -60, -4, -250, .04, .05, , .25, , , .65, .12, , 350]);
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
