import React from 'react';

export default class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical Frontend Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gray-50">
          <div className="bg-red-50 text-red-700 p-6 rounded-2xl shadow-sm max-w-sm">
            <h2 className="text-xl font-bold mb-2">Rất tiếc, đã có lỗi hệ thống xảy ra 😢</h2>
            <p className="text-sm mb-6 text-red-600/80">Trang lưới đang gặp sự cố nhỏ. Vui lòng tải lại trang hoặc thử lại sau ít phút.</p>
            <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium rounded-xl transition-colors">
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children; 
  }
}
