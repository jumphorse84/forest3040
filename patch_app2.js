const fs = require('fs');

const file = 'c:/Users/admin/Desktop/웹앱/포레스트/forest3040main/src/App.tsx';
let data = fs.readFileSync(file, 'utf8');

const targetStr = `            <HomeView 
              user={currentUser} `;

const replaceStr = `            <HomeView 
              user={currentUser} 
              kidsCares={kidsCares}`;

if (!data.includes('kidsCares={kidsCares}') && data.includes(targetStr)) {
  data = data.replace(targetStr, replaceStr);
  fs.writeFileSync(file, data);
  console.log("App.tsx HomeView updated successfully.");
} else {
  console.log("Not found or already updated.");
}
