const url = "http://localhost:3000/api/v1/tunes";

// Mapping of keyboard keys to notes
const keyToNote = {
    "a": "c4",
    "w": "c#4",
    "s": "d4",
    "e": "d#4",
    "d": "e4",
    "f": "f4",
    "t": "f#4",
    "g": "g4",
    "y": "g#4",
    "h": "a4",
    "u": "bb4",
    "j": "b4",
    "k": "c5",
    "o": "c#5",
    "l": "d5",
    "p": "d#5",
    //  Both ; and æ work for e5 (for engilsh and icelandic keyboards)
    ";": "e5",
    "æ": "e5",
};

const noteDuration = "8n"

// Initialise the synthesiser using the Tone.js library
const synth = new Tone.Synth().toDestination();

let allTunes = [];
let recording = [];
let isRecording = false;
let recordingStartTime = 0;


// Keyboard key press
document.addEventListener("keydown", handleKeyDown);

// Play tune button
document.getElementById("tunebtn").addEventListener("click", playSelectedTune);

// Record button
document.getElementById("recordbtn").addEventListener("click", startRecording);

// Stop button
document.getElementById("stopbtn").addEventListener("click", stopRecording);


// A tone is a single note, but a tune is a progression of notes

// Play a tone by pressing piano key buttons
function playTone(note) {
    let tone = note.id
    synth.triggerAttackRelease(tone, noteDuration);
    // If currently reccording, record tone
    if (isRecording) {
        recordTonePlayed(tone);
    }
};

// Play a tone using the keyboard keys
function handleKeyDown(event) {
    // Ignore event if the record name input has focus (user is typing the name)
    if (document.activeElement === document.getElementById("recordName")) {
        return;
    }
    // If pressed keyboard key is a valid piano key
    if (event.key in keyToNote) {
        let tone = keyToNote[event.key];

        // If currently reccording, record tone
        if (isRecording) {
            recordTonePlayed(tone);
        }

        let keyElement = document.getElementById(tone);
        // change key color to show that the piano key is pressed
        keyElement.style.backgroundColor = "rgb(152, 152, 152)";
        synth.triggerAttackRelease(tone, noteDuration)
        // Remove focus
        document.activeElement.blur();

        // Reset key color after 200 milliseconds
        setTimeout(function () {
            keyElement.style.backgroundColor = "";
        }, 200);
    }
};

// Record tone by adding its details to the end of the reccording array
function recordTonePlayed(tone) {
    let timePassed = Date.now() - recordingStartTime;
    recording.push({note: tone, duration: noteDuration, timing: timePassed/1000});  // devide by 1000 to convert timing from milliseconds to seconds
};


// Load tunes from the server
async function loadTunes() {
    try {
        const response = await axios.get(url);
        //When successful, print the received data
        console.log("Success: ", response.data);
        allTunes = response.data;
        populateDropdown();
    } 
    catch (error) {
        console.log("Failed to load tunes:", error);
    }
};

// Updates the Dropdown selector with loaded tunes
function populateDropdown() {
    let dropdown = document.getElementById("tunesDrop");
    // replace existing content with the new list of tunes
    dropdown.innerHTML = allTunes.map((tune, i) => {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = tune.name;
        return option.outerHTML;
    }).join("");
};

// Plays a tune from dropdown selector
function playSelectedTune() {
    let selectedIndex = document.getElementById("tunesDrop").value;
    let selectedTune = allTunes[selectedIndex];
    let now = Tone.now();
    selectedTune.tune.forEach(({note, duration, timing}) => {
        synth.triggerAttackRelease(note, duration, now + timing);
    });
};


// Create a new tune on the server and refresh loaded tunes
async function createNewTune() {
    let tuneName = document.getElementById("recordName").value || "No-name Tune";

    try {
        const response = await axios.post(url, {name: tuneName, tune: recording});
        console.log("New tune created:", response.data);
        loadTunes();
            
    } 
    catch (error) {
        console.log("Failed to create tune:", error);
    }
};

// Start recording session
function startRecording() {
    let recordBtn = document.getElementById("recordbtn");
    let stopBtn = document.getElementById("stopbtn");
    recordBtn.disabled = true;
    stopBtn.disabled = false;
    // Remove focus
    document.activeElement.blur();
    
    // If the record name is empty, remind user to input name
    if (recordName.value === "") {
        recordName.focus();
    }

    recording = [];
    recordingStartTime = Date.now();
    isRecording = true;
};

// End recording session, create new tune if not recording is not empty
function stopRecording() {
    let recordBtn = document.getElementById("recordbtn");
    let stopBtn = document.getElementById("stopbtn");
    recordBtn.disabled = false;
    stopBtn.disabled = true;
    
    recordingStartTime = 0;
    isRecording = false;
  
    if (recording.length > 0) {
        createNewTune();
    }
    // Clear record name
    document.getElementById("recordName").value = "";
};


loadTunes();