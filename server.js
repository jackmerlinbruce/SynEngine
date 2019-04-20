const express = require('express');
const bodyParser = require('body-parser');
const midi = require('./MIDIparser.js');

const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    console.log('hello world')
})

const PORT = process.env.PORT || 4444;
app.listen(PORT, function(){
    console.log(`Listening on ${PORT}`);
});