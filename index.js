const express = require('express');
const router = express.Router();
const fs = require('fs');
const { exec } = require('child_process');
const { response } = require('express');
const { stdout, stderr } = require('process');
const db = require('./db_queries_users');
const https = require('https');
const http = require('http');

const LogRocket = require('logrocket');


LogRocket.init('pcp3y1/website');


// Database shiz

// Certificate

options = {
key: fs.readFileSync("/etc/letsencrypt/live/kiliuchok.club/privkey.pem", 'utf8'),
cert: fs.readFileSync("/etc/letsencrypt/live/kiliuchok.club/fullchain.pem", 'utf8')
};




const app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname+'/public'));
app.use(express.json());
app.use(express.urlencoded());

// File System get Requests I assume

    // Change to DB path TODO
const assets = 'public/videoassets';

videoName = 'attack.mp4';


//
//
//

router.get('/', (req, res) => {

    fs.access(assets+'/images/'+videoName+'.jpg', fs.F_OK, (err) => {

        if (err) {
            exec(`/Users/kostia/Desktop/Website/ffmpeg/ffmpeg -i ${assets}/${videoName.replace(/\s/g, '\ ')}.mp4 -ss 00:00:04.00 -r 1 -an -vframes 1 -f mjpeg ${assets}/images/${videoName.replace(/\s/g, '\ ')}.jpg`, (error, stdout, stderr) => {
                if (error) {
                    console.log(error);
                    return;
                }

                console.log("Thumbnail Redone");

                res.render('index', {
                    image: `/videoassets/images/${videoName}.jpg`,
                    video_path: `/videoassets/attack.mp4`
                });
            });
        }

        if(err === null) {
            res.render('index', {
                image: `/videoassets/images/${videoName}.jpg`,
                video_path: `/videoassets/attack.mp4`
            });
        }
    });
});

router.get('/videos/:videName', (req, res) => {

    console.log(req.params.videName);
    video_name = req.params.videName;
    fs.access(assets+`/images/${video_name}.jpg`, fs.F_OK, (err) => {

        if (err) {
          console.log(err)
            exec(`/Users/kostia/Desktop/Website/ffmpeg/ffmpeg -i '${assets}/${videoName}' -ss 00:00:04.00 -r 1 -an -vframes 1 -f mjpeg '${assets}/images/${video_name}.jpg'`, (error, stdout, stderr) => {
                if (error) {
                    console.log(error);
                    return;
                }

                console.log("Thumbnail Redone");

                res.render('index', {
                    image: `/videoassets/images/${req.params.videName}.jpg`,
                    video_path: `/video/${video_name}`
                });
            });
        } else {
            console.log("Here")
            res.render('index', {
                image: `/videoassets/images/${req.params.videName}.jpg`,
                video_path: `/video/${video_name}`
            });
        }
    });
});


router.get('/video/:videName', (req, res) => {

    console.log("This got accessed");
    const path = `${assets}/TV Shows/Miscellenious/${req.params.videName}`;
    console.log(path);

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
});

//
//
//

// Users part

router.get('/users', db.getUsers)
router.get('/users/:id', db.getUserById)
router.post('/users', db.createUser)
router.put('/users/:id', db.updateUser)
router.delete('/users/:id', db.deleteUser)

//

setInterval(() =>{
    exec (`python3.9 /Users/kostia/Desktop/Website/public/parse_files.py`, (err, stdout, stderr) =>{
        if (err) {
            throw err
        }
        console.log("Scanned Library Files");
        console.log(stdout);
    })
}, 250000)


app.use(router);

const PORT = process.env.PORT || 443;


var server = https.createServer(options, app).listen(PORT, function(){
  console.log("Express server listening on port " + PORT);
});

//app.listen(PORT, () => {
//    console.log(`Server listening on port ${PORT}`);
//})
