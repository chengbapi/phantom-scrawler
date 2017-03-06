function g(pathname) {
    return {
        async: false,
        data: function() {
            return {
                title: document.title,
                description: $('p').text().slice(0, 200),
                thumbnail: $('img').prop('src')
            }
        }
    }
}
