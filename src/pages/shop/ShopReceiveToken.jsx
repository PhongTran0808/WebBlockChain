import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

export default function ShopReceiveToken() {
  const { user } = useAuth();

  // Tạo payload JSON để nhúng vào mã QR
  const qrPayload = JSON.stringify({
    shopId: user?.userId,
    shopName: user?.fullName || user?.username,
    walletAddress: user?.walletAddress
  });

  return (
    <div className="p-4 max-w-lg mx-auto pb-24 flex flex-col items-center">
      <div className="w-full bg-blue-700 text-white rounded-2xl p-6 mb-6 shadow-lg text-center">
        <h1 className="text-xl font-bold mb-2">Nhận Thanh Toán</h1>
        <p className="text-sm opacity-80">Đưa mã QR này cho người dân quét để thanh toán bằng Token</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center w-full max-w-sm border border-gray-100">
        <div className="mb-6 text-center">
          <h2 className="text-lg font-bold text-gray-800">{user?.fullName || user?.username}</h2>
          <p className="text-xs text-gray-400 mt-1 break-all px-4">{user?.walletAddress}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100 flex justify-center items-center">
          <QRCodeSVG 
            value={qrPayload} 
            size={240} 
            level={"H"} 
            includeMargin={false}
            imageSettings={{
              src: "https://cdn-icons-png.flaticon.com/512/3233/3233483.png",
              x: undefined,
              y: undefined,
              height: 40,
              width: 40,
              excavate: true,
            }}
          />
        </div>

        <div className="mt-8 px-4 py-3 bg-blue-50 text-blue-800 rounded-xl text-sm font-medium w-full text-center">
          Quét bằng ứng dụng Citizen để thanh toán
        </div>
      </div>
    </div>
  );
}
