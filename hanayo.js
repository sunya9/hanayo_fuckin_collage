var fs = require('fs');
var ntwitter = require('ntwitter');
var async = require('async');
var gm = require("gm");
var settings = {};

try {
    settings = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
} catch (e) {
    console.error(e);
    process.exit(0);
}

var twit = new ntwitter({
    consumer_key: settings.consumer_key,
    consumer_secret: settings.consumer_secret,
    access_token_key: settings.oauth_token,
    access_token_secret: settings.oauth_token_secret
});

async.waterfall([
        function(callback) {
            twit.verifyCredentials(function(err, data) {
                callback(null, data.screen_name);
            });
        }
    ],
    function(errors, screenName) {

        // console.log(screen_name);
        var regex = new RegExp('^@' + screenName + '\s+クソコラ.*$', 'i');
        var hanayo = gm('hanayo.png');
        if (errors) return console.error(errors);
        twit.stream('user', {}, function(stream) {
            stream.on('data', function(status) {
                // ignore friends list
                if (!status.text) return;
                // if (!regex.test(status.text)) return;
                var iconUrl = status.user.profile_image_url.replace('_normal', '');
                console.log(iconUrl);
                var image = gm(iconUrl);
                // image.autoOrient().write(status.id_str + '.png', function(err) {
                //     if (err) return console.error(err);
                // });
                // var modifyIcon = image.resize(397.7).rotate('transparent', 7.604);
                var modifyIcon = image.extent(398, 398).rotate('transparent', 7.604);
                modifyIcon.write(status.user.id_str + 'output.png', function(err) {
                    if (err) return console.error(err);
                    // gm('convert').in('-size', '599x636').
                    gm().in('-size', '599x636').
                    in('-page', '+0+0').
                    in('hanayo.png').
                    in('-page', '+350+182').
                    in(status.user.id_str + 'output.png').
                    out('-compose', 'CopyOpacity').//透過合成のやり方がわからない
                    mosaic().
                    crop(599,636, 0, 0). // cropされないんですが
                    write(new Date().getTime() + '.png', function(err) {
                        if (err) return console.error(err);
                    });
                });
                // hanayo.in('-page', '+350+182').in(modifyIcon).write(status.id_str + 'test.png', function(err) {
                //     if (err) return console.error(err);
                // });
            });
        });
    }
);

// memo 

// var icon = fs.readFileSync(OUTPUT_PATH);
//         var iconBase64 = new Buffer(icon).toString('base64');
//         var options = {
//             image: iconBase64
//         }
//         oauth.post(HOST + UPDATE_ICON_RESOURCE, AT, AS, options, function(err, data, res) {
//             if (err) console.log(err);
//         });