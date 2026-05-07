import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db as firestoreDb } from '../firebase';
import { ChevronLeft, QrCode, CheckCircle2 } from 'lucide-react';

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
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 300, height: 300 } },
        false
      );
      scannerRef.current.render(handleScanSuccess, (err) => {
        // Ignored, happens too frequently
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col md:flex-row bg-animated-green overflow-hidden w-full h-full animate-in fade-in duration-500">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .bg-animated-green {
            background: linear-gradient(-45deg, #10b981, #059669, #047857, #0f766e);
            background-size: 400% 400%;
            animation: gradientBG 15s ease infinite;
        }
        #reader { border: none !important; width: 100%; border-radius: 24px; overflow: hidden; background: white; padding: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
        #reader video { object-fit: cover; border-radius: 12px; }
        #reader * { font-family: inherit; }
        #reader a { color: #059669 !important; text-decoration: none; font-weight: bold; margin-top: 10px; display: inline-block; padding: 8px 16px; background: #ecfdf5; border-radius: 12px; }
        #reader button { background: #10b981 !important; color: white !important; border: none !important; padding: 12px 24px !important; border-radius: 99px !important; font-weight: bold !important; cursor: pointer; margin-top: 10px; transition: all 0.2s; }
        #reader button:hover { background: #059669 !important; transform: scale(0.98); }
        #reader__dashboard_section_swaplink { text-decoration: none; }
        #reader__scan_region { background: #f8fafc; border-radius: 12px; }
        #reader__dashboard_section_csr span { color: #334155 !important; }
      `}} />

      {/* Back button (Top Left) */}
      <button onClick={onBack} className="absolute top-6 left-6 z-50 p-4 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-all active:scale-95 shadow-lg">
        <ChevronLeft size={32} />
      </button>

      {/* Left Content Area - Text & Branding */}
      <div className="flex-1 flex flex-col justify-center items-center md:items-start p-10 md:p-16 lg:p-24 text-white z-10 w-full mb-8 md:mb-0">
        <h1 className="font-headline font-black text-5xl md:text-7xl lg:text-8xl tracking-tight mb-8 drop-shadow-lg text-center md:text-left">
          FOREST<span className="text-emerald-200">3040</span>
        </h1>
        
        <div className="bg-white/10 backdrop-blur-md p-8 sm:p-10 rounded-[2.5rem] border border-white/20 shadow-2xl w-full max-w-xl">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-6 text-emerald-200">
            <QrCode size={48} />
            <h2 className="text-3xl sm:text-4xl font-extrabold font-headline tracking-tight">스마트 출석</h2>
          </div>
          <p className="text-xl sm:text-2xl font-medium leading-relaxed drop-shadow-md text-emerald-50 text-center md:text-left">
            환영합니다! 예배 참석을 위해<br/>
            휴대폰 내 <strong className="text-white bg-emerald-700/60 px-3 py-1.5 rounded-xl mx-1 shadow-inner inline-block mt-2 mb-2">QR 모바일 티켓</strong>을<br/>
            우측 카메라 화면에 비춰주세요.
          </p>
          <div className="mt-8 pt-6 border-t border-white/20 flex items-center justify-center md:justify-start gap-3 text-emerald-100 text-sm sm:text-base font-bold">
            <CheckCircle2 size={24} className="text-emerald-300" />
            <span>스캔이 완료되면 자동으로 출석 완료 처리됩니다.</span>
          </div>
        </div>
      </div>

      {/* Right Content Area - Scanner */}
      <div className="flex-1 w-full flex items-center justify-center p-6 md:p-16 z-10 relative">
        <div className="w-full max-w-lg relative bg-white/5 p-4 rounded-[2rem] shadow-2xl backdrop-blur-sm border border-white/10">
          <div id="reader" className="w-full"></div>
          
          {scanResult && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300 z-50 rounded-[2rem] shadow-2xl border border-emerald-100 m-4">
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 text-white shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-bounce">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-emerald-600 text-4xl sm:text-5xl font-black font-headline tracking-tighter mb-4">출석 완료!</h3>
              <p className="text-emerald-800 text-xl font-bold bg-emerald-50 px-6 py-3 rounded-2xl">환영합니다! 은혜로운 시간 되세요.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative overlays */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/50 rounded-full blur-[120px] pointer-events-none"></div>
    </div>
  );
}
