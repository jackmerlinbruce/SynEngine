document.addEventListener('DOMContentLoaded', function() {

    //////////////////
    // Intro Animations
    //////////////////
    function introAnimations(fromThisCircle=19.5) {
        noteCounter.innerText = `Notes remaining: ${circles.length}`
        TweenMax.staggerFrom(".circle", 0.5, {
            scale: 0.1,
            opacity: 0,
            // y: 40,
            ease: Power3.easeInOut,
            stagger: {
                grid: 'auto',
                from: fromThisCircle,
                amount: 2.5,
            }
        })
    }

    //////////////////
    // Synth
    //////////////////
    var synth = new Tone.PolySynth(6, Tone.Synth).set({
        "filter" : {
          "type" : "highpass"
        },
        "envelope" : {
          "attack" : 0.05,
        }
    }).toMaster()

    //////////////////
    // Select Song
    //////////////////
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
        introAnimations()
        
    })
    
    //////////////////
    // Parse MIDI
    // https://github.com/Tonejs/Midi/blob/master/examples/load.html
    //////////////////
    function loadMIDI() {
        let newSong = []
        let parsedMidi = []
        const songPath = `./songs/${mySong}`
        console.log(songPath)
        
        Midi.fromUrl(songPath).then(midi => {
            console.log('MIDI tracks', midi.tracks)
            midi.tracks.forEach(track => {
                track.notes.forEach(note => {
                    newSong.push([note.name, note.time.toFixed(1)]) // toFixed is quantization
                })
            })   

            // console.log('newSong', newSong)
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
            // console.log('newSongMap', newSongMap)
        })
        console.log('parsedMidi', parsedMidi)
        return parsedMidi
    }

    //////////////////
    // Synaesthesia Maps
    //////////////////
    var midiMap = $.getJSON({ 'url': "/scripts/midiMap.json", 'async': false });
    midiMap = JSON.parse(midiMap.responseText)[0]

    var midiLow = 21
    var midiHigh = 128

    let colourScale = d3.scale.sqrt()
        .domain([midiLow, (midiLow + midiHigh) / 2, midiHigh]) // lowest & highest MIDI values
        .range(['#240F4A', '#B83856', '#FAC53F'])

    let sizeScale = d3.scale.sqrt()
        .domain([midiLow, midiHigh]) // lowest & highest MIDI values
        .range([1, 2])

    //////////////////
    // Playhead
    //////////////////
    let currentPos = 0
    let avgMidiValue = null

    let stepForward = function(stayOnNote=false) {
        let notes = parsedMidi[currentPos]
        console.log(currentPos, notes)

        // PLAY NOTES  
        synth.triggerAttackRelease(notes, '16n')
        if (currentPos === parsedMidi.length - 1) { // if at end of sequence
            currentPos = 0 // resets to begining
        } else {
            stayOnNote ? currentPos : currentPos ++ // moves to next step
        }
        
        // GENERATE COLOUR
        let midiValues = []
        notes.map(note => {
            // convert the note names into numerical midi values
            midiValues.push(midiMap[note].value)
        })

        function getAvgMidiValue(kind='average') {
            // can change the method of getting the midi colour mapping value
            // either the AVERAGE value of the notes (less variation in colour)
            // or the MAX value of the notes (more variation in colour)
            if (kind === 'average') {
                let sumMidiValue = midiValues.reduce((previous, current) => current += previous);
                midiMappingValue = sumMidiValue / midiValues.length;
            } else if (kind === 'max') {
                midiMappingValue = Math.max(...midiValues)
            }
            return midiMappingValue
        }
        avgMidiValue = getAvgMidiValue(kind='max')

        // INCREMENT NOTE COUNTER
        let noteCounter = document.getElementById('noteCounter')
        var notesRemaining = circles.length-currentPos
        noteCounter.innerText = `Notes remaining: ${notesRemaining}`
        if (notesRemaining == 0) {
            notesRemaining = circles.length
            introAnimations(circleID)
        } 
    }
    
    let stepBackward = function() {
        if (currentPos === 0) { // if at start of sequence
            currentPos = song.length - 1 // resets to end
        } else {
            currentPos -- // moves to previous
        }
        console.log(currentPos, parsedMidi[currentPos])
        synth.triggerAttackRelease(parsedMidi[currentPos], '16n')
    }


    //////////////////
    // Playhead Controls
    //////////////////

    // ARROW KEYS
    window.addEventListener('keydown', (event) => {
        const forwardKeys = ['ArrowRight', 'ArrowDown', 'Space']
        const backwardKeys = ['ArrowLeft', 'ArrowUp']
        if (forwardKeys.includes(event.code)) {
            stepForward()
        } else if (backwardKeys.includes(event.key)) {
            stepBackward()
        } 
    })

    // GRID
    let body = document.querySelector('body')
    var circles = document.getElementsByClassName('circle')
    var circleID = null
    for (let i = 0; i < circles.length; i++) {
        circles[i].addEventListener('mouseover', (e) => {
            circles[i].className = circles[i].className + " on"
            stepForward()
            console.log(avgMidiValue)
            // the reason all this colour change logic can't be in "stepForward()" is that
            // we need knowledge of *which* square's style to change, i.e, "circles[i]"
            circles[i].style.backgroundColor = colourScale(avgMidiValue) 
            circles[i].style.transform = `scale(${sizeScale(avgMidiValue)})`
            body.style.backgroundColor = colourScale(avgMidiValue)
            body.style.opacity = 0.7
            circleID = i // used to set the introAnimation()
        })
        circles[i].addEventListener('mouseout', (e) => {
            circles[i].className = circles[i].className.replace(" on", "")
            circles[i].style.backgroundColor = 'black'
            circles[i].style.transform = `scale(0)` // this is why squares vanish after the fact
        })

        circles[i].addEventListener('mousedown', (e) => {
            stepForward(stayOnNote=true)
            circles[i].style.backgroundColor = 'white'
            circles[i].style.transform = `rotate(0.5turn)`
        })
        circles[i].addEventListener('mouseup', (e) => {
            circles[i].style.backgroundColor = colourScale(avgMidiValue)
        })
    }
    

})
