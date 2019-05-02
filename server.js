const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    console.log('hello world')
})

app.post('/', (req, res) => {
    console.log('hello world')
})

const PORT = process.env.PORT || 5555;
app.listen(PORT, function(){
    console.log(`Listening on localhost:${PORT}`);
});