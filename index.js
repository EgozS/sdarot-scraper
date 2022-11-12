//libs
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');
const cheerio = require('cheerio');

//varibles
const website = "https://sdarot.tw/";
const searchUrl = "https://sdarot.tw/search?term=";
const port = 80;

//express settings
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: false }));

//routes
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/search', (req, res) => {
    var nameSearch = req.body.name;
    //checking if what the user searched has any spaces and if it does it replaces it with a + sign
    if (nameSearch.includes(" ")) {
        const nameSearchArray = nameSearch.split(" ");
        if (nameSearchArray[1] != "") {
            nameSearchArray[0] = nameSearchArray[0] + "+";
            nameSearchArray[1] = nameSearchArray[1];
            nameSearch = nameSearchArray.join("");
        } else {
            nameSearchArray[0] = nameSearchArray[0];
            nameSearchArray[1] = nameSearchArray[1];
            nameSearch = nameSearchArray.join("");
        }
        
    }
    res.redirect('/search?q=' + nameSearch);
    
});

app.get('/search', (req, res) => {
    //gather data from search
    const name = req.query.q;
    //request the search page
    request(searchUrl + name, (error, response, html) => {
        //check if the request is being redirected
        if (response.request.uri.href != searchUrl + name) {
            //getting the new url
            const newUrl = response.request.uri.href;
            //getting the first 4 numbers after /watch/
            const id = newUrl.substring(newUrl.indexOf('/watch/') + 7, newUrl.indexOf('/watch/') + 11);
            //filter everyhind that is not a number
            const newId = id.replace(/\D/g, '');
            //redirect to /title/id
            if (newId != '') {
                res.redirect('/title/' + newId);
            }
            else {
                res.redirect('/?error=418');
            }
        }
        //if the request is not being redirected
        else {
        //checking if the request was sucsseful
        if (!error && response.statusCode == 200) {
            //getting the html of the page
            const $ = cheerio.load(html);
            const searchResults = [];
            
            //getting the search results
            const h5 = $('h5');
            const div = $('div.sInfo.text-center');
            const a2 = div.find('a');
            
            //getting the images from the search results
            const img = $('img.img-rounded.img-responsive.pointer');
            const imgSrc = [];
            img.each((i, el) => {
                imgSrc[i] = $(el).attr('src');
            });
            
            //getting the links and watchCodes from the results then assigning them to an object
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
            //debug
            //console.log(searchResults);

            //render the search page
            res.render('search', { data: searchResults, searchName: name });

        }
        else {
            //if the request was not sucsseful
            console.log(error);
        }

        }
        
    });

});

app.get('/title/:watchCode', (req, res) => {
    //getting the watchCode from the url
    const watchCode = req.params.watchCode;

    //request the title page
    request(website + "/watch/" + watchCode, (error, response, body) => {
        //checking if the request was sucsseful
        if (!error && response.statusCode == 200) {
        //getting the html of the page
        const $ = cheerio.load(body);
        
        //gather data from the page
        const title = $('strong').first().text();
        const description = $('div.col-lg-9.col-md-8.col-sm-7.col-xs-12').find('p').first().text();
        const seasons = $('#season').children().length;
        const episodes = $('#episode').children().length;
        const image = $('img').eq(3).attr('src');
        const link = website + 'watch/' + watchCode;

        //assigning the data to an object
        const obj = {title: title, description: description, seasons: seasons, episodes: episodes, image: image, link: link, watchCode: watchCode};
        
        //loop through the seasons and assign episodes to each season in an object, name each episode with the episode number and assign the episode link to it then push the episode to the season object and push the season to the seasons array
        const seasonsArray = [];
        var season = {};
        for (let i = 1; i <= seasons; i++) {
            season = {seasonNumber: i, episodes: []};
            for (let j = 1; j <= episodes; j++) {
                const episode = {episodeNumber: j, link: website + 'watch/' + watchCode + '/season/' + i + '/episode/' + j};
                //debug
                //console.log(episode);
                season.episodes.push(episode);
            }
            seasonsArray.push(season);
        }
        //debug
        //console.log(seasonsArray[0].episodes[0]);
        //console.log(season)

        //rendering the title page with the object and the seasons array
        res.render('results', {data: obj, seasons: seasonsArray});
        }
        });
});

app.get('/title/:watchCode/season/:seasonNumber', (req, res) => {
    //getting the watchCode, seasonNumber and episodeNumber from the url
    const watchCode = req.params.watchCode;
    const seasonNumber = req.params.seasonNumber;
    const episodesArray = [];

    //request the title page
    request(website + "/watch/" + watchCode + "/season/" + seasonNumber, (error, response, body) => {
        //checking if the request was sucsseful
        if (!error && response.statusCode == 200) {
        //getting the html of the page
        const $ = cheerio.load(body);
        const episodes = $('#episode').children().length;
        const title = $('strong').first().text();
        const image = $('img').eq(3).attr('src');
        dataObj = {title: title, watchCode: watchCode, seasonNumber: seasonNumber, episodes: episodes, img: image};
        for (let i = 1; i <= episodes; i++) {
            const episode = {episodeNumber: i, link: website + 'watch/' + watchCode + '/season/' + seasonNumber + '/episode/' + i};
            episodesArray.push(episode);
        }
        
        //debug
        //console.log(episodesArray);
        res.render('episodes', {episodes: episodesArray, data:dataObj});
        }
    });
    
    

    
});

app.get("*", (req, res) => {
    res.redirect('/?error=418');
});

app.listen(port, () => {
    console.log(`web server listening on port ${port}`);
    console.log(`http://localhost:${port}`);
});