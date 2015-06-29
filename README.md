# icon-crawler

[WIP] Documentation needs to be finished

## Live version
http://178.62.216.242/get?domain=github.com

## System Dependencies
- **node.js**
- **redis**
- nginx (optional)
- ImageMagick (optional)

## How to install and run app

This app is ready to work out of the box with only `node` and `redis` installed, you just need to clone the repo, install the dependencies and you are ready to go, but this type of configuration won't scale the app so well.

```shell
git clone https://github.com/ricardofbarros/icon-crawler.git
cd icon-crawler
npm i
npm start
```

But instead of an _"out of the box"_ installation I used a reverse proxy to help serve the static files  and to load balance the node apps, the reverse proxy in question is nginx.

A reverse proxy is fundamental to scale the app, this will be explained why later on the documentation.

If you want to know what configurations I used on nginx you can take a look into `nginx/nginx.confg`.

## Icons supported
This app supports various types of icons because most of the times they are all different and have different use cases.

Currently supported icons:

- favicon
- apple-touch
- svg
- [fluidapp](http://fluidapp.com/)
- msapp

## Strategies

### To find the favicon
Please read the [wiki]() as this is a extensive to read topic.

### To scale

#### Serving the icons

The first request is used to cache the image on the file system and create a record on redis.
Normally the first request takes longer to complete because it needs to download the image, write the image to the file system and create a key in redis and then we can deliver the url to the user. **But I don't want the first request to a specific domain to wait!**

So for instance when you request to crawl the domain `github.com` it will parse the HTTP response body and will find the following favicon `https://assets-cdn.github.com/favicon.ico`, instead of waiting it will deliver the link through a local proxy and behind the curtains it will launch a worker to crawl the rest of the images, then it proceeds to download them, store them and create the cache metadata in redis.

If you want to see the source code of this event, you can take a look into the following files:
- Local proxy request handler - `app/proxyImage.js`
- Icon crawler worker - `lib/workers/iconCrawler.js`
- Main request handler of the app - `app/getImage.js`

#### Cache files in the file system
The file system should be enough to cache files. Caching files in memory could be a better option if we had the hardware, so for general purposes the file system will suffice.

There is some concerns to scale when you are using the file system to cache files.
If you have a lot of files in one directory you will start to cripple the system, so one workaround is to split the md5 filename and make some subdirectories. This is explained in more detail on the Server fault question [Storing a million images in the file system](#fs).

#### Serve static files through nginx
Let's get real node.js is nowhere near the performance output of nginx on the department of serving static files, I ran some benchmarks and node was doing a poorly **2-3k reqs/sec** using `res.sendFile` while nginx was doing **45-47k reqs/sec**, so nginx was the clear winner to serve the static files that were cached on the file system.

> The benchmarks were done using the [wrk](https://github.com/wg/wrk) tool

#### Using redis to manage hot cache and cold cache

## Cool stuff implemented
- windows tiles background fill - This app will call `ImageMagick` to fill the background of the `.png` images with the color specified in the meta tag `TileColor`
- Request only a specific type or types by passing the query parameter `type`. Like this: `http://iconcrawler.com/get?domain=github.com&type=svg` or multiple types `http://iconcrawler.com/get?domain=github.com&type[0]=svg&type[1]=favicon`


## To be implemented
Some stuff wasn't implemented because I didn't have time to do it, but for the record this are the missing features:

- Icon refresher - This should be a simple worker that will iterate over cached files and see if they are up to date.
- Delete not used cached files from tmp directory.

## Reading material

- [http://realfavicongenerator.net/faq](http://realfavicongenerator.net/faq)
- [http://www.w3.org/2005/10/howto-favicon](http://www.w3.org/2005/10/howto-favicon)
- [https://en.wikipedia.org/wiki/Favicon](https://en.wikipedia.org/wiki/Favicon)
- <a name="fs"></a>[Storing a million images in the file system](http://serverfault.com/questions/95444/storing-a-million-images-in-the-filesystem)
- [Apple touch icons](https://developer.apple.com/library/ios/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [More apple touch](https://realfavicongenerator.net/blog/apple-touch-icon-the-good-the-bad-the-ugly/)
- [Microsoft icons (msapp)](https://msdn.microsoft.com/en-us/library/dn255024.aspx)
- [browserconfig.xml (msapp)](http://stackoverflow.com/a/26626329/2862991)
