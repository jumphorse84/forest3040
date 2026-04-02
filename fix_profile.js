const fs = require('fs');

try {
    let code = fs.readFileSync('src/views/HomeView.tsx', 'utf8');

    // Make avatar dynamic
    code = code.replace(
        /avatarSrc:\s*'[^']*',/g, 
        "avatarSrc: user.photoURL || user.profileImageUrl || user.picture || '',"
    );

    // Make birthdate exactly matching Firebase logged in object
    code = code.replace(
        /birthdate:\s*user\.birthDate\s*\|\|\s*'YYYY\.MM\.DD',/g, 
        "birthdate: user.birthdate || user.birthDate || '미상',"
    );

    code = code.replace(
        /name:\s*user\.name\s*\|\|\s*'방문자',/g, 
        "name: user.name || '알 수 없음',"
    );

    code = code.replace(
        /affiliation:\s*user\.forest\s*\|\|\s*'소속 숲 없음',/g, 
        "affiliation: user.forest || '소속 없음',"
    );

    fs.writeFileSync('src/views/HomeView.tsx', code, 'utf8');
    console.log("Successfully updated dynamic profile mapping");
} catch (e) {
    console.error(e);
}
