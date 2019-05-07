document.addEventListener('DOMContentLoaded', function() {

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
        
        if (mySong.includes('.mid')) {
            console.log('yay')
            parsedMidi = loadMIDI() // MIDI route
        } else if (mySong.includes('.csv')) {
            parsedMidi = loadData() // data route
        }

        introAnimations()
    })
    
    //////////////////
    // Intro Animations
    //////////////////
    function introAnimations(fromThisCircle = 19.5) {
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
        TweenMax.staggerTo(".circle", 0.5, {
            scale: 1,
            ease: Power3.easeInOut,
            stagger: {
                grid: 'auto',
                from: fromThisCircle,
                amount: 2.5,
            }
        })
    }

    //////////////////
    // Synaesthesia Maps
    //////////////////
    var midiMap = $.getJSON({ 'url': "/scripts/midiMap.json", 'async': false });
    midiMap = JSON.parse(midiMap.responseText)[0]

    var noteMap = $.getJSON({ 'url': "/scripts/noteMap.json", 'async': false });
    noteMap = JSON.parse(noteMap.responseText)[0]

    var midiLow = 21
    var midiHigh = 100

    var colourScale = d3.scale.sqrt()
        .domain([midiLow, (midiLow + midiHigh) / 2, midiHigh]) // lowest & highest MIDI values
        .range(['#240F4A', '#B83856', '#FAC53F'])

    var sizeScale = d3.scale.sqrt()
        .domain([midiLow, midiHigh]) // lowest & highest MIDI values
        .range([1, 2])

    function getMidiScale(data) {
        let dataMin = Math.min(...data)
        let dataMax = Math.max(...data)
        let midiScale = d3.scale.linear()
            .domain([dataMin, dataMax])
            .rangeRound([midiLow, midiHigh])
        return midiScale
    }


    //////////////////
    // Parse MIDI or CSV
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
                notes_at_timecode = new Set(notes_at_timecode)

                // removes all MIDI notes ocataves X and below
                notes_at_timecode = Array.from(notes_at_timecode)
                notes_at_timecode_cleaned = []
                notes_at_timecode.forEach(note => {
                    if (midiMap[note].value > 45) { // removes all MIDI notes below 40
                        notes_at_timecode_cleaned.push(note)
                    }
                })
                if (notes_at_timecode_cleaned.length > 0) {
                    parsedMidi.push(Array.from(notes_at_timecode_cleaned))
                }
            })
            // console.log('newSongMap', newSongMap)
        })
        // console.log('parsedMidi', parsedMidi)
        return parsedMidi
    }
    
    function loadData() {
        // https://trends.google.com/trends/explore?date=2017-11-01%202018-10-31&q=flu

        let preParsedData = []
        let parsedData = []

        const dataPath = `./songs/${mySong}`
        console.log(dataPath)

        d3.csv(dataPath, function(data) {
            data.forEach(d => {
                preParsedData.push(d[10])// why is this 10?
            })
            const midiScale = getMidiScale(preParsedData)
            preParsedData.forEach(d => {
                d = midiScale(d)
                d = noteMap[d].note
                parsedData.push([d])// why is this 10?
            })
            console.log(parsedData)
        })

        // const testData = [10,20,50,60,30,20,5]
        // const midiScale = getMidiScale(testData)
        // testData.forEach(d => {
        //     d = midiScale(d)
        //     d = noteMap[d].note
        //     parsedData.push([d])
        // })

        return parsedData

    }
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
        const forwardKeys = ['ArrowRight', 'ArrowDown']
        const backwardKeys = ['ArrowLeft', 'ArrowUp']
        // const randomizeKeys = ['Space']
        if (forwardKeys.includes(event.code)) {
            stepForward()
        } else if (backwardKeys.includes(event.key)) {
            stepBackward()
        } else if (event.key === 'Space') {
        	console.log('change colours?')
            colourScale.range('black', 'grey', 'white')
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
            circles[i].style.transform = `rotate(0.5turn) scale(0)` // this is why squares vanish after the fact
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
