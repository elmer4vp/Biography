importScripts('../../../storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js');

if (workbox) {
    const cacheVersion = 2;
    // Cache names
    const imageCache = "images-" + cacheVersion;
    const fontCache = "fonts-" + cacheVersion;
    const staticResourcesCache = "static-resources-" + cacheVersion;
    const externalResourcesCache = "external-resources-" + cacheVersion;
    const validResponse = new workbox.cacheableResponse.CacheableResponse({
        statuses: [200]
    });
    const hourlyCacheDuration = 60 * 60;
    const dailyCacheDuration = 24 * hourlyCacheDuration;
    const weeklyCacheDuration = 7 * dailyCacheDuration;
    const yearCacheDuration = 365 * dailyCacheDuration;

    // Enable offline Google Analytics.
    // TODO: Distinguish between offline and online requests.
    workbox.googleAnalytics.initialize();

    // Configure workbox pre and runtime cache names
    workbox.core.setCacheNameDetails({
        prefix: "TI.Website",
        suffix: cacheVersion
    });

    // Cache bundled resourcs
    workbox.routing.registerRoute(
        new RegExp("\/cassette\.axd\/(script|stylesheet)\/.+"),
        workbox.strategies.cacheFirst({
            cacheName: staticResourcesCache,
            plugins: [
                new workbox.expiration.Plugin({
                    maxEntries: 60,
                    maxAgeSeconds: weeklyCacheDuration,
                    purgeOnQuotaError: true
                }),
                validResponse
            ]
        })
    );

    // Cache fonts
    workbox.routing.registerRoute(
        /.*\.(?:eot|otf|woff2|woff|ttf)$/,
        workbox.strategies.cacheFirst({
            cacheName: fontCache,
            plugins: [
                new workbox.expiration.Plugin({
                    maxEntries: 10,
                    maxAgeSeconds: yearCacheDuration,
                    purgeOnQuotaError: true
                }),
                validResponse
            ]
        })
    );

    workbox.routing.registerRoute(
        /^https:\/\/fonts\.googleapis\.com/,
        workbox.strategies.cacheFirst({
            cacheName: fontCache,
            plugins: [
                new workbox.expiration.Plugin({
                    maxEntries: 10,
                    maxAgeSeconds: yearCacheDuration,
                    purgeOnQuotaError: true
                }),
                validResponse
            ]
        })
    );
    
    // Cache images
    workbox.routing.registerRoute(
        /.*\.(?:png|gif|jpg|jpeg|svg|webp|ico)$/,
        workbox.strategies.cacheFirst({
            cacheName: imageCache,
            plugins: [
                new workbox.expiration.Plugin({
                    maxEntries: 60,
                    maxAgeSeconds: dailyCacheDuration, 
                    purgeOnQuotaError: true
                }),
                validResponse
            ]
        })
    );

    // Cache sitecore media
    workbox.routing.registerRoute(
        new RegExp('(-|~)\/media\/images\/.+', "i"),
        workbox.strategies.cacheFirst({
            cacheName: imageCache,
            plugins: [
                new workbox.expiration.Plugin({
                    maxEntries: 60,
                    maxAgeSeconds: dailyCacheDuration,
                    purgeOnQuotaError: true
                }),
                validResponse
            ]
        })
    );

    // Cache CSS and JavaScript files
    workbox.routing.registerRoute(
        /\.(?:js|css)$/,
        workbox.strategies.cacheFirst({
            cacheName: staticResourcesCache,
            plugins: [
                new workbox.expiration.Plugin({
                    maxEntries: 60,
                    maxAgeSeconds: dailyCacheDuration,
                    purgeOnQuotaError: true
                }),
                validResponse
            ]
        })
    );

    // Cache external sources by timeout
    workbox.routing.registerRoute(
        /.*(?:use.typekit|s7.addthis|googletagmanager)\.(?:com|net)/,
        workbox.strategies.networkFirst({
            networkTimeoutSeconds: 3,
            cacheName: externalResourcesCache,
            plugins: [
                new workbox.expiration.Plugin({
                    maxEntries: 60,
                    maxAgeSeconds: 5 * 60, // 5 minutes
                    purgeOnQuotaError: true
                }),
                validResponse
            ]
        })
    );

}
else {
    console.log(`Boo! Workbox didn't load 😬`);
}
