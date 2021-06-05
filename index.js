const express = require('express');
const router = express.Router();
const fs = require('fs');
const { exec } = require('child_process');
const { response, json, request } = require('express');
const { stdout, stderr } = require('process');
const db_videos = require('./db_queries_videos');
const https = require('https');
const unirest = require('unirest');
const fetch = require('node-fetch');

var config = require('./config.js');

// HTTPS options

options = {
key: fs.readFileSync(config.secure.privkey_location, 'utf8'),
cert: fs.readFileSync(config.secure.cert_location, 'utf8')
};

const app = express();
const http = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname+'/public'));
app.use(express.json());
app.use(express.urlencoded());

// Folders to images and TV Show assets
const assets = config.library;
const images = config.images;

// Default welcome page
router.get('/', (req, res) => {
    res.render('index');
});

// Video Streaming Endpoint which pipes the video data
router.get('/video/:showName/:epName', (req, res) => {
    console.log("This got accessed");

    const showName = req.params.showName;
    const epName = req.params.epName;

    const path = `${assets}/TV Shows/${showName}/${epName}`
    console.log("Path to file " + path)

    fs.stat(path, (err, stat) => {

        // Handle file not found
        if (err !== null && err.code === 'ENOENT') {
            res.sendStatus(404);
        }

        const fileSize = stat.size
        const range = req.headers.range

        if (range) {

            const parts = range.replace(/bytes=/, "").split("-");

            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;

            const chunksize = (end-start)+1;
            const file = fs.createReadStream(path, {start, end});
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            }

            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            }

            res.writeHead(200, head);
            fs.createReadStream(path).pipe(res);
        }
    });
})

// Directory page with list of shows being displayed
router.get('/dir', (req, res) => {
    exec(`python3.9 python_module/get_all_shows.py`, (err, stdout, stderr) =>{
        if (err) {
            throw err
        }
        
        var string_of_shows = stdout;
        var list_of_shows = string_of_shows.split(',')
        list_of_shows.pop(list_of_shows.length)
        var list_of_urls = []

        list_of_shows.forEach(element => {
            list_of_urls.push(`/shows/${element}`)
        });


        var list_of_images = []
        var dict = {}
        
        list_of_shows.forEach(element =>{
            var temp = element.slice(0,15)
            fetch(`https://api.themoviedb.org/3/search/tv?api_key=${config.tmdb.api_key}&language=en-US&page=1&query=${temp}&include_adult=true`)
            .then(res => res.json())
            .then(json => {
                if (typeof json.results[0] === 'undefined') {
                    list_of_images.push(`/${images}/${element}/preview.jpg`)
                    dict[element] = {poster : `/${images}/${element}/preview.jpg`,
                    show_name : element,
                    overview : "No overview available",
                    aired : "No data available"}
                } else {
                    list_of_images.push(`https://image.tmdb.org/t/p/w500${json.results[0].poster_path}`)
                    var truncated = json.results[0].overview

                    // Cropping the overview length if > than 275 char
                    if (truncated.length > 275) {
                        truncated = truncated.substr(0,275) + '...'
                    }

                    dict[element] = {poster : `https://image.tmdb.org/t/p/w500${json.results[0].poster_path}`,
                                    show_name : json.results[0].name,
                                    overview : truncated,
                                    aired: json.results[0].first_air_date}
                }

                if (list_of_images.length === list_of_shows.length) {
                    var temp = []
                    var _shows = [] 
                    var _img = []
                    var _show_name = []
                    var _overview = []
                    var _aired = []                  
                    
                    for(var key in dict) {
                        temp.push(key)
                    }

                    temp.sort()
                    console.log(temp)

                    for (var key of temp) {
                        _shows.push(key)
                        _img.push(dict[key].poster)
                        _overview.push(dict[key].overview)
                        _show_name.push(dict[key].show_name)
                        _aired.push(dict[key].aired)
                    }

                    console.log(_aired)


                    res.render('dir', {
                        list_of_shows: _shows,
                        list_of_images: _img,
                        show_name: _show_name,
                        overview: _overview,
                        aired: _aired
                    })
                }
            }

            )
        })
    })
})



// Show page depending on the show name
router.get('/shows/:showName', (req, res) => {
    console.log(req.params.showName)
    showName = req.params.showName;

    exec(`python3.9 python_module/get_all_eps.py '${req.params.showName}'`, (err, stdout, stderr) =>{
        if (err) {
            throw err
        }

        var list_of_eps = stdout.split(',')
        list_of_eps.pop(list_of_eps.length)
        const ep_images = []
        
        list_of_eps.forEach(element => {
            fs.access(`public/${images}/${showName}/${element}.jpg`, fs.F_OK, (err) => {

                if (err) {
                  console.log(err)
                    exec(`${__dirname}/ffmpeg/ffmpeg -i '${assets}/TV Shows/${showName}/${element}' -ss 00:00:10.00 -r 1 -an -vframes 1 -f mjpeg 'public/${images}/${showName}/${element}.jpg'`, (error, stdout, stderr) => {
                        if (error) {
                            console.log(error);
                            return;
                        }
        
                        console.log("Thumbnail Redone");
        
                        ep_images.push(`/${images}/${showName}/${element}.jpg`)

                    });
                } else {
                    console.log("There is an image for " + `${element}`)
                }
            });
        })

        list_of_eps.forEach(element => {
            ep_images.push(`/${images}/${showName}/${element}.jpg`)
        })
        
        console.log(list_of_eps)
        console.log(ep_images)

        res.render('show', {
            list_of_eps: list_of_eps,
            ep_images: ep_images,
            showName: req.params.showName,
        })
        
    })
})

// Episode Page depending on the 
router.get('/shows/:showName/:episode', (req, res) => {
    showName = req.params.showName;
    epName = req.params.episode;

    fs.access(`public/${images}/${showName}/${epName}.jpg`, fs.F_OK, (err) => {

        if (err) {
          console.log(err)
            exec(`ffmpeg/ffmpeg -i '${assets}/TV Shows/${showName}/${epName}' -ss 00:00:10.00 -r 1 -an -vframes 1 -f mjpeg 'public/${images}/${showName}/${epName}.jpg'`, (error, stdout, stderr) => {
                if (error) {
                    console.log(error);
                    return;
                }

                console.log("Thumbnail Redone");

                res.render('episode_play', {
                    image: `/${images}/${showName}/${epName}.jpg`,
                    video_path: `/video/${showName}/${epName}`
                });
            });
        } else {
            res.render('episode_play', {
                image: `/${images}/${showName}/${epName}.jpg`,
                video_path: `/video/${showName}/${epName}`,
                ep_name: `${req.params.episode}`
            });
        }
    });
})


// REGISTERING AND LOGGING IN FUNCTIONALITY
// Not Implemented Yet

router.get('/login',(req,res)=>{
    res.render('login');
})
router.get('/register',(req,res)=>{
    res.render('register')
})

router.post('/register', (req,res) => {
    
})

router.post('/login', (req,res,next) => {

})

router.get('/logout', (req, res) => {
    
})


// TODO: Replace python code which contacts with Database with native nodejs library

//router.get('/getShowNames', db_videos.getShowNames)
//router.get('/getEpisodes/:showName', db_videos.getEpisodeNames)


// Looking for changes in TV Shows directory and updating DB

setInterval(() =>{
    exec (`python3.9 python_module/parse_files.py`, (err, stdout, stderr) =>{
        console.log(stdout)
        if (err) {
            throw err
        }
        console.log("Scanned Library Files");
        console.log(stdout);
    })
}, 750000)

app.use(router);

app.enable('trust proxy');
app.use((req, res, next) => {
    req.secure ? next() : res.redirect('https://' + req.headers.host + req.url)
});

const PORT = process.env.PORT || config.ports.https;

var server = https.createServer(options, app).listen(PORT, function(){
  console.log("Express server listening on port " + PORT);
});

//HTTP redirect

http.get('*', function(req, res) {
    res.redirect('https://' + req.headers.host + req.url);

    // Or, if you don't want to automatically detect the domain name from the request header, you can hard code it:
    // res.redirect('https://example.com' + req.url);
})

http.listen(config.ports.http);