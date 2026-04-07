const fs = require('fs');
const file = 'c:/Users/admin/Desktop/웹앱/포레스트/forest3040main/src/App.tsx';
let data = fs.readFileSync(file, 'utf8');
let lines = data.split('\n');

// 1. imports
const idx1 = lines.findIndex(l => l.includes("import PastoralStatsDashboardView from './views/PastoralStatsDashboardView';"));
if (idx1 !== -1 && !data.includes("KidsCareAddView")) {
  lines.splice(idx1 + 1, 0, "import KidsCareAddView from './views/KidsCareAddView';");
  lines.splice(idx1 + 2, 0, "import KidsCareDetailView from './views/KidsCareDetailView';");
}

// 2. states
const idx2 = lines.findIndex(l => l.includes("const [selectedWorshipId, setSelectedWorshipId] = useState<string | null>(null);"));
if (idx2 !== -1 && !data.includes("selectedKidsCareId")) {
  lines.splice(idx2 + 1, 0, "  const [selectedKidsCareId, setSelectedKidsCareId] = useState<string | null>(null);");
}

const idx3 = lines.findIndex(l => l.includes("const [worships, setWorships] = useState<any[]>([]);"));
if (idx3 !== -1 && !data.includes("kidsCares")) {
  lines.splice(idx3 + 1, 0, "  const [kidsCares, setKidsCares] = useState<any[]>([]);");
}

// 3. Clear states on disconnect (first occurrence)
const idx4 = lines.findIndex((l, i) => i > 250 && i < 280 && l.includes("setWorships([]);"));
if (idx4 !== -1 && !lines[idx4+1].includes("setKidsCares")) {
  lines.splice(idx4 + 1, 0, "      setKidsCares([]);");
}

// 4. listeners
const idx5 = lines.findIndex((l, i) => i > 300 && i < 320 && l.includes("const unsubWorships = onSnapshot(collection(firestoreDb, 'worships')"));
if (idx5 !== -1) {
  let toInsert = idx5;
  while (toInsert < lines.length && !lines[toInsert].includes("}, (err) => handleFirestoreError(err, OperationType.GET, 'worships'));")) {
    toInsert++;
  }
  if (!data.includes("const unsubKidsCares")) {
    lines.splice(toInsert + 1, 0, "");
    lines.splice(toInsert + 2, 0, "    const unsubKidsCares = onSnapshot(collection(firestoreDb, 'kids_cares'), (snapshot) => {");
    lines.splice(toInsert + 3, 0, "      setKidsCares(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));");
    lines.splice(toInsert + 4, 0, "    }, (err) => handleFirestoreError(err, OperationType.GET, 'kids_cares'));");
  }
}

// 5. unsub
const idx6 = lines.findIndex((l, i) => i > 340 && i < 370 && l.includes("unsubWorships();"));
if (idx6 !== -1 && !lines[idx6+1].includes("unsubKidsCares")) {
  lines.splice(idx6 + 1, 0, "      unsubKidsCares();");
}

// 6. routes
const targetStr = "{!subPage && activeTab === 'calendar' && <CalendarView user={currentUser} schedules={schedules.length > 0 ? schedules : mockDb.schedules} onShowToast={showToast} />}";
const idx7 = lines.findIndex(l => l.includes(targetStr));
if (idx7 !== -1 && !data.includes("kids_care_add")) {
  const insertLines = [
    "        {subPage === 'kids_care_add' && (",
    "          <KidsCareAddView ",
    "            onBack={() => setSubPage(null)} ",
    "            onShowToast={showToast} ",
    "            forests={mergedForests}",
    "          />",
    "        )}",
    "        {subPage === 'kids_care_detail' && (",
    "          <KidsCareDetailView ",
    "            kidsCareId={selectedKidsCareId}",
    "            kidsCares={kidsCares}",
    "            user={currentUser}",
    "            onBack={() => setSubPage(null)} ",
    "            onShowToast={showToast}",
    "          />",
    "        )}"
  ];
  lines.splice(idx7, 0, ...insertLines);
}

// update kids view route
const kidsViewRouteIdx = lines.findIndex(l => l.includes("{!subPage && activeTab === 'kids' && <KidsView user={currentUser} onShowToast={showToast} />}"));
if (kidsViewRouteIdx !== -1) {
  lines[kidsViewRouteIdx] = `        {!subPage && activeTab === 'kids' && (
          <KidsView 
            user={currentUser} 
            kidsCares={kidsCares}
            onNavigateToAdd={() => setSubPage('kids_care_add')}
            onNavigateToDetail={(id: string) => { setSelectedKidsCareId(id); setSubPage('kids_care_detail'); }}
            onShowToast={showToast} 
          />
        )}`;
}

// update home view route to pass kidsCares
const idxHomeView = lines.findIndex(l => l.includes("            <HomeView"));
if (idxHomeView !== -1) {
  if (!lines[idxHomeView + 1].includes("kidsCares")) {
    lines.splice(idxHomeView + 1, 0, "              kidsCares={kidsCares}");
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log("App.tsx modified successfully.");
