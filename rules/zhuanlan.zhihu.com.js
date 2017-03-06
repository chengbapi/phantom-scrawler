function g(pathname) {
    if (pathname.indexOf('/p/') > -1) {
        return {
            async: true,
            data: function() {
                return {
                    title: $('article header h1').text(),
                    description: $('article section').text().slice(0, 140),
                    thumbnail: $('article header img').prop('src')
                }
            }
        }
    }
}
