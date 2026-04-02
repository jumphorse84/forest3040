const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

function decodeUnicode(text) {
    // Decode double-escaped like \\uC77C
    let decoded = text.replace(/\\\\u([0-9a-fA-F]{4})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
    });
    // Decode single-escaped like \uC77C
    decoded = decoded.replace(/\\u([0-9a-fA-F]{4})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
    });
    return decoded;
}

const newContent = decodeUnicode(content);

if (newContent !== content) {
    fs.writeFileSync('src/App.tsx', newContent, 'utf8');
    console.log('Successfully decoded all unicode sequences in App.tsx');
} else {
    console.log('No unicode sequences found to decode.');
}
