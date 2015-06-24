# icon-crawler

Work in progress.

## How to install and run app

```shel
git clone https://github.com/ricardofbarros/icon-crawler.git
cd icon-crawler
npm i
npm start
```

## Icons supported
- favicon
- apple-touch
- svg
- [fluidapp](http://fluidapp.com/)
- msapp

## Strategies

### To find the favicon

### To scale

## Domains in which fallbacks were tested

### favicon

#### link[rel=icon]
- microsoft.com
- github.com

#### example.com/favicon.ico
- none

#### www.example.com/favicon.ico
- wallfuture.com

### apple-touch

#### link[rel=apple-touch-icon]
- github.com

### svg

#### link[rel=icon]
- github.com

### fluidapp

#### link[rel=fluid-icon]
- github.com

### msapp

#### meta[name=msapplication-config]
- realfavicongenerator.net

#### example.com/browserconfig.xml
- html5boilerplate.com

#### meta[name=msapplication-square70x70logo]
- none

#### meta[name=msapplication-TileImage]
##### No background fill
- github.com

##### background fill
- none







## Reading material

- [http://realfavicongenerator.net/faq](http://realfavicongenerator.net/faq)
- [http://www.w3.org/2005/10/howto-favicon](http://www.w3.org/2005/10/howto-favicon)
- [https://en.wikipedia.org/wiki/Favicon](https://en.wikipedia.org/wiki/Favicon)
- [Storing a million images in the file system](http://serverfault.com/questions/95444/storing-a-million-images-in-the-filesystem)
- [Apple touch icons](https://developer.apple.com/library/ios/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [More apple touch](https://realfavicongenerator.net/blog/apple-touch-icon-the-good-the-bad-the-ugly/)
- [Microsoft icons (msapp)](https://msdn.microsoft.com/en-us/library/dn255024.aspx)
- [browserconfig.xml (msapp)](http://stackoverflow.com/a/26626329/2862991)
