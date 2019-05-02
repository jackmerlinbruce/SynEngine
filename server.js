const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.get('/', (req, res) => {
    console.log('hello world')
})
app.get('/songSelect', (req, res) => {
    const songs = []
    const directoryPath = path.join(__dirname, './public/songs');
    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 
        //listing all files using forEach
        files.forEach(function (file) {
            // Do whatever you want to do with the file
            let song = {}
            song["path"] = file
            song["filename"] = file
            songs.push(song)
            // console.log(file); 
        });
        console.log(songs)
        res.send(songs)
    });

    
})

// Serve
const PORT = process.env.PORT || 5555;
app.listen(PORT, function(){
    console.log(`Listening on localhost:${PORT}`);
});