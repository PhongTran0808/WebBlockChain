require('dotenv').config();
const { ethers } = require('ethers');
const axios = require('axios');

// 1. Validate required env vars
const REQUIRED_VARS = ['RPC_URL', 'CONTRACT_ADDRESS', 'API_URL', 'ADMIN_TOKEN'];
const missing = REQUIRED_VARS.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`Thiếu biến môi trường bắt buộc: ${missing.join(', ')}`);
  console.error('Vui lòng tạo file .env từ .env.example và điền đầy đủ các giá trị.');
  process.exit(1);
}

const { RPC_URL, CONTRACT_ADDRESS, API_URL, ADMIN_TOKEN } = process.env;

// Minimal ABI — only the two events we need
const ABI = [
  'event BatchClaimed(uint256 indexed batchId, address indexed transporter)',
  'event BatchDelivered(uint256 indexed batchId, address indexed shop)',
];

async function main() {
  console.log('Kết nối blockchain...');
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  try {
    await provider.getBlockNumber();
  } catch (err) {
    console.error(`Không thể kết nối RPC provider: ${err.message}`);
    process.exit(1);
  }

  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  console.log('Quét lịch sử events...');
  const [claimedEvents, deliveredEvents] = await Promise.all([
    contract.queryFilter(contract.filters.BatchClaimed(), 0, 'latest'),
    contract.queryFilter(contract.filters.BatchDelivered(), 0, 'latest'),
  ]);

  console.log(`Tìm thấy ${claimedEvents.length} BatchClaimed, ${deliveredEvents.length} BatchDelivered`);

  // 4 & 5. Map events to items
  const items = [
    ...claimedEvents.map(e => ({
      batchId: Number(e.args.batchId),
      walletAddress: e.args.transporter,
      role: 'TRANSPORTER',
    })),
    ...deliveredEvents.map(e => ({
      batchId: Number(e.args.batchId),
      walletAddress: e.args.shop,
      role: 'SHOP',
    })),
  ];

  if (items.length === 0) {
    console.log('Không có bản ghi nào để phục hồi.');
    process.exit(0);
  }

  console.log(`Gửi ${items.length} bản ghi đến Recovery API...`);

  try {
    const response = await axios.post(
      `${API_URL}/api/admin/recover-wallets`,
      { items },
      { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
    );

    const { updatedCount, skippedCount } = response.data;
    console.log(`\n✅ Hoàn thành!`);
    console.log(`   Tổng bản ghi gửi : ${items.length}`);
    console.log(`   Cập nhật thành công: ${updatedCount}`);
    console.log(`   Bỏ qua            : ${skippedCount}`);
  } catch (err) {
    if (err.response) {
      console.error(`Lỗi từ API — HTTP ${err.response.status}:`);
      console.error(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(`Lỗi kết nối API: ${err.message}`);
    }
    process.exit(1);
  }
}

main();
