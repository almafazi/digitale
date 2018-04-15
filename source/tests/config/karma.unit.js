/**
 * Created by Alban Xhaferllari on 22/05/2015.
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
            'app-test.js',
            {
                pattern: 'app/**/*.js',
                watched: true,
                included: false,
                served: true
            },
            {
                pattern: 'base/app/**/*.js',
                watched: true,
                included: false,
                served: true
            },
            {
                pattern: 'base/ux/**/*.js',
                watched: true,
                included: false,
                served: true
            },
            'tests/specs/**/*.js'
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
