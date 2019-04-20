// var fs = require('fs')
// var Midi = require('midi-file')
// const songPath = "./public/songs/sweetChildOfMine.mid"
// const midiData = fs.readFileSync(songPath)
// const midi = new Midi(midiData)

// const Midi = require('@tonejs/midi')
// const midi = Midi.fromUrl("./public/songs/sweetChildOfMine.mid")
// const name = midi.name

// midi.tracks.forEach(track => {

//     const notes = track.notes
//     notes.forEach(note => {
//     })

//     track.controlChanges[64]
//     track.controlChanges.sustain.forEach(cc => {
//     })

// })


// module.exports = name


// var fs = require('fs')
// var Midi = require('midi-file')
// var parseMidi = require('midi-file').parseMidi
// var writeMidi = require('midi-file').writeMidi

// // Read MIDI file into a buffer
// var input = fs.readFileSync('./public/songs/sweetChildOfMine.mid')

// // Parse it into an intermediate representation
// // This will take any array-like object.  It just needs to support .length, .slice, and the [] indexed element getter.
// // Buffers do that, so do native JS arrays, typed arrays, etc.
// var parsed = parseMidi(input)

// // Turn the intermediate representation back into raw bytes
// var output = writeMidi(parsed)

// // Note that the output is simply an array of byte values.  writeFileSync wants a buffer, so this will convert accordingly.
// // Using native Javascript arrays makes the code portable to the browser or non-node environments
// var outputBuffer = new Buffer(output)

// // Write to a new MIDI file.  it should match the original
// fs.writeFileSync('copy_star_wars.mid', outputBuffer)