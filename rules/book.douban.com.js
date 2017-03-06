function g(pathname) {
    if (pathname.indexOf('/subject/nofresh') > -1) {
        return {
            async: false,
            data: function() {
                return {
                    title: document.title,
                    description: $('p').text().slice(0, 200),
                    thumbnail: $('.readMain .article img').data('src')
                }
            }
        }
    }
}
