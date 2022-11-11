const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

const website = "https://sdarot.tw/";

const port = 80;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/search', (req, res) => {
    const name = req.body.name;
    const watchCode = 88;
    console.log(name);
    request(website + "/watch/88", (error, response, body) => {
        if (error) { console.error('error:', error); }
        console.log('statusCode:', response && response.statusCode);

        const $ = cheerio.load(body);
        
        const title = $('strong').first().text();
        const description = $('p').first().text();
        const seasons = $('#season').children().length;
        const episodes = $('#episode').children().length;
        const image = $('img').eq(3).attr('src');
        const link = website + '/watch/' + watchCode;

        const obj = {name: name, title: title, description: description, seasons: seasons, episodes: episodes, image: image, link: link};
        
        res.render('results', {data: obj});
    });
});

app.listen(port, () => {
    console.log(`web server listening on port ${port}`);
    console.log(`http://localhost:${port}`);
});