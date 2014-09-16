module.exports = {
    generatePatterns: function(){
        var cases = [
                [
                    '<img'
                ],
                [
                    'src="img/128x64.gif"',
                    'src="./img/128x64.gif"',
                    'src="../test/img/128x64.gif"',
                    'src="/img/128x64.gif"',
                    'src="//example.com/img/128x64.gif"',
                    'src="http://example.com/img/128x64.gif"'
                ],
                [
                    '', 'width', 'width="$"', 'width="auto"', 'width="100"'
                ],
                [
                    '', 'height', 'height="$"', 'height="auto"', 'height="100"'
                ],
                [
                    '', 'alt'
                ],
                [
                    '>', '/>'
                ]
            ],
            patterns = [
                []
            ];

        cases.forEach(function (parts) {
            var tmp = [];
            parts.forEach(function (p) {
                patterns.forEach(function (c) {
                    tmp.push(c.concat(p));
                });
            });
            patterns = tmp;
        });
        return patterns.map(function (pattern) {
            return pattern.join(' ').replace(/\s+/g, ' ');
        });
    }
}