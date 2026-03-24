import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QrScanner({ onSuccess, onError }) {
  const scannerRef = useRef(null);
  const containerId = 'qr-scanner-container';

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        onSuccess(decodedText);
      },
      () => {} // ignore per-frame errors
    ).catch(err => {
      if (onError) onError(err);
    });

    return () => {
      scanner.isScanning && scanner.stop().catch(() => {});
    };
  }, []);

  return <div id={containerId} className="w-full rounded-xl overflow-hidden" />;
}
