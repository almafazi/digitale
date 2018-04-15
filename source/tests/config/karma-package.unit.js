/**
 */
module.exports = function(config) {
    config.set({

        // basepath to use
        basePath: '../../',

        //testing frameworks to use
        frameworks: ['jasmine'],

        //files to load for loading our app
        files: [
            'touch/sencha-touch-all.js',
            'packages/sidegames/tests/MainTest.js',
            {
                pattern: 'packages/sidegames/src/**/*.js',
                watched: true,
                included: false,
                served: true
            },
            {
                pattern: 'SideGames/app/**/*.js',
                watched: true,
                included: false,
                served: true
            },
            'tests/specs/**/*.js'
        ],
        plugins: [
            'karma-jasmine',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-phantomjs-launcher'
        ],
        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        browsers: [ 'Chrome'],
        colors: true,
        singleRun: false,
        autoWatch: true
    });
};
