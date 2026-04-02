export const parseWeb3Error = (err) => {
  if (err?.code === 'ACTION_REJECTED') return "Bạn đã từ chối xác nhận giao dịch trên ví.";
  if (err?.code === 'INSUFFICIENT_FUNDS') return "Số dư không đủ để thanh toán phí mạng lưới (Gas).";
  if (err?.code === 'NETWORK_ERROR') return "Đường truyền tới mạng Blockchain đang gián đoạn, vui lòng kiểm tra kết nối mạng.";
  
  const reason = err?.reason || err?.message || "";
  if (reason.includes("execution reverted")) {
    if (reason.includes("Ho so da duoc duyet")) return "Hồ sơ này đã được tiếp nhận bởi một người khác (Race Condition).";
    if (reason.includes("Already claimed")) return "Người dân này đã nhận cứu trợ trước đó!";
    if (reason.includes("Invalid status")) return "Hồ sơ không ở trạng thái hợp lệ để duyệt.";
    return "Giao dịch bị từ chối bởi mạng (Smart Contract Reverted).";
  }

  return "Mạng lưới đang nghẽn hoặc có lỗi xảy ra, vui lòng thử lại sau.";
};
