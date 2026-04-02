const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `    </div>
  );


const Toast = ({ message }: { message: string }) => {`;

const newStr = `    </div>
  );
};

const Toast = ({ message }: { message: string }) => {`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('Fixed syntax error!');
} else {
  // Try another approach with regex
  content = content.replace(/    <\/div>\n  \);\n\n\nconst Toast/g, '    </div>\n  );\n};\n\nconst Toast');
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('Fixed syntax using Regex!');
}
