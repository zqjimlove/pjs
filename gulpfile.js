var gulp = require('gulp'),
    fs = require('fs'),
    path = require('path'),
    connect = require('gulp-connect'),
    autoprefixer = require('gulp-autoprefixer'),
    argv = require('yargs').argv,
    clean = require('gulp-clean'),
    uglify = require('gulp-uglify'),
    watch = require('gulp-watch'),
    cleanCSS = require('gulp-clean-css'),
    gutil = require('gulp-util'),
    changed = require('gulp-changed'),
    bower = require('gulp-bower'),
    mainBowerFiles = require('main-bower-files'),
    htmlmin = require('gulp-html-minifier'),
    gulpCopy = require('gulp-copy'),
    replace = require('gulp-replace'),
    imagemin = require('gulp-imagemin'),
    ts = require("gulp-typescript"),
    imageminPngquant = require('imagemin-pngquant'),
    compass = require('gulp-compass'),
    runSequence = require('run-sequence'),
    url = require('url');

var tsc = ts.createProject('tsconfig.json'),
    CDN = argv.cdn ? argv.cdn : false,
    __BUILD = 'product',
    __DEV = 'dev',
    projectName = argv.p ? argv.p : void 0,
    projectPath = path.join(__dirname, 'projects', projectName),
    projectSourcePath = path.join(projectPath, '/webapp'),
    mode = __BUILD, //编译模式
    __DEVMODE = function() {
        return mode === __DEV;
    },
    __BUILDPATH = function(_mode) { //获取编译路径
        return 'projects/' + projectName + ((_mode || argv.mode || mode) === __BUILD ? '/dist' : '/.tmp');
    },
    __STPATH = function(_mode) { //获取静态路径
        return __BUILDPATH(_mode) + '/statics';
    };

//判断设置参数
if (!projectName) {
    console.error('设置p参数');
    process.exit();
}

//代理设置
var proxies = {
    enable: 1,
    servers: []
};


gulp.task('clean', function() {
    return gulp.src(__BUILDPATH()).pipe(clean());
});

gulp.task('install-bower', function() {
    return bower('./bower_components');
})

gulp.task('bower', ['install-bower'], function() {
    // bower('./bower_components');
    return gulp.src(mainBowerFiles()).pipe(gulp.dest('common/statics/vendor'));
});

gulp.task('copy', function(callback) {
    var dest = __BUILDPATH()

    function vendors() {
        return new Promise(function(res) {
            gulp.src('common/statics/vendor/*').pipe(gulp.dest(dest + '/statics/vendor/')).on('end', res);
        })
    }

    function html() {
        return new Promise(function(res) {
            gulp.src([projectSourcePath + '/**/*.html'], {
                    base: projectSourcePath
                })
                .pipe(replace(/('|")([^=\s]*?\.?\/?)statics\/(.*?)('|")/g, '$1' + (CDN ? CDN : '$2') + 'statics/$3$4'))
                .pipe(replace(/\.(js|css)("|')/g, '.$1?v=' + Date.now() + '$2'))
                .pipe(htmlmin({
                    collapseWhitespace: true
                }))
                .pipe(gulp.dest(dest)).on('end', res);
        })
    }

    function others() {
        return new Promise(function(res) {
            gulp.src([projectSourcePath + '/statics/**/*', '!' + projectSourcePath + '/statics/scss{,/**}',
                '!' + projectSourcePath + '/statics/scripts{,/**}',
                '!' + projectSourcePath + '/statics/images-source{,/**}',
                '!' + projectSourcePath + '/statics/images{,/**}'
            ], {
                base: projectSourcePath
            }).pipe(gulp.dest(dest)).on('end', res);
        })
    }

    Promise.all([html(), vendors(), others()]).then(function() {
        callback();
    })

});

gulp.task('compass', function() {
    var dest = __STPATH() + '/css';
    gulp.src(projectSourcePath + '/**/*.scss')
        .pipe(changed(dest))
        .pipe(compass({
            import_path: 'common/scss/',
            style: __DEVMODE() ? 'nested' : 'compressed',
            // logging: false,
            css: __STPATH() + '/css',
            sass: projectSourcePath + '/statics/scss',
            image: projectSourcePath + '/statics/images-source',
            generated_images_path: __STPATH() + '/images/generated'
        })).on('error', function(err) {
            console.error(err);
        }).pipe(autoprefixer({
            browsers: ['last 4 ios version', 'last 8 android version']
        })).pipe(gulp.dest(dest));
});

gulp.task('typescript', function() {
    var dest = __STPATH() + '/scripts';
    var pr = gulp.src(['typings/unknow.d.ts', projectSourcePath + '/statics/scripts/**/*.ts'], {
            // base: projectSourcePath + '/statics/scripts/'
        })
        .pipe(changed(dest))
        .pipe(tsc());
    if (mode === __BUILD) {
        pr.pipe(uglify());
    }
    pr.pipe(gulp.dest(dest));
});


gulp.task('compress', function(callback) {
    mode = __BUILD;

    function js() {
        return new Promise(function(res) {
            gulp.src(projectSourcePath + '/statics/**/*.js')
                .pipe(replace(/('|")([^=\s]*?\.?\/?)statics\/(.*?)('|")/g, function(match, $1, $2, $3, $4) {
                    var result = $1 + (CDN ? CDN : $2) + 'statics/' + $3 + $4;
                    return result;
                }))
                .pipe(uglify())
                .pipe(gulp.dest(__STPATH()))
                .on('error', gutil.log)
                .on('end', res);
        })
    }

    function css() {
        return new Promise(function(res) {
            gulp.src(projectSourcePath + '/statics/**/*.css')
                .pipe(cleanCSS({
                    // compatibility: 'ie8'
                }))
                .pipe(gulp.dest(__STPATH())).on('end', res);
        })
    }

    function img() {
        return new Promise(function(res) {
            gulp.src(projectSourcePath + '/statics/images/**')
                .pipe(imagemin([imageminPngquant(), imagemin.gifsicle(), imagemin.jpegtran(), imagemin.optipng(), imagemin.svgo()]))
                .pipe(gulp.dest(__STPATH() + '/images/'))
                .on('end', res);
        })
    }

    Promise.all([js(), css(), img()]).then(function() {
        callback();
    })
});


gulp.task('server-dist', [], function() {
    connect.server({
        port: 7000,
        host: '0.0.0.0',
        root: [projectPath + '/dist'],
        livereload: true,
        middleware: function(connect, o) {
            var result = [];
            if (proxies.enable) {
                var url = require('url');
                var proxy = require('proxy-middleware');

                //注入服务
                for (var i = 0; i < proxies.servers.length; i++) {
                    var proxyServer = proxies.servers[i];
                    var options = url.parse(proxyServer.url);
                    options.route = proxyServer.route;
                    result.push(proxy(options));
                }

                //改头跨域
                result.push(function(req, res, next) {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    return next();
                });

            }
            return result;
        }
    });
});


gulp.task('server', ['bower'], function() {

    mode = __DEV;
    //服务开启
    connect.server({
        port: 7000,
        host: '0.0.0.0',
        root: [projectSourcePath, projectPath + '/.tmp', 'common'],
        livereload: true,
        middleware: function(connect, o) {
            var result = [];
            if (proxies.enable) {

                var proxy = require('proxy-middleware');

                //注入服务
                for (var i = 0; i < proxies.servers.length; i++) {
                    var proxyServer = proxies.servers[i];
                    var options = url.parse(proxyServer.url);
                    options.route = proxyServer.route;
                    result.push(proxy(options));
                }

                //改头跨域
                result.push(function(req, res, next) {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    return next();
                });
            }


            return result;
        }
    });

    //检测文件变动
    watch([projectSourcePath + '/**/*.{html,js,png,gif,jpg}',
        projectPath + '/.tmp/**/*.{css,png,js}'
    ], function(event) {
        gulp.src(event.path).pipe(connect.reload());
    });

    //检测scss变化
    watch([projectSourcePath + '/**/*.scss'], function() {
        gulp.run(['compass'])
    });

    //检测typescript变化
    watch([projectSourcePath + '/**/*.ts'], function() {
        gulp.run(['typescript'])
    });

});

gulp.task('build', function(callback) {
    runSequence('clean', 'bower', ['compass', 'typescript'], 'compress', 'copy', callback);
});

gulp.task('new', function() {
    [projectPath,
        projectSourcePath,
        projectSourcePath + '/statics',
        projectSourcePath + '/statics/images',
        projectSourcePath + '/statics/images-source',
        projectSourcePath + '/statics/scripts',
        projectSourcePath + '/statics/scss'
    ].forEach(function(e) {
        fs.mkdirSync(e);
    });
});


gulp.task('rsync', ['build'], function(cb) {
    var distPath = path.join(projectPath, 'dist', '*');
    var exec = require('child_process').exec;
    var cmdStr = 'rsync -avz ' + distPath + ' root@inwoo.me:/home/pjs/' + projectName;
    console.log(cmdStr)
    exec(cmdStr, function(err, stdout, stderr) {
        if (err) {
            console.log('get weather api error:' + stderr);
        } else {
            cb();
        }
    });

})