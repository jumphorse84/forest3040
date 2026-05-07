export const BIBLE_BOOKS: Record<string, string> = {
  "창세기": "창", "창": "창",
  "출애굽기": "출", "출": "출",
  "레위기": "레", "레": "레",
  "민수기": "민", "민": "민",
  "신명기": "신", "신": "신",
  "여호수아": "수", "수": "수",
  "사사기": "삿", "삿": "삿",
  "룻기": "룻", "룻": "룻",
  "사무엘상": "삼상", "삼상": "삼상",
  "사무엘하": "삼하", "삼하": "삼하",
  "열왕기상": "왕상", "왕상": "왕상",
  "열왕기하": "왕하", "왕하": "왕하",
  "역대상": "대상", "대상": "대상",
  "역대하": "대하", "대하": "대하",
  "에스라": "스", "스": "스",
  "느헤미야": "느", "느": "느",
  "에스더": "에", "에": "에",
  "욥기": "욥", "욥": "욥",
  "시편": "시", "시": "시",
  "잠언": "잠", "잠": "잠",
  "전도서": "전", "전": "전",
  "아가": "아", "아": "아",
  "이사야": "사", "사": "사",
  "예레미야": "렘", "렘": "렘",
  "예레미야애가": "애", "애": "애",
  "에스겔": "겔", "겔": "겔",
  "다니엘": "단", "단": "단",
  "호세아": "호", "호": "호",
  "요엘": "욜", "욜": "욜",
  "아모스": "암", "암": "암",
  "오바댜": "옵", "옵": "옵",
  "요나": "욘", "욘": "욘",
  "미가": "미", "미": "미",
  "나훔": "나", "나": "나",
  "하박국": "합", "합": "합",
  "스바냐": "습", "습": "습",
  "학개": "학", "학": "학",
  "스가랴": "슥", "슥": "슥",
  "말라기": "말", "말": "말",
  "마태복음": "마", "마태": "마", "마": "마",
  "마가복음": "막", "마가": "막", "막": "막",
  "누가복음": "눅", "누가": "눅", "눅": "눅",
  "요한복음": "요", "요한": "요", "요": "요",
  "사도행전": "행", "행": "행",
  "로마서": "롬", "롬": "롬",
  "고린도전서": "고전", "고전": "고전",
  "고린도후서": "고후", "고후": "고후",
  "갈라디아서": "갈", "갈": "갈",
  "에베소서": "엡", "엡": "엡",
  "빌립보서": "빌", "빌": "빌",
  "골로새서": "골", "골": "골",
  "데살로니가전서": "살전", "살전": "살전",
  "데살로니가후서": "살후", "살후": "살후",
  "디모데전서": "딤전", "딤전": "딤전",
  "디모데후서": "딤후", "딤후": "딤후",
  "디도서": "딛", "딛": "딛",
  "빌레몬서": "몬", "몬": "몬",
  "히브리서": "히", "히": "히",
  "야고보서": "약", "약": "약",
  "베드로전서": "벧전", "벧전": "벧전",
  "베드로후서": "벧후", "벧후": "벧후",
  "요한일서": "요일", "요일": "요일",
  "요한이서": "요이", "요이": "요이",
  "요한삼서": "요삼", "요삼": "요삼",
  "유다서": "유", "유": "유",
  "요한계시록": "계", "계": "계"
};

let cachedBibleData: any[] | null = null;

export const loadBibleData = async () => {
  if (cachedBibleData) return cachedBibleData;
  try {
    const response = await fetch('/bible_structured.json');
    if (!response.ok) throw new Error('Network response was not ok');
    cachedBibleData = await response.json();
    return cachedBibleData;
  } catch (error) {
    console.error("Bible data load error:", error);
    return null;
  }
};

export const searchBible = async (query: string, version: string = '개역개정') => {
  const data = await loadBibleData();
  if (!data) return { reference: query, text: '성경 데이터를 불러오는 데 실패했습니다 (네트워크 오류).' };

  const cleanQuery = query.replace(/\s+/g, ' ').trim();
  const match = cleanQuery.match(/([가-힣]+)\s*(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?/);
  
  if (match) {
    const bookInput = match[1];
    const book = BIBLE_BOOKS[bookInput] || bookInput;
    const chapter = parseInt(match[2], 10);
    const startVerse = parseInt(match[3], 10);
    const endVerse = match[4] ? parseInt(match[4], 10) : startVerse;
    
    const results = data.filter((item: any) => 
      item.book === book && 
      item.chapter === chapter && 
      item.verse >= startVerse && 
      item.verse <= endVerse
    );
    
    if (results.length > 0) {
      const text = results.map((r: any) => `${r.verse}. ${r.content}`).join('\n');
      // If book isn't correctly converted, BIBLE_BOOKS might fail but it will use verbatim input.
      return { 
        reference: `${bookInput} ${chapter}:${startVerse}${endVerse > startVerse ? '-'+endVerse : ''} (${version})`, 
        text 
      };
    } else {
      return { reference: query, text: '해당 구절을 찾을 수 없습니다. 책 이름이나 장/절 번호를 확인해주세요.' };
    }
  }

  // Default return if it doesn't match standard patterns
  return { reference: query, text: '구절 형식이 올바르지 않습니다.\n예: "요한복음 3:16", "출 17:8-9"' };
};
