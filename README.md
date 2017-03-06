## install
* ` npm install -g phantomjs`
* ` npm install`

## init & example
`phantomjs index.js`
`curl 'http://127.0.0.1:3001/scrawl?url=${url}'`

## config
在rules文件夹里增加自定义网站爬虫设置

```js
function g(pathname) {
    if (pathname.indexOf('/p/') > -1) {
        return {
            async: true, //所需数据是否是异步（由ajax加载的）默认为false
            data: function() { // 该方法在客户端执行，可以添加任何合法脚本
                return {
                    title: $('article header h1').text(),
                    description: $('article section').text().slice(0, 140),
                    thumbnail: $('article header img').prop('src')
                }
            }
        }
    }
}
```

