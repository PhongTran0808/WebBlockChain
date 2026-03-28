import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

let scannerCounter = 0;

export default function QrScanner({ onSuccess, onError }) {
  const scannerRef = useRef(null);
  const [containerId] = useState(() => `qr-scanner-${++scannerCounter}`);
  const lastScanRef = useRef(0); // debounce: tránh quét 2 lần liên tiếp

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        const now = Date.now();
        if (now - lastScanRef.current < 2000) return; // debounce 2s
        lastScanRef.current = now;
        onSuccess(decodedText);
      },
      () => {}
    ).catch(err => {
      if (onError) onError(err);
    });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [containerId]);

  return <div id={containerId} className="w-full rounded-xl overflow-hidden" />;
}
