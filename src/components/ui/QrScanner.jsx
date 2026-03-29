import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

let scannerCounter = 0;

/**
 * QrScanner — component quét mã QR dùng camera.
 *
 * Fixes:
 * 1. Dùng ref (isHandled) thay state để block trùng lặp — tránh race condition
 *    vì React setState là async còn ref thay đổi tức thì (synchronous).
 * 2. Dừng scanner ngay sau khi quét thành công, tránh quét lại nhiều lần.
 * 3. Xin quyền camera trước (getUserMedia) để mobile hiển thị dialog cấp phép đúng cách.
 * 4. Thêm nút "Cấp phép camera" khi bị từ chối hoặc lỗi khởi động.
 */
export default function QrScanner({ onSuccess, onError }) {
  const [containerId] = useState(() => `qr-scanner-${++scannerCounter}`);
  const [permissionState, setPermissionState] = useState('pending'); // 'pending' | 'granted' | 'denied' | 'error'
  const scannerRef = useRef(null);
  const isHandledRef = useRef(false);   // ref để block đồng bộ, tránh race condition
  const isMountedRef = useRef(true);

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  const startScanner = useCallback(async () => {
    if (!isMountedRef.current) return;

    // Bước 1: Xin quyền camera trước (quan trọng trên mobile)
    try {
      await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          // Dừng stream thử nghiệm, để Html5Qrcode tự quản lý sau
          stream.getTracks().forEach(t => t.stop());
        });
    } catch (permErr) {
      console.warn('Camera permission denied:', permErr);
      if (isMountedRef.current) setPermissionState('denied');
      // Do NOT trigger onError to avoid flash-loop for permission denied
      return;
    }

    if (!isMountedRef.current) return;

    // Bước 2: Khởi tạo html5-qrcode
    try {
      const scanner = new Html5Qrcode(containerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        (decodedText) => {
          // isHandledRef đảm bảo chỉ xử lý đúng 1 lần, kể cả nếu callback đến nhiều lần cùng lúc
          if (isHandledRef.current) return;
          isHandledRef.current = true;

          // Dừng scanner ngay để không quét thêm
          scanner.stop().catch(() => {}).finally(() => {
            if (isMountedRef.current && onSuccessRef.current) {
              onSuccessRef.current(decodedText);
            }
          });
        },
        () => { /* frame lỗi bình thường — bỏ qua */ }
      );

      if (isMountedRef.current) setPermissionState('granted');
    } catch (err) {
      console.error('QrScanner start error:', err);
      if (isMountedRef.current) {
        setPermissionState('error');
      }
      if (onErrorRef.current) onErrorRef.current(err);
    }
  }, [containerId]);

  useEffect(() => {
    isMountedRef.current = true;
    isHandledRef.current = false;
    startScanner();

    return () => {
      isMountedRef.current = false;
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch (_) {}
        scannerRef.current = null;
      }
    };
  }, [startScanner]);

  // --- UI ---

  if (permissionState === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4 bg-red-50 rounded-xl border border-red-200 text-center px-4">
        <span className="text-4xl">📷</span>
        <p className="font-semibold text-red-700">Chưa được cấp quyền camera</p>
        <p className="text-sm text-red-500">
          Vui lòng cho phép trình duyệt truy cập camera để quét mã QR.
        </p>
        <button
          onClick={() => {
            setPermissionState('pending');
            isHandledRef.current = false;
            startScanner();
          }}
          className="px-5 h-10 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
        >
          🔄 Thử lại & Cấp phép camera
        </button>
      </div>
    );
  }

  if (permissionState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4 bg-amber-50 rounded-xl border border-amber-200 text-center px-4">
        <span className="text-4xl">⚠️</span>
        <p className="font-semibold text-amber-700">Không thể khởi động camera</p>
        <p className="text-sm text-amber-500 text-center">
          Trình duyệt không hỗ trợ hoặc camera đang được sử dụng bởi ứng dụng khác.
        </p>
        <button
          onClick={() => {
            setPermissionState('pending');
            isHandledRef.current = false;
            startScanner();
          }}
          className="px-5 h-10 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors"
        >
          🔄 Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black">
      {/* Container scanner */}
      <div id={containerId} className="w-full rounded-xl overflow-hidden" />

      {/* Overlay loading khi đang pending */}
      {permissionState === 'pending' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white text-sm">Đang khởi động camera...</p>
        </div>
      )}
    </div>
  );
}
