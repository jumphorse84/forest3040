const fs = require('fs');
const file = 'src/views/ForestCommunityView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /import \{\s*X, ChevronLeft, ChevronRight.*?\n  \} from 'lucide-react';/s,
  `import {
    X, ChevronLeft, ChevronRight, Volume2, VolumeX, Pause, Loader2,
    Plus, Send, Type, Check, Image as ImageIcon, Upload, CornerDownRight,
    Megaphone, PenTool, Smile, Trash2
  } from 'lucide-react';`
);

content = content.replace(
  /import \{\s*collection,([^}]+)arrayRemove\s*\} from 'firebase\/firestore';/s,
  `import {
  collection,$1arrayRemove,
  deleteDoc, doc
} from 'firebase/firestore';`
);

content = content.replace(
  /interface Story \{([^}]+)reactions\?:Record<string, string\[\]>; \}/g,
  `interface Story {$1reactions?:Record<string, string[]>; userId?:string; }`
);
content = content.replace(
  /interface ChatMsg \{([^}]+)replyTo\?:\{senderName:string;text:string\}; \}/g,
  `interface ChatMsg {$1replyTo?:{senderName:string;text:string}; userId?:string; }`
);

content = content.replace(
  /function StoryViewerModal\(\{stories,username,avatar,initialIndex,onClose,onStoryChange,onReact,uid\}:\s*\{stories:Story\[\];username:string;avatar:string;initialIndex:number;onClose:\(\)=>void;onStoryChange:\(i:number\)=>void;onReact\?:\(storyId:string,emoji:string\)=>void;uid\?:string\}\) \{/g,
  `function StoryViewerModal({stories,username,avatar,initialIndex,onClose,onStoryChange,onReact,uid,onDeleteStory}:
  {stories:Story[];username:string;avatar:string;initialIndex:number;onClose:()=>void;onStoryChange:(i:number)=>void;onReact?:(storyId:string,emoji:string)=>void;uid?:string;onDeleteStory?:(id:string)=>void}) {`
);

content = content.replace(
  /<button onClick=\{onClose\} className="p-2 text-white hover:bg-white\/20 rounded-full"><X size=\{18\}\/><\/button>/g,
  `{story.userId === uid && onDeleteStory && (
                <button onClick={(e) => { e.stopPropagation(); if(window.confirm('스토리를 삭제하시겠습니까?')) { onDeleteStory(story.id); onClose(); } }} 
                  className="p-2 text-white/70 hover:bg-red-500/80 hover:text-white bg-black/20 rounded-full transition-colors mr-2">
                  <Trash2 size={16}/>
                </button>
              )}
              <button onClick={onClose} className="p-2 text-white hover:bg-white/20 rounded-full bg-black/20"><X size={18}/></button>`
);

content = content.replace(
  /function StoryViewer\(\{stories,username,avatar,onReact,uid\}: \{stories:Story\[\];username:string;avatar:string;onReact\?:\(id:string,r:string\)=>void;uid\?:string\}\) \{/g,
  `function StoryViewer({stories,username,avatar,onReact,uid,onDeleteStory}: {stories:Story[];username:string;avatar:string;onReact?:(id:string,r:string)=>void;uid?:string;onDeleteStory?:(id:string)=>void}) {`
);

// Since StoryViewer inside StoryViewer return is self enclosing
content = content.replace(
  /onReact=\{onReact\} uid=\{uid\}\/>\}$/gm,
  `onReact={onReact} uid={uid} onDeleteStory={onDeleteStory}/>}`
);

content = content.replace(
  /function ForestRoom\(\{forest,onBack,messages,onSendMessage,onAddStory,isWeeklyTurn,currentColumnData,onWriteColumn,profile,forestStories,onReactStory,uid\}:\s*\{forest:Forest;onBack:\(\)=>void;messages:ChatMsg\[\];onSendMessage:\(t:string,img\?:string,reply\?:any\)=>void;\s*onAddStory:\(d:any\)=>void;isWeeklyTurn:boolean;currentColumnData\?:ColumnData;onWriteColumn:\(d:ColumnData\)=>void;profile:UserProfile;forestStories\?:Story\[\];onReactStory\?:\(id:string,emoji:string\)=>void;uid\?:string\}\) \{/g,
  `function ForestRoom({forest,onBack,messages,onSendMessage,onAddStory,isWeeklyTurn,currentColumnData,onWriteColumn,profile,forestStories,onReactStory,uid,onDeleteChat}:
  {forest:Forest;onBack:()=>void;messages:ChatMsg[];onSendMessage:(t:string,img?:string,reply?:any)=>void;
   onAddStory:(d:any)=>void;isWeeklyTurn:boolean;currentColumnData?:ColumnData;onWriteColumn:(d:ColumnData)=>void;profile:UserProfile;forestStories?:Story[];onReactStory?:(id:string,emoji:string)=>void;uid?:string;onDeleteChat?:(id:string)=>void}) {`
);

content = content.replace(
  /<button onClick=\{\(\)=>setReplyTo\(msg\)\}\s*className=\{cn\('opacity-0 group-hover:opacity-100 p-1\.5 text-slate-400 hover:text-emerald-500 mb-4 bg-white rounded-full shadow-sm border border-slate-200',msg\.isMe\?'mr-1':'ml-1'\)\}>\s*<CornerDownRight size=\{14\}\/>\s*<\/button>/g,
  `<div className={cn('flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 mb-4',msg.isMe?'mr-1':'ml-1')}>
                <button onClick={()=>setReplyTo(msg)}
                  className="p-1.5 text-slate-400 hover:text-emerald-500 bg-white rounded-full shadow-sm border border-slate-200 transition-colors">
                  <CornerDownRight size={14}/>
                </button>
                {msg.isMe && onDeleteChat && (
                  <button onClick={() => { if(window.confirm('메시지를 삭제하시겠습니까?')) onDeleteChat(msg.id); }}
                    className="p-1.5 text-slate-400 hover:text-red-500 bg-white rounded-full shadow-sm border border-slate-200 transition-colors">
                    <Trash2 size={14}/>
                  </button>
                )}
              </div>`
);

content = content.replace(
  /const payload: any = \{\s*forestId: activeForestId,\s*\.\.\.data,\s*timestamp: serverTimestamp\(\)\s*\};/g,
  `const payload: any = {\n        forestId: activeForestId,\n        userId: user?.uid || 'unknown',\n        ...data,\n        timestamp: serverTimestamp()\n      };`
);

content = content.replace(
  /const handleWriteColumn = useCallback\(async \(data: ColumnData\)/g,
  `const handleDeleteChat = useCallback(async (msgId: string) => {
    try { await deleteDoc(doc(db, 'forest_chats', msgId)); } catch(e) { console.error(e); }
  }, []);
  const handleDeleteStory = useCallback(async (storyId: string) => {
    try { await deleteDoc(doc(db, 'forest_stories', storyId)); } catch(e) { console.error(e); }
  }, []);

  const handleWriteColumn = useCallback(async (data: ColumnData)`
);

content = content.replace(
  /<StoryViewer key=\{f\.id\} stories=\{forestStories\[f\.id\]\} username=\{f\.name\}\s*avatar=\{f\.image\} onReact=\{handleReactStory\} uid=\{user\?\.uid\}\/>/g,
  `<StoryViewer key={f.id} stories={forestStories[f.id]} username={f.name} avatar={f.image} onReact={handleReactStory} uid={user?.uid} onDeleteStory={handleDeleteStory}/>`
);

content = content.replace(
  /<ForestRoom \s*forest=\{activeForest\}/g,
  `<ForestRoom \n            onDeleteChat={handleDeleteChat}\n            forest={activeForest}`
);

fs.writeFileSync(file, content);
console.log('done');
