const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

const website = "https://sdarot.tw/";
const searchUrl = "https://sdarot.tw/search?term=";

const port = 80;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/search', (req, res) => {
    const nameSearch = req.body.name;
    const name = nameSearch.split(' ').join('+');
    res.redirect('/search?q=' + name);
    
});

app.get('/search', (req, res) => {
    const name = req.query.q;
    request(searchUrl + name, (error, response, html) => {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);
            const searchResults = [];
            
            const h5 = $('h5');
            const div = $('div.sInfo.text-center');
            const a2 = div.find('a');
            

            const img = $('img.img-rounded.img-responsive.pointer');
            const imgSrc = [];
            img.each((i, el) => {
                imgSrc[i] = $(el).attr('src');
            });
            

            for (let i = 0; i < h5.length; i++) {
                const h5Text = $(h5[i]).text();
                const link = $(a2[i]).attr('href');
                const watchCode = link.match(/\d+/g).map(Number);    
                
                if (link.includes('/watch/')) {
                    searchResults.push({
                        name: h5Text,
                        link: link,
                        //get the number after /watch/
                        watchCode: watchCode,
                        img: imgSrc[i]
                    });                
                    
                }
                
            }
            console.log(searchResults);
            res.render('search', { data: searchResults, searchName: name });

        }
        else {
            console.log(error);
        }
        
    });

});

app.get('/title/:watchCode', (req, res) => {
    const watchCode = req.params.watchCode;

    request(website + "/watch/" + watchCode, (error, response, body) => {
        if (!error && response.statusCode == 200) {

        const $ = cheerio.load(body);
        
        const title = $('strong').first().text();
        const description = $('p').first().text();
        const seasons = $('#season').children().length;
        const episodes = $('#episode').children().length;
        const image = $('img').eq(3).attr('src');
        const link = website + 'watch/' + watchCode;

        const obj = {title: title, description: description, seasons: seasons, episodes: episodes, image: image, link: link, watchCode: watchCode};
        
        res.render('results', {data: obj});
        
        }
        });
});

app.listen(port, () => {
    console.log(`web server listening on port ${port}`);
    console.log(`http://localhost:${port}`);
});