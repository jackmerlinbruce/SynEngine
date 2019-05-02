document.addEventListener('DOMContentLoaded', function() {
    //////////
    // Synth
    //////////
    var synth = new Tone.PolySynth(12, Tone.Synth).set({
        "filter" : {
          "type" : "highpass"
        },
        "envelope" : {
          "attack" : 0.05,
          // "release": 0.6
        }
    }).toMaster()

    //////////
    // Select Song
    //////////
    const songSelect = document.getElementById('songSelect');
    let mySong = null
    fetch('/songSelect')
        .then(res => res.json())
        .then(files => {
            const container = document.createElement('div');
            container.innerHTML = `<option value="" disabled selected>Choose your song</option>`
            files.forEach(file => {
                container.innerHTML += `<option value="${file.path}">${file.filename}</option>`;
            });
            songSelect.innerHTML = container.innerHTML;
        })
        .catch(err => {
            console.log('err', err);
        });

    songSelect.addEventListener('change', function(e){
        mySong = e.target.value;
        currentPos = 0 // reset playhead
        parsedMidi = [] // nuke the MIDI stream
        parsedMidi = loadMIDI()
    })
    
    //////////
    // Song
    // https://github.com/Tonejs/Midi/blob/master/examples/load.html
    //////////
    /*
        TO DO:
        - put all notes that occur at the samne time or NEAR (e.g. to 2 dp) in the same array
        - this will get triggered when i press ArrowLeft
    */
    function loadMIDI() {
        let song = []
        let newSong = []
        let parsedMidi = []
        // const songPath = "./songs/The_Eurythmics_-_Sweet_Dreams.mid"
        const songPath = `./songs/${mySong}`
        console.log(songPath)

        Midi.fromUrl(songPath).then(midi => {
            console.log('MIDI tracks', midi.tracks)
            midi.tracks.forEach(track => {
                track.notes.forEach(note => {
                    song.push(note.name)
                    newSong.push([note.name, note.time.toFixed(1)]) // toFixed is quantization
                })
            })   

            console.log('newSong', newSong)
            var newSongMap = {}
            newSong.forEach(i => {
                // create a time map of empty arrays
                time = i[1]
                newSongMap[time] = []
            })
            newSong.forEach(i => {
                // for each same time code array, push every note playing at that time 
                note = i[0]
                time = i[1]
                newSongMap[time].push(note)
            })
            Object.values(newSongMap).forEach(notes_at_timecode => {
                // grabs the UNIQUE note arrays out of the newSongMap obj
                //!!! remove all MIDI notes ocataves 2 and below
                notes_at_timecode = new Set(notes_at_timecode)
                parsedMidi.push(Array.from(notes_at_timecode))
            })
            console.log('newSongMap', newSongMap)
        })
        console.log('parsedMidi', parsedMidi)

        return parsedMidi

    }

    // const sweetChildOfMine = [['C3', 'E4'],'C5','G4','F4','F5','G4','Fb5','G4']
    // song = sweetChildOfMine
    // song = parsedMidi
    let currentPos = 0

    //////////
    // Controls
    //////////
    let stepForward = function() {
        console.log(currentPos, parsedMidi[currentPos])
        // console.log(synths[currentPos])
        synth.triggerAttackRelease(parsedMidi[currentPos], '16n')
        if (currentPos === parsedMidi.length - 1) { // if at end of sequence
            currentPos = 0 // resets to begining
        } else {
            currentPos ++ // moves to next step
        }
        
        // let background = document.querySelector('body').style
        // background.backgroundColor = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`
        square.classList.toggle('on')
        
    }

    let stepBackward = function() {
        if (currentPos === 0) { // if at start of sequence
            currentPos = song.length - 1 // resets to end
        } else {
            currentPos -- // moves to previous
        }
        console.log(currentPos, parsedMidi[currentPos])
        synth.triggerAttackRelease(parsedMidi[currentPos], '16n')

        // let background = document.querySelector('body').style
        // background.backgroundColor = `rgb(${col}, ${col}, ${col})`

    }

    let right = 1, left = 1
    window.addEventListener('keydown', (event) => {
        const forwardKeys = ['ArrowRight', 'ArrowDown', 'Space']
        const backwardKeys = ['ArrowLeft', 'ArrowUp']
        if (forwardKeys.includes(event.code)) {
            stepForward()
        } else if (backwardKeys.includes(event.key)) {
            stepBackward()
        } else if (event.code === 'KeyD') {
            square.style.transform = `translate(${right * 100}%)`
            right ++
            stepForward()
        } else if (event.code === 'KeyA') {
            square.style.transform = `translate(${left * -100}%)`
            left ++
            stepForward()
        }
    })
    window.addEventListener('keyup', (event) => {
        const forwardKeys = ['ArrowRight', 'ArrowDown', 'Space']
        const backwardKeys = ['ArrowLeft', 'ArrowUp']
        if (forwardKeys.includes(event.code)) {
            square.classList.toggle('on')
        } 
    })


    const square = document.getElementById('square')
    square.addEventListener('mouseover', (event) => {
        stepForward()
    })
    square.addEventListener('mouseout', (event) => {
        square.classList.toggle('on')
    })
    square.addEventListener('touchstart', (event) => {
        stepForward()
    })
    square.addEventListener('touchend', (event) => {
        square.classList.toggle('on')
    })
    
})
