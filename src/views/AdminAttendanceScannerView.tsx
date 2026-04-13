import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db as firestoreDb } from '../firebase';
import { ChevronLeft, QrCode } from 'lucide-react';

export default function AdminAttendanceScannerView({ onBack, onShowToast, currentUser }: any) {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    startScanner();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      }
    };
  }, []);

  const handleScanSuccess = async (decodedText: string) => {
    // Expected format: uid_timestamp => e.g., "SFVIAP2UZ2AL01KZINMETLCLCXV1_1678888888"
    // Though we can just use the part before the underscore as UID
    if (!isScanning) {
      setIsScanning(true);
      const parts = decodedText.split('_');
      const targetUid = parts[0];
      
      try {
        await addDoc(collection(firestoreDb, 'attendance'), {
          uid: targetUid,
          date: Timestamp.now(),
          type: '주일출석',
          method: 'qr_scan',
          scanner_uid: currentUser?.uid || 'admin'
        });
        
        setScanResult(targetUid);
        onShowToast('✅ 출석이 완료되었습니다!');
        
        // Resume scanning after 3 seconds
        setTimeout(() => {
          setScanResult(null);
          setIsScanning(false);
        }, 3000);

      } catch (error) {
        console.error("Attendance scan recording error: ", error);
        onShowToast('출석 기록 중 오류가 발생했습니다.');
        setIsScanning(false);
      }
    }
  };

  const startScanner = () => {
    const isMobile = window.innerWidth <= 768;
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: isMobile ? 250 : 300, height: isMobile ? 250 : 300 } },
        false
      );
      scannerRef.current.render(handleScanSuccess, (err) => {
        // Ignored, happens too frequently
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-900 overflow-y-auto w-full max-w-md mx-auto shadow-2xl animate-in slide-in-from-bottom-5">
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center text-white">
            <button onClick={onBack} className="p-2 -ml-2 text-slate-300 hover:bg-slate-800 rounded-full transition-colors active:scale-95">
              <ChevronLeft size={26} />
            </button>
            <h1 className="text-lg font-bold tracking-tight ml-2">QR 출석 스캐너</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col p-6 items-center w-full pb-20">
        <div className="bg-slate-800 w-full rounded-3xl p-6 shadow-xl border border-slate-700 flex flex-col items-center mb-8">
            <QrCode size={48} className="text-emerald-400 mb-4" />
            <h2 className="text-white text-xl font-bold mb-1">스마트 티켓 스캔</h2>
            <p className="text-slate-400 text-sm text-center font-medium">교인의 스마트 티켓(QR 모바일 티켓)을<br/>카메라 사각형 안에 맞춰주세요.</p>
        </div>

        <div className="relative w-full max-w-[340px] rounded-3xl overflow-hidden shadow-2xl bg-black border-4 border-slate-800">
          <style dangerouslySetInnerHTML={{__html: `
            #reader { border: none !important; width: 100%; border-radius: 20px; overflow: hidden; }
            #reader video { object-fit: cover; }
            #reader__dashboard_section_csr span { color: white !important; font-size: 14px; }
            #reader__dashboard_section_swaplink { color: #34d399 !important; text-decoration: none; margin-top: 10px; display: inline-block; font-weight: bold; }
            #reader__camera_permission_button { background: #10b981 !important; color: white !important; border: none !important; padding: 12px 24px !important; border-radius: 999px !important; font-weight: bold !important; cursor: pointer; }
          `}} />
          <div id="reader" className="w-full"></div>
          
          {scanResult && (
            <div className="absolute inset-0 bg-emerald-500/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300 z-50">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-emerald-500 shadow-xl drop-shadow-lg">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-white text-2xl font-bold font-headline">출석 완료!</h3>
              <p className="text-emerald-50 mt-2 font-medium">입장이 확인되었습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
