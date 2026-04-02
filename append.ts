const fs = require('fs');
const content = '\nexport enum OperationType { READ, CREATE, UPDATE, DELETE }\nexport function handleFirestoreError(err:any, opType:any, path:any) { console.error(err, opType, path); }\nexport const SmallGroupCard = (props:any) => null;\n';
fs.appendFileSync('src/App.tsx', content, 'utf-8');
