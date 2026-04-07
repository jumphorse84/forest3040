const fs = require('fs');
const file = 'c:/Users/admin/Desktop/웹앱/포레스트/forest3040main/src/App.tsx';
let data = fs.readFileSync(file, 'utf8');
let lines = data.split('\n');

// 1. Import KidsCareApplyView
const importIdx = lines.findIndex(l => l.includes("import KidsCareDetailView from './views/KidsCareDetailView';"));
if (importIdx !== -1 && !data.includes('KidsCareApplyView')) {
  lines.splice(importIdx + 1, 0, "import KidsCareApplyView from './views/KidsCareApplyView';");
  console.log('✓ Import added');
} else console.log('- Import skipped');

// Rebuild string after splice
data = lines.join('\n');
lines = data.split('\n');

// 2. Add selectedKidsCareApply state & onNavigateToApply callback in kids detail route
const detailRouteIdx = lines.findIndex(l => l.includes("{subPage === 'kids_care_detail'"));
if (detailRouteIdx !== -1) {
  // Find the closing of this block
  let closeIdx = detailRouteIdx;
  while (closeIdx < lines.length && !lines[closeIdx].includes(")}")) closeIdx++;
  // Check if onNavigateToApply is already there
  const block = lines.slice(detailRouteIdx, closeIdx).join('\n');
  if (!block.includes('onNavigateToApply')) {
    // Find the line with 'onShowToast={showToast}' in this block
    for (let i = detailRouteIdx; i <= closeIdx; i++) {
      if (lines[i].includes('onShowToast={showToast}') && lines[i+1] && lines[i+1].trim() === '/>') {
        lines.splice(i + 1, 0, "            onNavigateToApply={() => { setSubPage('kids_care_apply'); }}");
        console.log('✓ onNavigateToApply prop added to KidsCareDetailView');
        break;
      }
    }
  } else console.log('- onNavigateToApply already present');
} else console.log('- kids_care_detail route not found');

data = lines.join('\n');
lines = data.split('\n');

// 3. Add kids_care_apply route before kids_care_detail
const detailRouteIdx2 = lines.findIndex(l => l.includes("{subPage === 'kids_care_detail'"));
if (detailRouteIdx2 !== -1 && !data.includes("kids_care_apply")) {
  const applyRoute = [
    "        {subPage === 'kids_care_apply' && (",
    "          <KidsCareApplyView",
    "            kidsCareId={selectedKidsCareId}",
    "            kidsCares={kidsCares}",
    "            user={currentUser}",
    "            onBack={() => setSubPage('kids_care_detail')}",
    "            onShowToast={showToast}",
    "          />",
    "        )}"
  ];
  lines.splice(detailRouteIdx2, 0, ...applyRoute);
  console.log('✓ kids_care_apply route added');
} else console.log('- kids_care_apply route skipped');

data = lines.join('\n');
fs.writeFileSync(file, data);
console.log('\nApp.tsx updated successfully.');
